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
  if ($Total -le 0) { return 0 }
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

if (-not $data.snapshotAt -or -not $data.platforms) {
  throw 'input must contain snapshotAt and platforms'
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
$lines | Set-Content -LiteralPath $resolvedOutput -Encoding UTF8
Write-Output "report=$resolvedOutput result=$overall findings=$($findings.Count)"

if ($overall -eq 'PASS') { exit 0 }
exit 2
