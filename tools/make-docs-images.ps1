Add-Type -AssemblyName System.Drawing

$root = Split-Path -Parent $PSScriptRoot
$docs = Join-Path $root 'docs'
$skins = Join-Path $docs 'skins'

function New-Background([int]$w, [int]$h) {
  $bmp = New-Object System.Drawing.Bitmap($w, $h, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit
  $rect = New-Object System.Drawing.Rectangle(0, 0, $w, $h)
  $bg = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
    $rect,
    [System.Drawing.ColorTranslator]::FromHtml('#080f15'),
    [System.Drawing.ColorTranslator]::FromHtml('#102c33'),
    35
  )
  $g.FillRectangle($bg, $rect)
  $bg.Dispose()

  $pen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(9, 255, 255, 255), 1)
  for ($x = 0; $x -lt $w; $x += 80) { $g.DrawLine($pen, $x, 0, $x, $h) }
  for ($y = 0; $y -lt $h; $y += 80) { $g.DrawLine($pen, 0, $y, $w, $y) }
  $pen.Dispose()

  $glow = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(18, 0, 229, 255))
  $g.FillEllipse($glow, [int]($w * 0.52), [int]($h * 0.08), [int]($w * 0.62), [int]($h * 0.86))
  $glow.Dispose()

  return @{ Bitmap = $bmp; Graphics = $g }
}

function Draw-Text($g, [string]$text, [string]$family, [float]$size, $style, $color, [float]$x, [float]$y) {
  $font = New-Object System.Drawing.Font($family, $size, $style, [System.Drawing.GraphicsUnit]::Pixel)
  $brush = New-Object System.Drawing.SolidBrush($color)
  $g.DrawString($text, $font, $brush, $x, $y)
  $brush.Dispose()
  $font.Dispose()
}

function Draw-ImageFile($g, [string]$path, [int]$x, [int]$y, [int]$w, [int]$h) {
  $img = [System.Drawing.Image]::FromFile($path)
  $g.DrawImage($img, $x, $y, $w, $h)
  $img.Dispose()
}

function New-RoundedRect([int]$x, [int]$y, [int]$w, [int]$h, [int]$r) {
  $path = New-Object System.Drawing.Drawing2D.GraphicsPath
  $d = $r * 2
  $path.AddArc($x, $y, $d, $d, 180, 90)
  $path.AddArc($x + $w - $d, $y, $d, $d, 270, 90)
  $path.AddArc($x + $w - $d, $y + $h - $d, $d, $d, 0, 90)
  $path.AddArc($x, $y + $h - $d, $d, $d, 90, 90)
  $path.CloseFigure()
  return $path
}

function New-Hero([string]$out, [bool]$chinese) {
  $canvas = New-Background 1600 760
  $g = $canvas.Graphics

  $gold = [System.Drawing.ColorTranslator]::FromHtml('#e2bb73')
  $white = [System.Drawing.ColorTranslator]::FromHtml('#f5f1e8')
  $muted = [System.Drawing.ColorTranslator]::FromHtml('#a9b9bc')
  $dim = [System.Drawing.ColorTranslator]::FromHtml('#789094')

  Draw-Text $g 'DAODIAN  ·  到点' 'Microsoft YaHei' 25 ([System.Drawing.FontStyle]::Bold) $gold 96 92

  if ($chinese) {
    Draw-Text $g '你的工作日，' 'Microsoft YaHei' 66 ([System.Drawing.FontStyle]::Bold) $white 96 158
    Draw-Text $g '按秒计价。' 'Microsoft YaHei' 66 ([System.Drawing.FontStyle]::Bold) $white 96 242
    Draw-Text $g '一个会涨钱的 Windows 桌面小组件：' 'Microsoft YaHei' 21 ([System.Drawing.FontStyle]::Regular) $muted 96 352
    Draw-Text $g '今天的工资一点点填满，加班后的时薪一秒秒变薄。' 'Microsoft YaHei' 21 ([System.Drawing.FontStyle]::Regular) $muted 96 384
    Draw-Text $g '6 套皮肤   ·   自动昼夜   ·   加班时薪   ·   隐私模式' 'Microsoft YaHei' 17 ([System.Drawing.FontStyle]::Regular) $gold 96 466
  } else {
    Draw-Text $g 'Your workday,' 'Segoe UI' 66 ([System.Drawing.FontStyle]::Bold) $white 96 158
    Draw-Text $g 'priced by the second.' 'Segoe UI' 66 ([System.Drawing.FontStyle]::Bold) $white 96 242
    Draw-Text $g 'A tiny Windows widget that fills with today''s pay —' 'Segoe UI' 21 ([System.Drawing.FontStyle]::Regular) $muted 96 352
    Draw-Text $g 'and shows how fast your hourly rate dilutes when you stay late.' 'Segoe UI' 21 ([System.Drawing.FontStyle]::Regular) $muted 96 384
    Draw-Text $g '6 skins   ·   auto day/night   ·   overtime rate   ·   privacy mode' 'Segoe UI' 17 ([System.Drawing.FontStyle]::Regular) $gold 96 466
  }

  $linePen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(38, 226, 187, 115), 1)
  $g.DrawLine($linePen, 96, 548, 700, 548)
  $linePen.Dispose()

  Draw-Text $g 'v0.3.1   ·   Windows 10 / 11   ·   MIT' 'Segoe UI' 15 ([System.Drawing.FontStyle]::Regular) $dim 96 690

  Draw-ImageFile $g (Join-Path $docs 'overtime.png') 856 186 720 388

  $path = Join-Path $docs ($(if ($chinese) { 'hero-zh.png' } else { 'hero.png' }))
  $canvas.Bitmap.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
  $g.Dispose()
  $canvas.Bitmap.Dispose()
  Write-Output "wrote $path"
}

