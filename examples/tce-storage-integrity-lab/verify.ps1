$ErrorActionPreference = 'Stop'
$labRoot = [System.IO.Path]::GetFullPath((Split-Path -Parent $MyInvocation.MyCommand.Path))
$workName = '.verification-' + [Guid]::NewGuid().ToString('N')
$workDirectory = [System.IO.Path]::GetFullPath((Join-Path $labRoot $workName))
$created = $false
try {
  # Create a new private directory; never remove a previous learner's files.
  New-Item -ItemType Directory -Path $workDirectory -ErrorAction Stop | Out-Null
  $created = $true
  $source = Join-Path $workDirectory 'source.bin'
  $restored = Join-Path $workDirectory 'restored.bin'
  $bytes = New-Object byte[] 1048576
  $rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
  try { $rng.GetBytes($bytes) } finally { $rng.Dispose() }
  [System.IO.File]::WriteAllBytes($source, $bytes)
  Copy-Item -LiteralPath $source -Destination $restored

  $sourceHash = (Get-FileHash -LiteralPath $source -Algorithm SHA256).Hash
  $restoredHash = (Get-FileHash -LiteralPath $restored -Algorithm SHA256).Hash
  if ($sourceHash -ne $restoredHash) { throw 'baseline copy integrity check failed' }
  Write-Output "baseline=PASS sha256=$sourceHash"

  $stream = [System.IO.File]::OpenWrite($restored)
  try {
    $stream.Position = 0
    # XOR flips one bit even when the original byte is already zero.
    $stream.WriteByte([byte]($bytes[0] -bxor 1))
  } finally {
    $stream.Dispose()
  }

  $corruptedHash = (Get-FileHash -LiteralPath $restored -Algorithm SHA256).Hash
  if ($sourceHash -eq $corruptedHash) { throw 'fault injection was not detected' }
  Write-Output "fault-injection=DETECTED original=$sourceHash corrupted=$corruptedHash"
} finally {
  if ($created) {
    $resolvedWork = [System.IO.Path]::GetFullPath($workDirectory)
    if ((Split-Path -Parent $resolvedWork) -ne $labRoot -or
        (Split-Path -Leaf $resolvedWork) -ne $workName) {
      throw 'refusing cleanup outside the exact directory created by this run'
    }
    $workItem = Get-Item -LiteralPath $resolvedWork -Force
    if (($workItem.Attributes -band [System.IO.FileAttributes]::ReparsePoint) -ne 0) {
      throw 'refusing cleanup through a reparse point'
    }
    foreach ($fileName in @('source.bin', 'restored.bin')) {
      $ownedFile = Join-Path $resolvedWork $fileName
      if (Test-Path -LiteralPath $ownedFile -PathType Leaf) {
        Remove-Item -LiteralPath $ownedFile -Force
      }
    }
    # Non-recursive deletion refuses to remove unexpected extra contents.
    [System.IO.Directory]::Delete($resolvedWork, $false)
  }
}
Write-Output 'tce-storage-integrity-lab verification passed and temporary data removed'
