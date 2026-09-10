param(
  [Parameter(Mandatory = $true)]
  [string]$InputPath,

  [Parameter(Mandatory = $true)]
  [string]$OutputPath
)

$ErrorActionPreference = 'Stop'
$warningThreshold = 85
$criticalThreshold = 90

function Get-Percent {
  param([double]$Used, [double]$Total)
  if ($Total -le 0 -or $Used -lt 0 -or [double]::IsNaN($Used) -or
      [double]::IsInfinity($Used) -or [double]::IsNaN($Total) -or [double]::IsInfinity($Total)) {
    throw 'capacity requires finite used >= 0 and total > 0'
  }
  return [Math]::Round(($Used / $Total) * 100, 2)
}

function Get-CapacityLevel {
  param([double]$Percent)
  if ($Percent -ge $criticalThreshold) { return 'CRITICAL' }
  if ($Percent -ge $warningThreshold) { return 'WARNING' }
  return 'OK'
}

$resolvedInput = (Resolve-Path -LiteralPath $InputPath).Path
$data = Get-Content -LiteralPath $resolvedInput -Raw -Encoding UTF8 | ConvertFrom-Json

function Assert-Text {
  param($Value, [string]$Field)
  if ($Value -isnot [string] -or [string]::IsNullOrWhiteSpace($Value)) {
    throw "invalid or missing text: $Field"
  }
}

function Assert-Array {
  param($Value, [string]$Field)
  if ($Value -isnot [array] -or $Value.Count -eq 0) { throw "non-empty array required: $Field" }
}

function Assert-Number {
  param($Value, [string]$Field, [bool]$Positive = $false, [bool]$Integer = $false)
  if (($Value -isnot [int]) -and ($Value -isnot [long]) -and
      ($Value -isnot [double]) -and ($Value -isnot [decimal])) {
    throw "numeric value required: $Field"
  }
  $number = [double]$Value
  if ([double]::IsNaN($number) -or [double]::IsInfinity($number) -or
      $number -lt 0 -or ($Positive -and $number -le 0) -or
      ($Integer -and [Math]::Truncate($number) -ne $number)) { throw "invalid numeric value: $Field" }
}

Assert-Text $data.snapshotAt 'snapshotAt'
$parsedSnapshot = [DateTimeOffset]::MinValue
if ($data.snapshotAt -notmatch '^\d{4}-\d{2}-\d{2}T.+(?:Z|[+-]\d{2}:\d{2})$' -or
    -not [DateTimeOffset]::TryParse($data.snapshotAt, [ref]$parsedSnapshot)) {
  throw 'snapshotAt must be a valid ISO timestamp with timezone'
}
Assert-Text $data.dataClassification 'dataClassification'
Assert-Array $data.platforms 'platforms'
$seenPlatforms = [System.Collections.Generic.HashSet[string]]::new([StringComparer]::Ordinal)
foreach ($platform in $data.platforms) {
  foreach ($field in @('platform', 'productForm', 'version', 'patch', 'evidenceSource')) {
    Assert-Text $platform.$field "platform.$field"
  }
  if (-not $seenPlatforms.Add($platform.platform)) { throw 'duplicate platform identity' }
  foreach ($field in @('managementNodes', 'capacity', 'components')) {
    Assert-Array $platform.$field "$($platform.platform).$field"
  }
  $seenNodes = [System.Collections.Generic.HashSet[string]]::new([StringComparer]::Ordinal)
  foreach ($node in $platform.managementNodes) {
    Assert-Text $node.role 'managementNodes.role'
    Assert-Text $node.status 'managementNodes.status'
    if (-not $seenNodes.Add($node.role)) { throw 'duplicate management role' }
  }
  $seenCapacity = [System.Collections.Generic.HashSet[string]]::new([StringComparer]::Ordinal)
  foreach ($capacity in $platform.capacity) {
    Assert-Text $capacity.resource 'capacity.resource'
    Assert-Text $capacity.unit 'capacity.unit'
    Assert-Number $capacity.used 'capacity.used'
    Assert-Number $capacity.total 'capacity.total' -Positive $true
    if (-not $seenCapacity.Add($capacity.resource)) { throw 'duplicate capacity resource' }
  }
  $seenComponents = [System.Collections.Generic.HashSet[string]]::new([StringComparer]::Ordinal)
  foreach ($component in $platform.components) {
    foreach ($field in @('layer', 'name', 'status')) { Assert-Text $component.$field "component.$field" }
    Assert-Number $component.ready 'component.ready' -Integer $true
    Assert-Number $component.expected 'component.expected' -Positive $true -Integer $true
    $identity = "$($component.layer.Length):$($component.layer)$($component.name)"
    if (-not $seenComponents.Add($identity)) { throw 'duplicate component identity' }
  }
}

$findings = [System.Collections.Generic.List[object]]::new()
$capacityRows = [System.Collections.Generic.List[object]]::new()
$componentRows = [System.Collections.Generic.List[object]]::new()

