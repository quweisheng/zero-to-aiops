$ErrorActionPreference = 'Stop'
$labRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$verificationDirectory = Join-Path $labRoot 'evidence-verification'

if (Test-Path -LiteralPath $verificationDirectory) {
  Remove-Item -LiteralPath $verificationDirectory -Recurse -Force
}
New-Item -ItemType Directory -Path $verificationDirectory | Out-Null

$healthyReport = Join-Path $verificationDirectory 'healthy.md'
& powershell -NoProfile -ExecutionPolicy Bypass -File (Join-Path $labRoot 'Invoke-PrivateCloudAudit.ps1') `
  -InputPath (Join-Path $labRoot 'fixtures\healthy.json') `
  -OutputPath $healthyReport
if ($LASTEXITCODE -ne 0) { throw 'healthy fixture should exit 0' }
$healthyText = Get-Content -LiteralPath $healthyReport -Raw -Encoding UTF8
if ($healthyText -notmatch '\*\*PASS\*\*') { throw 'healthy report must contain PASS' }

$degradedReport = Join-Path $verificationDirectory 'degraded.md'
& powershell -NoProfile -ExecutionPolicy Bypass -File (Join-Path $labRoot 'Invoke-PrivateCloudAudit.ps1') `
  -InputPath (Join-Path $labRoot 'fixtures\degraded.json') `
  -OutputPath $degradedReport
if ($LASTEXITCODE -ne 2) { throw 'degraded fixture should exit 2' }
$degradedText = Get-Content -LiteralPath $degradedReport -Raw -Encoding UTF8
if ($degradedText -notmatch '\*\*DEGRADED\*\*') { throw 'degraded report must contain DEGRADED' }
if ($degradedText -notmatch 'tke-control-plane') { throw 'degraded report must identify TCE component' }
if ($degradedText -notmatch 'standby status=offline') { throw 'degraded report must identify FusionSphere management node' }

Remove-Item -LiteralPath $verificationDirectory -Recurse -Force
Write-Output 'private-cloud-evidence-lab verification passed'
