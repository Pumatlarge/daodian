Add-Type -AssemblyName System.Drawing

function New-RoundedPath([int]$w, [int]$h, [int]$r) {
  $path = New-Object System.Drawing.Drawing2D.GraphicsPath
  $d = $r * 2
  $path.AddArc(0, 0, $d, $d, 180, 90)
  $path.AddArc($w - $d, 0, $d, $d, 270, 90)
  $path.AddArc($w - $d, $h - $d, $d, $d, 0, 90)
  $path.AddArc(0, $h - $d, $d, $d, 90, 90)
  $path.CloseFigure()
  return $path
}

function New-Icon([int]$size, [string]$path, [bool]$plate) {
  $bmp = New-Object System.Drawing.Bitmap($size, $size, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit
  $g.Clear([System.Drawing.Color]::Transparent)

  $pad = [Math]::Round($size * 0.03)
  $inner = $size - $pad * 2

  if ($plate) {
    $platePath = New-RoundedPath $inner $inner ([int]($inner * 0.23))
    $plateRect = New-Object System.Drawing.Rectangle($pad, $pad, $inner, $inner)
    $plateBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
      $plateRect,
      [System.Drawing.ColorTranslator]::FromHtml('#232833'),
      [System.Drawing.ColorTranslator]::FromHtml('#12151c'),
      55
    )
    $g.FillPath($plateBrush, $platePath)
    $platePen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(40, 255, 255, 255), [Math]::Max(1, $size * 0.004))
    $g.DrawPath($platePen, $platePath)
    $g.TranslateTransform($pad, $pad)
    $size = $inner
  }

  $coinPad = [Math]::Round($size * 0.12)
  $coinSize = $size - $coinPad * 2
  $coinRect = New-Object System.Drawing.Rectangle($coinPad, $coinPad, $coinSize, $coinSize)
  $coinBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
    $coinRect,
    [System.Drawing.ColorTranslator]::FromHtml('#ffe9b5'),
    [System.Drawing.ColorTranslator]::FromHtml('#c6923a'),
    90
  )
  $g.FillEllipse($coinBrush, $coinRect)

  $ringPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(70, 92, 62, 16), [Math]::Max(1, $size * 0.012))
  $ringPad = [Math]::Round($coinPad + $size * 0.05)
  $g.DrawEllipse($ringPen, $ringPad, $ringPad, $size - $ringPad * 2, $size - $ringPad * 2)

  $fontSize = [Math]::Max(8, [int]($size * 0.52))
  $font = New-Object System.Drawing.Font('Microsoft YaHei', $fontSize, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
  $format = New-Object System.Drawing.StringFormat
  $format.Alignment = [System.Drawing.StringAlignment]::Center
  $format.LineAlignment = [System.Drawing.StringAlignment]::Center
  $textRect = New-Object System.Drawing.RectangleF([float]0, [float](-$size * 0.02), [float]$size, [float]$size)
  $textBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 56, 36, 6))
  $yen = [string][char]0x00A5
  $g.DrawString($yen, $font, $textBrush, $textRect, $format)

  $bmp.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
  $g.Dispose()
  $bmp.Dispose()
  $font.Dispose()
  $textBrush.Dispose()
  $coinBrush.Dispose()
  $ringPen.Dispose()
}

$root = Split-Path -Parent $PSScriptRoot
$assets = Join-Path $root 'assets'
New-Item -ItemType Directory -Force -Path $assets | Out-Null

New-Icon 256 (Join-Path $assets 'icon.png') $true
New-Icon 32 (Join-Path $assets 'tray.png') $false
New-Icon 64 (Join-Path $assets 'tray@2x.png') $false
Write-Output 'icons written'
