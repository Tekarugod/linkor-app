Add-Type -AssemblyName System.Drawing

$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $PSScriptRoot
$sourcePath = Join-Path $root 'assets\logo.png'
$appIconPath = Join-Path $root 'assets\app-icon.png'
$icoPath = Join-Path $root 'assets\icon.ico'
$sizes = @(16, 24, 32, 48, 64, 128, 256)

function New-TransparentBitmap($width, $height) {
  $bitmap = New-Object System.Drawing.Bitmap $width, $height, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  try {
    $graphics.Clear([System.Drawing.Color]::Transparent)
  } finally {
    $graphics.Dispose()
  }
  return $bitmap
}

$source = [System.Drawing.Bitmap]::FromFile($sourcePath)
try {
  $masked = New-TransparentBitmap $source.Width $source.Height
  $minX = $source.Width
  $minY = $source.Height
  $maxX = 0
  $maxY = 0

  for ($y = 0; $y -lt $source.Height; $y++) {
    for ($x = 0; $x -lt $source.Width; $x++) {
      $pixel = $source.GetPixel($x, $y)
      $maxChannel = [Math]::Max($pixel.R, [Math]::Max($pixel.G, $pixel.B))
      $minChannel = [Math]::Min($pixel.R, [Math]::Min($pixel.G, $pixel.B))
      $saturation = $maxChannel - $minChannel

      # Drop the dark rounded tile while preserving the bright cyan/purple mark and its useful glow.
      if ($maxChannel -gt 86 -and $saturation -gt 36) {
        $alpha = [Math]::Min(255, [Math]::Max(64, ($maxChannel - 78) * 4))
        $masked.SetPixel($x, $y, [System.Drawing.Color]::FromArgb($alpha, $pixel.R, $pixel.G, $pixel.B))
        if ($x -lt $minX) { $minX = $x }
        if ($y -lt $minY) { $minY = $y }
        if ($x -gt $maxX) { $maxX = $x }
        if ($y -gt $maxY) { $maxY = $y }
      }
    }
  }

  if ($maxX -le $minX -or $maxY -le $minY) {
    throw 'Could not find visible icon content in logo.png.'
  }

  $contentWidth = $maxX - $minX + 1
  $contentHeight = $maxY - $minY + 1
  $canvas = New-TransparentBitmap 256 256
  $graphics = [System.Drawing.Graphics]::FromImage($canvas)
  try {
    $graphics.Clear([System.Drawing.Color]::Transparent)
    $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality

    $targetMax = 224
    $scale = [Math]::Min($targetMax / $contentWidth, $targetMax / $contentHeight)
    $targetWidth = [int][Math]::Round($contentWidth * $scale)
    $targetHeight = [int][Math]::Round($contentHeight * $scale)
    $targetX = [int][Math]::Round((256 - $targetWidth) / 2)
    $targetY = [int][Math]::Round((256 - $targetHeight) / 2)
    $sourceRect = New-Object System.Drawing.Rectangle $minX, $minY, $contentWidth, $contentHeight
    $targetRect = New-Object System.Drawing.Rectangle $targetX, $targetY, $targetWidth, $targetHeight
    $graphics.DrawImage($masked, $targetRect, $sourceRect, [System.Drawing.GraphicsUnit]::Pixel)
  } finally {
    $graphics.Dispose()
  }

  $canvas.Save($appIconPath, [System.Drawing.Imaging.ImageFormat]::Png)

  $pngEntries = @()
  foreach ($size in $sizes) {
    $resized = New-TransparentBitmap $size $size
    $graphics = [System.Drawing.Graphics]::FromImage($resized)
    try {
      $graphics.Clear([System.Drawing.Color]::Transparent)
      $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
      $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
      $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
      $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
      $graphics.DrawImage($canvas, 0, 0, $size, $size)
    } finally {
      $graphics.Dispose()
    }

    $stream = New-Object System.IO.MemoryStream
    try {
      $resized.Save($stream, [System.Drawing.Imaging.ImageFormat]::Png)
      $pngEntries += [pscustomobject]@{
        Size = $size
        Bytes = $stream.ToArray()
      }
    } finally {
      $stream.Dispose()
      $resized.Dispose()
    }
  }

  $icoStream = New-Object System.IO.MemoryStream
  $writer = New-Object System.IO.BinaryWriter($icoStream)
  try {
    $writer.Write([UInt16]0)
    $writer.Write([UInt16]1)
    $writer.Write([UInt16]$pngEntries.Count)

    $offset = 6 + ($pngEntries.Count * 16)
    foreach ($entry in $pngEntries) {
      $dimensionByte = if ($entry.Size -eq 256) { 0 } else { [byte]$entry.Size }
      $writer.Write([byte]$dimensionByte)
      $writer.Write([byte]$dimensionByte)
      $writer.Write([byte]0)
      $writer.Write([byte]0)
      $writer.Write([UInt16]1)
      $writer.Write([UInt16]32)
      $writer.Write([UInt32]$entry.Bytes.Length)
      $writer.Write([UInt32]$offset)
      $offset += $entry.Bytes.Length
    }

    foreach ($entry in $pngEntries) {
      $writer.Write($entry.Bytes)
    }

    $writer.Flush()
    [System.IO.File]::WriteAllBytes($icoPath, $icoStream.ToArray())
  } finally {
    $writer.Dispose()
    $icoStream.Dispose()
  }
} finally {
  if ($canvas) { $canvas.Dispose() }
  if ($masked) { $masked.Dispose() }
  $source.Dispose()
}