foreach ($platform in $data.platforms) {
  foreach ($node in @($platform.managementNodes)) {
    if ($node.status -ne 'online') {
      $findings.Add([pscustomobject]@{
        Level = 'CRITICAL'
        Scope = "$($platform.platform)/management"
        Evidence = "$($node.role) status=$($node.status)"
        Next = 'Confirm node, power, management network, and active/standby relation. Do not force a failover.'
      })
    }
  }

  foreach ($capacity in @($platform.capacity)) {
    $percent = Get-Percent -Used $capacity.used -Total $capacity.total
    $level = Get-CapacityLevel -Percent $percent
    $capacityRows.Add([pscustomobject]@{
      Platform = $platform.platform
      Resource = $capacity.resource
      Used = $capacity.used
      Total = $capacity.total
      Unit = $capacity.unit
      Percent = $percent
      Level = $level
    })
    if ($level -ne 'OK') {
      $findings.Add([pscustomobject]@{
        Level = $level
        Scope = "$($platform.platform)/capacity/$($capacity.resource)"
        Evidence = "used=$($capacity.used) total=$($capacity.total) percent=$percent%"
        Next = 'Check growth, reserve, fault redundancy, quota, and reclaimable capacity before taking action.'
      })
    }
  }

  foreach ($component in @($platform.components)) {
    $status = if (($component.ready -eq $component.expected) -and ($component.status -eq 'online')) { 'OK' } else { 'CRITICAL' }
    $componentRows.Add([pscustomobject]@{
      Platform = $platform.platform
      Layer = $component.layer
      Name = $component.name
      Ready = "$($component.ready)/$($component.expected)"
      Status = $component.status
      Level = $status
    })
    if ($status -ne 'OK') {
      $findings.Add([pscustomobject]@{
        Level = 'CRITICAL'
        Scope = "$($platform.platform)/$($component.layer)/$($component.name)"
        Evidence = "ready=$($component.ready)/$($component.expected) status=$($component.status)"
        Next = 'Check ingress, control plane, data plane, and dependencies; escalate closed internals to vendor support.'
      })
    }
  }
}

$overall = if ($findings.Count -eq 0) { 'PASS' } else { 'DEGRADED' }
$lines = [System.Collections.Generic.List[string]]::new()
$lines.Add('# Private Cloud Read-only Evidence Report')
$lines.Add('')
$lines.Add("- Snapshot time: $($data.snapshotAt)")
$lines.Add("- Data classification: $($data.dataClassification)")
$lines.Add("- Overall result: **$overall**")
$lines.Add('- Boundary: this report only evaluates the input snapshot; it does not prove live status, license scope, or vendor support validity.')
$lines.Add('')
$lines.Add('## Platform version ledger')
$lines.Add('')
$lines.Add('| Platform | Product form | Version | Patch/Hotfix | Evidence source |')
$lines.Add('|---|---|---|---|---|')
foreach ($platform in $data.platforms) {
  $lines.Add("| $($platform.platform) | $($platform.productForm) | $($platform.version) | $($platform.patch) | $($platform.evidenceSource) |")
}
$lines.Add('')
$lines.Add('## Capacity')
$lines.Add('')
$lines.Add('| Platform | Resource | Used | Total | Usage | Level |')
$lines.Add('|---|---|---:|---:|---:|---|')
foreach ($row in $capacityRows) {
  $lines.Add("| $($row.Platform) | $($row.Resource) | $($row.Used) $($row.Unit) | $($row.Total) $($row.Unit) | $($row.Percent)% | $($row.Level) |")
}
$lines.Add('')
$lines.Add('## Components')
$lines.Add('')
$lines.Add('| Platform | Layer | Component | Ready | Status | Level |')
$lines.Add('|---|---|---|---:|---|---|')
foreach ($row in $componentRows) {
  $lines.Add("| $($row.Platform) | $($row.Layer) | $($row.Name) | $($row.Ready) | $($row.Status) | $($row.Level) |")
}
$lines.Add('')
$lines.Add('## Findings')
$lines.Add('')
if ($findings.Count -eq 0) {
  $lines.Add('No threshold finding was detected. Business probes, trends, alerts, logs, and changes are still required.')
} else {
  $lines.Add('| Level | Scope | Evidence | Next step |')
  $lines.Add('|---|---|---|---|')
  foreach ($finding in $findings) {
    $lines.Add("| $($finding.Level) | $($finding.Scope) | $($finding.Evidence) | $($finding.Next) |")
  }
}
$lines.Add('')
$lines.Add('## Manual confirmation checklist')
$lines.Add('')
$lines.Add('- [ ] Critical paths were verified with business probes, not only green components.')
$lines.Add('- [ ] Version, patch, build, compatibility, and support evidence were checked.')
$lines.Add('- [ ] Capacity includes fault reserve, quota, and unreclaimable space.')
$lines.Add('- [ ] Every change has approval, impact scope, backup, stop conditions, and rollback.')

$resolvedOutput = [System.IO.Path]::GetFullPath($OutputPath)
$outputDirectory = Split-Path -Parent $resolvedOutput
if (-not (Test-Path -LiteralPath $outputDirectory)) {
  New-Item -ItemType Directory -Path $outputDirectory -Force | Out-Null
}
# CreateNew prevents both accidental replacement and a check-then-write race.
$outputStream = [System.IO.File]::Open($resolvedOutput, [System.IO.FileMode]::CreateNew,
  [System.IO.FileAccess]::Write, [System.IO.FileShare]::None)
try {
  $encoding = [System.Text.UTF8Encoding]::new($true)
  $writer = [System.IO.StreamWriter]::new($outputStream, $encoding)
  try { $writer.WriteLine(($lines -join [Environment]::NewLine)) } finally { $writer.Dispose() }
} finally { $outputStream.Dispose() }
Write-Output "report=$resolvedOutput result=$overall findings=$($findings.Count)"

if ($overall -eq 'PASS') { exit 0 }
exit 2
