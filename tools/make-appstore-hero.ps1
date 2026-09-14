param(
  [Parameter(Mandatory = $true)][string]$Background,
  [string]$Output = "output/appstore/vocbee-hero-tr.png"
)

Add-Type -AssemblyName System.Drawing

$width = 1206
$height = 2622
$gold = [System.Drawing.ColorTranslator]::FromHtml('#FFD700')
$cream = [System.Drawing.ColorTranslator]::FromHtml('#FFF7EB')
$green = [System.Drawing.ColorTranslator]::FromHtml('#1A2C22')

$fontCollection = New-Object System.Drawing.Text.PrivateFontCollection
$fontCollection.AddFontFile((Resolve-Path 'node_modules/@expo-google-fonts/special-gothic-expanded-one/400Regular/SpecialGothicExpandedOne_400Regular.ttf'))
$fontCollection.AddFontFile((Resolve-Path 'node_modules/@expo-google-fonts/rubik-mono-one/400Regular/RubikMonoOne_400Regular.ttf'))
$special = $fontCollection.Families | Where-Object Name -Like 'Special Gothic*' | Select-Object -First 1
$rubik = $fontCollection.Families | Where-Object Name -Like 'Rubik Mono*' | Select-Object -First 1

$source = [System.Drawing.Image]::FromFile((Resolve-Path $Background))
$canvas = New-Object System.Drawing.Bitmap $width, $height
$canvas.SetResolution(72, 72)
$graphics = [System.Drawing.Graphics]::FromImage($canvas)
$graphics.SmoothingMode = 'HighQuality'
$graphics.InterpolationMode = 'HighQualityBicubic'
$graphics.PixelOffsetMode = 'HighQuality'
$graphics.TextRenderingHint = 'AntiAliasGridFit'

# Cover-crop the generated art to the exact iPhone screenshot size.
$scale = [Math]::Max($width / $source.Width, $height / $source.Height)
$drawWidth = [int][Math]::Ceiling($source.Width * $scale)
$drawHeight = [int][Math]::Ceiling($source.Height * $scale)
$graphics.DrawImage($source, [int](($width - $drawWidth) / 2), [int](($height - $drawHeight) / 2), $drawWidth, $drawHeight)

# Preserve the artwork while creating a calm, readable headline zone.
$overlayRect = New-Object System.Drawing.Rectangle 0, 0, $width, 1180
$overlayBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
  $overlayRect,
  [System.Drawing.Color]::FromArgb(220, 4, 18, 13),
  [System.Drawing.Color]::FromArgb(0, 4, 18, 13),
  90
)
$graphics.FillRectangle($overlayBrush, $overlayRect)

function Draw-CenteredText {
  param([string]$Text, [System.Drawing.FontFamily]$Family, [float]$Size, [System.Drawing.Color]$Color, [float]$Y)
  $font = New-Object System.Drawing.Font $Family, $Size, ([System.Drawing.FontStyle]::Regular), ([System.Drawing.GraphicsUnit]::Pixel)
  $format = New-Object System.Drawing.StringFormat
  $format.Alignment = 'Center'
  $format.LineAlignment = 'Near'
  $brush = New-Object System.Drawing.SolidBrush $Color
  $graphics.DrawString($Text, $font, $brush, (New-Object System.Drawing.RectangleF 54, $Y, ($width - 108), 240), $format)
  $brush.Dispose(); $format.Dispose(); $font.Dispose()
}

Draw-CenteredText 'VOCBEE' $rubik 54 $gold 120
$headline = 'KEL' + [char]0x0130 + 'MELER' + [char]0x0130
Draw-CenteredText $headline $special 102 $cream 285
Draw-CenteredText 'EZBERLEME.' $special 102 $cream 420
Draw-CenteredText 'YAKALA.' $special 128 $gold 555

$pill = New-Object System.Drawing.RectangleF 323, 770, 560, 96
$pillPath = New-Object System.Drawing.Drawing2D.GraphicsPath
$radius = 48
$pillPath.AddArc($pill.X, $pill.Y, $radius * 2, $radius * 2, 180, 90)
$pillPath.AddArc($pill.Right - $radius * 2, $pill.Y, $radius * 2, $radius * 2, 270, 90)
$pillPath.AddArc($pill.Right - $radius * 2, $pill.Bottom - $radius * 2, $radius * 2, $radius * 2, 0, 90)
$pillPath.AddArc($pill.X, $pill.Bottom - $radius * 2, $radius * 2, $radius * 2, 90, 90)
$pillPath.CloseFigure()
$pillBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(220, 26, 44, 34))
$pillPen = New-Object System.Drawing.Pen $gold, 3
$graphics.FillPath($pillBrush, $pillPath)
$graphics.DrawPath($pillPen, $pillPath)
$levelLabel = '20+ D' + [char]0x0130 + 'L  ' + [char]0x2022 + '  A1' + [char]0x2013 + 'C1'
Draw-CenteredText $levelLabel $special 34 $cream 794

$outputPath = Join-Path (Get-Location) $Output
$outputDir = Split-Path $outputPath -Parent
New-Item -ItemType Directory -Force -Path $outputDir | Out-Null
$canvas.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)

$pillPen.Dispose(); $pillBrush.Dispose(); $pillPath.Dispose(); $overlayBrush.Dispose()
$graphics.Dispose(); $canvas.Dispose(); $source.Dispose(); $fontCollection.Dispose()
Write-Output $outputPath
