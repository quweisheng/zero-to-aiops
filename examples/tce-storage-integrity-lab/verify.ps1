$ErrorActionPreference = 'Stop'
$labRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$workDirectory = Join-Path $labRoot '.verification'

if (Test-Path -LiteralPath $workDirectory) {
  Remove-Item -LiteralPath $workDirectory -Recurse -Force
}
New-Item -ItemType Directory -Path $workDirectory | Out-Null

$source = Join-Path $workDirectory 'source.bin'
$restored = Join-Path $workDirectory 'restored.bin'
$bytes = New-Object byte[] 1048576
[System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
[System.IO.File]::WriteAllBytes($source, $bytes)
Copy-Item -LiteralPath $source -Destination $restored

$sourceHash = (Get-FileHash -LiteralPath $source -Algorithm SHA256).Hash
$restoredHash = (Get-FileHash -LiteralPath $restored -Algorithm SHA256).Hash
if ($sourceHash -ne $restoredHash) { throw 'baseline copy integrity check failed' }
Write-Output "baseline=PASS sha256=$sourceHash"

$stream = [System.IO.File]::OpenWrite($restored)
try {
  $stream.Position = 0
  $stream.WriteByte(0)
} finally {
  $stream.Dispose()
}

$corruptedHash = (Get-FileHash -LiteralPath $restored -Algorithm SHA256).Hash
if ($sourceHash -eq $corruptedHash) { throw 'fault injection was not detected' }
Write-Output "fault-injection=DETECTED original=$sourceHash corrupted=$corruptedHash"

Remove-Item -LiteralPath $workDirectory -Recurse -Force
Write-Output 'tce-storage-integrity-lab verification passed and temporary data removed'