function New-Gallery() {
  $canvas = New-Background 1584 1480
  $g = $canvas.Graphics
  $white = [System.Drawing.ColorTranslator]::FromHtml('#f3ede2')
  $muted = [System.Drawing.ColorTranslator]::FromHtml('#8fa2a7')
  $gold = [System.Drawing.ColorTranslator]::FromHtml('#e2bb73')

  $items = @(
    @{ file = 'cream.png';   name = 'Cream Journal / 奶油手账';   desc = 'Paper-warm, easy on the eyes' },
    @{ file = 'neon.png';    name = 'Cyber Neon / 赛博霓虹';      desc = 'Late-shift glow' },
    @{ file = 'pixel.png';   name = 'Pixel Worker / 像素打工人';  desc = '8-bit company' },
    @{ file = 'jar.png';     name = 'Glass Jar / 玻璃存钱罐';     desc = 'Coins you can see' },
    @{ file = 'receipt.png'; name = 'Retro Payslip / 复古工资条'; desc = 'A payslip with a stamp' },
    @{ file = 'cat.png';     name = 'Cat Companion / 猫咪陪伴';   desc = 'The cat stays late' }
  )

  for ($i = 0; $i -lt $items.Count; $i++) {
    $col = $i % 2
    $row = [math]::Floor($i / 2)
    $x = 40 + $col * 784
    $y = 40 + $row * 476
    $tile = New-RoundedRect $x $y 720 388 18
    $fill = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 14, 22, 29))
    $g.FillPath($fill, $tile)
    $fill.Dispose()
    $border = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(255, 32, 45, 54), 1)
    $g.DrawPath($border, $tile)
    $border.Dispose()
    $tile.Dispose()

    Draw-ImageFile $g (Join-Path $skins $items[$i].file) $x $y 720 388
    Draw-Text $g $items[$i].name 'Microsoft YaHei' 23 ([System.Drawing.FontStyle]::Bold) $white ($x + 2) ($y + 404)
    Draw-Text $g $items[$i].desc 'Segoe UI' 15 ([System.Drawing.FontStyle]::Regular) $muted ($x + 2) ($y + 438)
  }

  $path = Join-Path $docs 'skins.png'
  $canvas.Bitmap.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
  $g.Dispose()
  $canvas.Bitmap.Dispose()
  Write-Output "wrote $path"
}

function New-Overtime() {
  $canvas = New-Background 1600 640
  $g = $canvas.Graphics
  $white = [System.Drawing.ColorTranslator]::FromHtml('#f5f1e8')
  $muted = [System.Drawing.ColorTranslator]::FromHtml('#a9b9bc')
  $gold = [System.Drawing.ColorTranslator]::FromHtml('#e2bb73')

  Draw-Text $g "The bar fills. The rate doesn't." 'Segoe UI' 38 ([System.Drawing.FontStyle]::Bold) $white 48 34
  Draw-Text $g 'Daily pay is fixed. Every extra hour stretches it thinner.' 'Segoe UI' 19 ([System.Drawing.FontStyle]::Regular) $muted 48 88

  Draw-Text $g '10:12  ·  Working / 工作中' 'Microsoft YaHei' 16 ([System.Drawing.FontStyle]::Bold) $gold 48 128
  Draw-Text $g '19:30  ·  Overtime / 加班中' 'Microsoft YaHei' 16 ([System.Drawing.FontStyle]::Bold) $gold 832 128

  Draw-ImageFile $g (Join-Path $skins 'cream.png') 48 160 720 388
  Draw-ImageFile $g (Join-Path $docs 'overtime.png') 832 160 720 388

  Draw-Text $g 'effective hourly = daily pay ÷ (worked hours + overtime hours)' 'Segoe UI' 17 ([System.Drawing.FontStyle]::Regular) $gold 48 584

  $path = Join-Path $docs 'overtime-compare.png'
  $canvas.Bitmap.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
  $g.Dispose()
  $canvas.Bitmap.Dispose()
  Write-Output "wrote $path"
}

New-Hero (Join-Path $docs 'hero.png') $false
New-Hero (Join-Path $docs 'hero-zh.png') $true
New-Gallery
New-Overtime
