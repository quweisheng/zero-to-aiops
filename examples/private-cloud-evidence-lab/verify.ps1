$ErrorActionPreference = 'Stop'
$labRoot = [System.IO.Path]::GetFullPath((Split-Path -Parent $MyInvocation.MyCommand.Path))
$workName = 'evidence-verification-' + [Guid]::NewGuid().ToString('N')
$verificationDirectory = [System.IO.Path]::GetFullPath((Join-Path $labRoot $workName))
$created = $false
$ownedFiles = @('healthy.md', 'degraded.md', 'invalid.json', 'invalid.md')
function Invoke-ExpectedRejection {
  param([string]$ScriptPath, [string]$InputFile, [string]$OutputFile)
  # Windows PowerShell turns redirected native stderr into error records.
  # Only this negative-test child may emit them; always check its exit code.
  $savedPreference = $ErrorActionPreference
  try {
    $ErrorActionPreference = 'Continue'
    $null = & powershell -NoProfile -ExecutionPolicy Bypass -File $ScriptPath `
      -InputPath $InputFile -OutputPath $OutputFile 2>&1
    $childExitCode = $LASTEXITCODE
  } finally {
    $ErrorActionPreference = $savedPreference
  }
  if ($childExitCode -ne 1) { throw "expected rejection exit 1, got $childExitCode" }
}
try {
  New-Item -ItemType Directory -Path $verificationDirectory -ErrorAction Stop | Out-Null
  $created = $true
  $auditScript = Join-Path $labRoot 'Invoke-PrivateCloudAudit.ps1'
  $healthyInput = Join-Path $labRoot 'fixtures\healthy.json'
  $healthyReport = Join-Path $verificationDirectory 'healthy.md'
  & powershell -NoProfile -ExecutionPolicy Bypass -File $auditScript -InputPath $healthyInput -OutputPath $healthyReport
  if ($LASTEXITCODE -ne 0) { throw 'healthy fixture should exit 0' }
  $healthyText = Get-Content -LiteralPath $healthyReport -Raw -Encoding UTF8
  if ($healthyText -notmatch '\*\*PASS\*\*') { throw 'healthy report must contain PASS' }

  $degradedReport = Join-Path $verificationDirectory 'degraded.md'
  & powershell -NoProfile -ExecutionPolicy Bypass -File $auditScript `
    -InputPath (Join-Path $labRoot 'fixtures\degraded.json') -OutputPath $degradedReport
  if ($LASTEXITCODE -ne 2) { throw 'degraded fixture should exit 2' }
  $degradedText = Get-Content -LiteralPath $degradedReport -Raw -Encoding UTF8
  foreach ($expected in @('\*\*DEGRADED\*\*', 'tke-control-plane', 'standby status=offline')) {
    if ($degradedText -notmatch $expected) { throw "degraded report missing: $expected" }
  }

  $beforeHash = (Get-FileHash -LiteralPath $healthyReport -Algorithm SHA256).Hash
  # Reusing a report name must fail without modifying the previous report.
  Invoke-ExpectedRejection -ScriptPath $auditScript -InputFile $healthyInput -OutputFile $healthyReport
  if ((Get-FileHash -LiteralPath $healthyReport -Algorithm SHA256).Hash -ne $beforeHash) {
    throw 'existing report was modified'
  }

  $invalidInput = Join-Path $verificationDirectory 'invalid.json'
  $invalidReport = Join-Path $verificationDirectory 'invalid.md'
  $cases = @('empty-platforms', 'missing-capacity', 'zero-total', 'negative-used',
    'string-used', 'zero-expected', 'fractional-ready', 'duplicate-platform', 'invalid-time')
  foreach ($case in $cases) {
    $sample = Get-Content -LiteralPath $healthyInput -Raw -Encoding UTF8 | ConvertFrom-Json
    switch ($case) {
      'empty-platforms' { $sample.platforms = @() }
      'missing-capacity' { $sample.platforms[0].PSObject.Properties.Remove('capacity') }
      'zero-total' { $sample.platforms[0].capacity[0].total = 0 }
      'negative-used' { $sample.platforms[0].capacity[0].used = -1 }
      'string-used' { $sample.platforms[0].capacity[0].used = '420' }
      'zero-expected' { $sample.platforms[0].components[0].expected = 0 }
      'fractional-ready' { $sample.platforms[0].components[0].ready = 1.5 }
      'duplicate-platform' { $sample.platforms += $sample.platforms[0] }
      'invalid-time' { $sample.snapshotAt = 'not-a-time' }
    }
    $sample | ConvertTo-Json -Depth 20 | Set-Content -LiteralPath $invalidInput -Encoding UTF8
    Invoke-ExpectedRejection -ScriptPath $auditScript -InputFile $invalidInput -OutputFile $invalidReport
    if (Test-Path -LiteralPath $invalidReport) { throw "invalid case produced a report: $case" }
    Write-Output "invalid-input=$case REJECTED"
  }
} finally {
  if ($created) {
    $resolvedWork = [System.IO.Path]::GetFullPath($verificationDirectory)
    if ((Split-Path -Parent $resolvedWork) -ne $labRoot -or (Split-Path -Leaf $resolvedWork) -ne $workName) {
      throw 'refusing cleanup outside the exact directory created by this run'
    }
    $workItem = Get-Item -LiteralPath $resolvedWork -Force
    if (($workItem.Attributes -band [System.IO.FileAttributes]::ReparsePoint) -ne 0) {
      throw 'refusing cleanup through a reparse point'
    }
    foreach ($fileName in $ownedFiles) {
      $ownedFile = Join-Path $resolvedWork $fileName
      if (Test-Path -LiteralPath $ownedFile -PathType Leaf) { Remove-Item -LiteralPath $ownedFile -Force }
    }
    # Refuse to recursively erase unexpected contents.
    [System.IO.Directory]::Delete($resolvedWork, $false)
  }
}
Write-Output 'private-cloud-evidence-lab verification passed'
