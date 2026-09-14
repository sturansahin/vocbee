param([string]$OutputDir = 'output/appstore/set-v2')

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

$W = 1242
$H = 2688
$ink = [System.Drawing.ColorTranslator]::FromHtml('#1A2C22')
$gold = [System.Drawing.ColorTranslator]::FromHtml('#FFD700')
$softGray = [System.Drawing.ColorTranslator]::FromHtml('#AEBBC5')
$muted = [System.Drawing.ColorTranslator]::FromHtml('#60766B')
$white = [System.Drawing.Color]::White

$fonts = New-Object System.Drawing.Text.PrivateFontCollection
$fonts.AddFontFile((Resolve-Path 'node_modules/@expo-google-fonts/special-gothic-expanded-one/400Regular/SpecialGothicExpandedOne_400Regular.ttf'))
$fonts.AddFontFile((Resolve-Path 'node_modules/@expo-google-fonts/rubik-mono-one/400Regular/RubikMonoOne_400Regular.ttf'))
$brand = $fonts.Families | Where-Object Name -Like 'Special Gothic*' | Select-Object -First 1
$logo = $fonts.Families | Where-Object Name -Like 'Rubik Mono*' | Select-Object -First 1
$serif = New-Object System.Drawing.FontFamily 'Georgia'

function New-Canvas([string]$Color) {
  $bitmap = New-Object System.Drawing.Bitmap $W, $H
  $bitmap.SetResolution(72, 72)
  $g = [System.Drawing.Graphics]::FromImage($bitmap)
  $g.SmoothingMode = 'HighQuality'
  $g.InterpolationMode = 'HighQualityBicubic'
  $g.PixelOffsetMode = 'HighQuality'
  $g.TextRenderingHint = 'AntiAliasGridFit'
  $g.Clear([System.Drawing.ColorTranslator]::FromHtml($Color))
  return @($bitmap, $g)
}

function Draw-Centered([System.Drawing.Graphics]$G, [string]$Text, [System.Drawing.FontFamily]$Family, [float]$Size, [System.Drawing.FontStyle]$Style, [System.Drawing.Color]$Color, [float]$Y, [float]$Height = 150) {
  $font = New-Object System.Drawing.Font $Family, $Size, $Style, ([System.Drawing.GraphicsUnit]::Pixel)
  $format = New-Object System.Drawing.StringFormat
  $format.Alignment = 'Center'
  $format.LineAlignment = 'Near'
  $brush = New-Object System.Drawing.SolidBrush $Color
  $G.DrawString($Text, $font, $brush, (New-Object System.Drawing.RectangleF 42, $Y, ($W - 84), $Height), $format)
  $brush.Dispose(); $format.Dispose(); $font.Dispose()
}

function Rounded-Path([System.Drawing.RectangleF]$Rect, [float]$Radius) {
  $p = New-Object System.Drawing.Drawing2D.GraphicsPath
  $d = $Radius * 2
  $p.AddArc($Rect.X, $Rect.Y, $d, $d, 180, 90)
  $p.AddArc($Rect.Right - $d, $Rect.Y, $d, $d, 270, 90)
  $p.AddArc($Rect.Right - $d, $Rect.Bottom - $d, $d, $d, 0, 90)
  $p.AddArc($Rect.X, $Rect.Bottom - $d, $d, $d, 90, 90)
  $p.CloseFigure()
  return $p
}

function Draw-Phone([System.Drawing.Graphics]$G, [string]$ImagePath, [float]$X, [float]$Y, [float]$Width, [float]$Height) {
  $rect = New-Object System.Drawing.RectangleF $X, $Y, $Width, $Height
  $path = Rounded-Path $rect 145
  $pen = New-Object System.Drawing.Pen ([System.Drawing.Color]::Black), 22
  $G.FillPath([System.Drawing.Brushes]::White, $path)
  $state = $G.Save()
  $G.SetClip($path)
  $img = [System.Drawing.Image]::FromFile($ImagePath)
  $scale = [Math]::Max($Width / $img.Width, $Height / $img.Height)
  $dw = $img.Width * $scale
  $dh = $img.Height * $scale
  $G.DrawImage($img, ($X + ($Width - $dw) / 2), ($Y + ($Height - $dh) / 2), $dw, $dh)
  $img.Dispose()
  $G.Restore($state)
  $G.DrawPath($pen, $path)
  $pen.Dispose(); $path.Dispose()
}

function Draw-Doodle([System.Drawing.Graphics]$G, [float]$X, [float]$Y, [System.Drawing.Color]$Color) {
  $pen = New-Object System.Drawing.Pen $Color, 6
  $pen.StartCap = 'Round'; $pen.EndCap = 'Round'
  $path = New-Object System.Drawing.Drawing2D.GraphicsPath
  $path.AddBezier($X, $Y, ($X + 170), ($Y + 30), ($X - 60), ($Y + 180), ($X + 100), ($Y + 230))
  $path.AddBezier(($X + 100), ($Y + 230), ($X + 280), ($Y + 290), ($X + 20), ($Y + 420), ($X + 210), ($Y + 490))
  $G.DrawPath($pen, $path)
  $G.DrawLine($pen, ($X + 210), ($Y + 490), ($X + 178), ($Y + 450))
  $G.DrawLine($pen, ($X + 210), ($Y + 490), ($X + 226), ($Y + 438))
  $path.Dispose(); $pen.Dispose()
}

function Draw-BottomCard([System.Drawing.Graphics]$G, [string]$Line1, [string]$Line2 = '') {
  $rect = New-Object System.Drawing.RectangleF 18, 2290, 1206, 480
  $path = Rounded-Path $rect 88
  $brush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(238, 255, 255, 242))
  $G.FillPath($brush, $path)
  Draw-Centered $G $Line1 $serif 84 Regular $ink 2365 120
  if ($Line2) { Draw-Centered $G $Line2 $serif 84 Regular $softGray 2475 120 }
  $brush.Dispose(); $path.Dispose()
}

function Save-Canvas([System.Drawing.Bitmap]$Bitmap, [System.Drawing.Graphics]$G, [string]$Name) {
  New-Item -ItemType Directory -Force -Path $OutputDir | Out-Null
  $path = Join-Path (Resolve-Path $OutputDir) $Name
  $Bitmap.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
  $G.Dispose(); $Bitmap.Dispose()
  Write-Output $path
}

$homeShot = 'C:\Users\Turan\Downloads\Simulator Screenshot - iPhone 17 Pro - 2026-09-12 at 21.28.39.png'
$game = 'C:\Users\Turan\Downloads\Simulator Screenshot - iPhone 17 Pro - 2026-09-12 at 21.29.31.png'
$examples = 'C:\Users\Turan\Downloads\Simulator Screenshot - iPad Pro 13-inch (M5) - 2026-09-12 at 21.37.01.png'
$favorites = 'C:\Users\Turan\Downloads\Simulator Screenshot - iPad Pro 13-inch (M5) - 2026-09-12 at 21.36.45.png'
$level = 'C:\Users\Turan\Downloads\Simulator Screenshot - iPad Pro 13-inch (M5) - 2026-09-12 at 21.36.36.png'

# 01 — Core learning flow
$c = New-Canvas '#F4F59D'; $b = $c[0]; $g = $c[1]
Draw-Centered $g 'Kelimeleri' $serif 118 Bold $ink 95
Draw-Centered $g 'kaydırarak öğren' $serif 112 Regular $softGray 225
Draw-Centered $g 'Seviyene uygun günlük kelime kartları' $brand 34 Regular $muted 405
Draw-Doodle $g 890 225 $ink
Draw-Phone $g $homeShot 135 650 972 2100
Draw-BottomCard $g '5.000+ kelime' '20+ dil'
Save-Canvas $b $g '01-kelime-kartlari.png'

# 02 — Game
$c = New-Canvas '#8ED2EF'; $b = $c[0]; $g = $c[1]
Draw-Centered $g 'Öğrenirken' $serif 118 Bold $ink 105
Draw-Centered $g 'oyna' $serif 128 Regular $white 235
Draw-Centered $g 'Doğru anlamı seç, arıyla ilerle' $brand 34 Regular $muted 420
Draw-Phone $g $game 135 650 972 2100
Draw-BottomCard $g 'Bilgini oyuna' 'dönüştür'
Save-Canvas $b $g '02-ari-oyunu.png'

# 03 — AI examples
$c = New-Canvas '#C9BCEB'; $b = $c[0]; $g = $c[1]
Draw-Centered $g 'Örneklerle' $serif 118 Bold $ink 95
Draw-Centered $g 'pekiştir' $serif 128 Regular $white 225
Draw-Centered $g 'Yapay zekâ ile grameri daha iyi anla' $brand 34 Regular $muted 410
Draw-Phone $g $examples 135 650 972 2100
Draw-BottomCard $g 'Cümleyi gör.' 'Mantığını kavra.'
Save-Canvas $b $g '03-ai-ornekler.png'

# 04 — Favorites
$c = New-Canvas '#A9E8D0'; $b = $c[0]; $g = $c[1]
Draw-Centered $g 'Önemli kelimeler' $serif 108 Bold $ink 95
Draw-Centered $g 'hep yanında' $serif 124 Regular $white 225
Draw-Centered $g 'Favorilerine ekle, istediğin zaman tekrar et' $brand 31 Regular $muted 410
Draw-Phone $g $favorites 135 650 972 2100
Draw-BottomCard $g 'Kaydet.' 'Sonra tekrar et.'
Save-Canvas $b $g '04-favoriler.png'

# 05 — Levels and progress
$c = New-Canvas '#F4F59D'; $b = $c[0]; $g = $c[1]
$levelsHeadline = 'A1' + [char]0x2019 + 'den C1' + [char]0x2019 + 'e'
Draw-Centered $g $levelsHeadline $serif 118 Bold $ink 95
Draw-Centered $g 'kendi hızında' $serif 116 Regular $softGray 225
Draw-Centered $g 'Seviyene uygun kelimelerle adım adım ilerle' $brand 30 Regular $muted 410
Draw-Phone $g $level 135 650 972 2100
Draw-BottomCard $g 'Her seviyede' 'net ilerleme'
Save-Canvas $b $g '05-seviyeler.png'

# 06 — Notifications and streak
$c = New-Canvas '#FFD0AD'; $b = $c[0]; $g = $c[1]
Draw-Centered $g 'Her gün' $serif 124 Bold $ink 105
Draw-Centered $g 'geri dön' $serif 132 Regular $white 240
Draw-Centered $g 'Akıllı bildirimler ve seri sistemiyle ritmini koru' $brand 29 Regular $muted 425
$phoneRect = New-Object System.Drawing.RectangleF 110, 690, 1022, 2100
$phonePath = Rounded-Path $phoneRect 145
$phonePen = New-Object System.Drawing.Pen ([System.Drawing.Color]::Black), 22
$g.FillPath((New-Object System.Drawing.SolidBrush ([System.Drawing.ColorTranslator]::FromHtml('#F9C997'))), $phonePath)
$g.DrawPath($phonePen, $phonePath)
Draw-Centered $g '18:11' $serif 188 Regular $white 920 240
$noticeRect = New-Object System.Drawing.RectangleF 38, 1470, 1166, 300
$noticePath = Rounded-Path $noticeRect 66
$noticeBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(235, 255, 255, 255))
$g.FillPath($noticeBrush, $noticePath)
$icon = [System.Drawing.Image]::FromFile((Resolve-Path 'assets/icons/vocicon.png'))
$g.DrawImage($icon, 78, 1520, 190, 190)
$icon.Dispose()
$noticeFont = New-Object System.Drawing.Font $brand, 31, Regular, Pixel
$g.DrawString('VOCBEE', $noticeFont, [System.Drawing.Brushes]::Black, 310, 1515)
$g.DrawString('Bugünün kelimesi seni bekliyor.', $noticeFont, [System.Drawing.Brushes]::Black, 310, 1580)
$g.DrawString('Serini sürdürmek için dokun.', $noticeFont, (New-Object System.Drawing.SolidBrush $muted), 310, 1645)
$noticeFont.Dispose(); $noticeBrush.Dispose(); $noticePath.Dispose(); $phonePen.Dispose(); $phonePath.Dispose()
Draw-BottomCard $g 'Ritmini koru.' 'Her gün biraz ilerle.'
Save-Canvas $b $g '06-bildirim-ve-seri.png'

$sheet = New-Object System.Drawing.Bitmap 960, 1400
$sheetG = [System.Drawing.Graphics]::FromImage($sheet)
$sheetG.Clear($ink)
$sheetG.InterpolationMode = 'HighQualityBicubic'
$names = @(
  '01-kelime-kartlari.png', '02-ari-oyunu.png', '03-ai-ornekler.png',
  '04-favoriler.png', '05-seviyeler.png', '06-bildirim-ve-seri.png'
)
for ($i = 0; $i -lt $names.Count; $i++) {
  $thumb = [System.Drawing.Image]::FromFile((Join-Path (Resolve-Path $OutputDir) $names[$i]))
  $x = 25 + (($i % 3) * 310)
  $y = 25 + ([Math]::Floor($i / 3) * 675)
  $sheetG.DrawImage($thumb, $x, $y, 290, 627)
  $thumb.Dispose()
}
$sheet.Save((Join-Path (Resolve-Path $OutputDir) 'preview-contact-sheet.png'), [System.Drawing.Imaging.ImageFormat]::Png)
$sheetG.Dispose(); $sheet.Dispose()

$fonts.Dispose(); $serif.Dispose()
