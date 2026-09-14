param([string]$OutputDir = 'output/appstore/set-v3-depth')

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

$W = 1242; $H = 2688
$ink = [System.Drawing.ColorTranslator]::FromHtml('#10271D')
$gold = [System.Drawing.ColorTranslator]::FromHtml('#FFD700')
$cream = [System.Drawing.ColorTranslator]::FromHtml('#FFF8EA')
$white = [System.Drawing.Color]::White

$fonts = New-Object System.Drawing.Text.PrivateFontCollection
$fonts.AddFontFile((Resolve-Path 'node_modules/@expo-google-fonts/special-gothic-expanded-one/400Regular/SpecialGothicExpandedOne_400Regular.ttf'))
$fonts.AddFontFile((Resolve-Path 'node_modules/@expo-google-fonts/rubik-mono-one/400Regular/RubikMonoOne_400Regular.ttf'))
$brand = $fonts.Families | Where-Object Name -Like 'Special Gothic*' | Select-Object -First 1
$logo = $fonts.Families | Where-Object Name -Like 'Rubik Mono*' | Select-Object -First 1
$serif = New-Object System.Drawing.FontFamily 'Georgia'

New-Item -ItemType Directory -Force -Path $OutputDir | Out-Null
$out = (Resolve-Path $OutputDir).Path

function Rounded-Path([System.Drawing.RectangleF]$Rect, [float]$Radius) {
  $p = New-Object System.Drawing.Drawing2D.GraphicsPath
  $d = $Radius * 2
  $p.AddArc($Rect.X, $Rect.Y, $d, $d, 180, 90)
  $p.AddArc($Rect.Right - $d, $Rect.Y, $d, $d, 270, 90)
  $p.AddArc($Rect.Right - $d, $Rect.Bottom - $d, $d, $d, 0, 90)
  $p.AddArc($Rect.X, $Rect.Bottom - $d, $d, $d, 90, 90)
  $p.CloseFigure(); return $p
}

function New-Scene([string]$Top, [string]$Bottom, [string]$Glow) {
  $bmp = New-Object System.Drawing.Bitmap $W, $H
  $bmp.SetResolution(72,72)
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = 'HighQuality'; $g.InterpolationMode = 'HighQualityBicubic'; $g.PixelOffsetMode = 'HighQuality'; $g.TextRenderingHint = 'AntiAliasGridFit'
  $rect = New-Object System.Drawing.Rectangle 0,0,$W,$H
  $grad = New-Object System.Drawing.Drawing2D.LinearGradientBrush $rect, ([System.Drawing.ColorTranslator]::FromHtml($Top)), ([System.Drawing.ColorTranslator]::FromHtml($Bottom)), 90
  $g.FillRectangle($grad,$rect); $grad.Dispose()
  $glowBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(70, [System.Drawing.ColorTranslator]::FromHtml($Glow)))
  $g.FillEllipse($glowBrush, -260, 520, 1050, 1050)
  $g.FillEllipse($glowBrush, 760, 1500, 760, 760)
  $glowBrush.Dispose()
  for ($i=0; $i -lt 6; $i++) {
    $pen = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(24,$white)), 3
    $g.DrawEllipse($pen, 850 + ($i*42), 70 + ($i*80), 240, 240)
    $pen.Dispose()
  }
  return @($bmp,$g)
}

function Draw-Text([System.Drawing.Graphics]$G,[string]$Text,[System.Drawing.FontFamily]$Family,[float]$Size,[System.Drawing.FontStyle]$Style,[System.Drawing.Color]$Color,[float]$X,[float]$Y,[float]$Width,[float]$Height,[string]$Align='Near') {
  $f = New-Object System.Drawing.Font $Family,$Size,$Style,Pixel
  $b = New-Object System.Drawing.SolidBrush $Color
  $s = New-Object System.Drawing.StringFormat
  $s.Alignment = $Align; $s.LineAlignment = 'Near'; $s.Trimming='EllipsisCharacter'
  $G.DrawString($Text,$f,$b,(New-Object System.Drawing.RectangleF $X,$Y,$Width,$Height),$s)
  $s.Dispose();$b.Dispose();$f.Dispose()
}

function Draw-Header([System.Drawing.Graphics]$G,[string]$Line1,[string]$Line2,[System.Drawing.Color]$Accent,[string]$Subtitle,[System.Drawing.Color]$Primary=$ink,[float]$Line1Size=106,[float]$Line2Size=112) {
  Draw-Text $G 'VOCBEE' $logo 34 Regular $gold 72 58 500 70 Near
  Draw-Text $G $Line1 $serif $Line1Size Bold $Primary 70 155 1080 135 Near
  Draw-Text $G $Line2 $serif $Line2Size Regular $Accent 70 275 1080 145 Near
  Draw-Text $G $Subtitle $brand 29 Regular ([System.Drawing.Color]::FromArgb(185,$ink)) 76 440 1080 90 Near
  $pill = New-Object System.Drawing.RectangleF 76,535,330,72
  $path=Rounded-Path $pill 36
  $brush=New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(38,$white))
  $pen=New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(95,$white)),2
  $G.FillPath($brush,$path);$G.DrawPath($pen,$path)
  Draw-Text $G '20+ DİL  •  A1–C1' $brand 22 Regular $ink 102 553 290 42 Near
  $pen.Dispose();$brush.Dispose();$path.Dispose()
}

function Draw-Cover([System.Drawing.Graphics]$G,[System.Drawing.Image]$Img,[System.Drawing.RectangleF]$Rect) {
  $scale=[Math]::Max($Rect.Width/$Img.Width,$Rect.Height/$Img.Height)
  $dw=$Img.Width*$scale;$dh=$Img.Height*$scale
  $G.DrawImage($Img,$Rect.X+($Rect.Width-$dw)/2,$Rect.Y+($Rect.Height-$dh)/2,$dw,$dh)
}

function Make-Phone([string]$ImagePath,[int]$Width,[int]$Height) {
  $tile=New-Object System.Drawing.Bitmap ($Width+150),($Height+170),([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $g=[System.Drawing.Graphics]::FromImage($tile)
  $g.SmoothingMode='HighQuality';$g.InterpolationMode='HighQualityBicubic';$g.PixelOffsetMode='HighQuality'
  for($i=10;$i -ge 1;$i--){
    $shadowRect=New-Object System.Drawing.RectangleF (48+$i),(64+$i*3),$Width,$Height
    $sp=Rounded-Path $shadowRect 112
    $sb=New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb((13-$i),0,0,0))
    $g.FillPath($sb,$sp);$sb.Dispose();$sp.Dispose()
  }
  $rect=New-Object System.Drawing.RectangleF 38,38,$Width,$Height
  $path=Rounded-Path $rect 112
  $g.FillPath([System.Drawing.Brushes]::White,$path)
  $state=$g.Save();$g.SetClip($path)
  $img=[System.Drawing.Image]::FromFile($ImagePath)
  Draw-Cover $g $img $rect
  $img.Dispose();$g.Restore($state)
  $pen=New-Object System.Drawing.Pen ([System.Drawing.Color]::Black),18
  $g.DrawPath($pen,$path)
  $pen.Dispose();$path.Dispose();$g.Dispose();return $tile
}

function Make-FloatingCrop([string]$ImagePath,[System.Drawing.Rectangle]$Crop,[int]$Width,[int]$Height) {
  $tile=New-Object System.Drawing.Bitmap ($Width+100),($Height+120),([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $g=[System.Drawing.Graphics]::FromImage($tile);$g.SmoothingMode='HighQuality';$g.InterpolationMode='HighQualityBicubic'
  $shadow=New-Object System.Drawing.RectangleF 38,52,$Width,$Height
  $shadowPath=Rounded-Path $shadow 52
  $shadowBrush=New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(70,0,0,0))
  $g.FillPath($shadowBrush,$shadowPath)
  $rect=New-Object System.Drawing.RectangleF 25,25,$Width,$Height
  $path=Rounded-Path $rect 52
  $g.FillPath([System.Drawing.Brushes]::White,$path)
  $state=$g.Save();$g.SetClip($path)
  $img=[System.Drawing.Image]::FromFile($ImagePath)
  $g.DrawImage($img,$rect,$Crop,[System.Drawing.GraphicsUnit]::Pixel)
  $img.Dispose();$g.Restore($state)
  $pen=New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(35,0,0,0)),2;$g.DrawPath($pen,$path)
  $pen.Dispose();$path.Dispose();$shadowBrush.Dispose();$shadowPath.Dispose();$g.Dispose();return $tile
}

function Draw-Rotated([System.Drawing.Graphics]$G,[System.Drawing.Image]$Img,[float]$CenterX,[float]$CenterY,[float]$Angle,[float]$Scale=1) {
  $state=$G.Save();$G.TranslateTransform($CenterX,$CenterY);$G.RotateTransform($Angle);$G.ScaleTransform($Scale,$Scale)
  $G.DrawImage($Img,-$Img.Width/2,-$Img.Height/2,$Img.Width,$Img.Height);$G.Restore($state)
}

function Extract-Bee([string]$InputPath,[string]$OutputPath) {
  $src=[System.Drawing.Bitmap]::FromFile($InputPath)
  $bmp=New-Object System.Drawing.Bitmap $src.Width,$src.Height,([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $g=[System.Drawing.Graphics]::FromImage($bmp);$g.DrawImage($src,0,0);$g.Dispose();$src.Dispose()
  $w=$bmp.Width;$h=$bmp.Height;$seen=New-Object 'bool[]' ($w*$h);$q=New-Object 'System.Collections.Generic.Queue[int]'
  for($x=0;$x -lt $w;$x++){ $q.Enqueue($x);$q.Enqueue((($h-1)*$w)+$x) }
  for($y=0;$y -lt $h;$y++){ $q.Enqueue($y*$w);$q.Enqueue(($y*$w)+$w-1) }
  while($q.Count){
    $idx=$q.Dequeue();if($idx -lt 0 -or $idx -ge $seen.Length -or $seen[$idx]){continue};$seen[$idx]=$true
    $x=$idx%$w;$y=[int][Math]::Floor($idx/$w);$c=$bmp.GetPixel($x,$y)
    $max=[Math]::Max($c.R,[Math]::Max($c.G,$c.B));$min=[Math]::Min($c.R,[Math]::Min($c.G,$c.B))
    if(($max-$min) -gt 34 -or $max -lt 105){continue}
    $bmp.SetPixel($x,$y,[System.Drawing.Color]::FromArgb(0,$c.R,$c.G,$c.B))
    if($x -gt 0){$q.Enqueue($idx-1)};if($x -lt $w-1){$q.Enqueue($idx+1)};if($y -gt 0){$q.Enqueue($idx-$w)};if($y -lt $h-1){$q.Enqueue($idx+$w)}
  }
  $bmp.Save($OutputPath,[System.Drawing.Imaging.ImageFormat]::Png);$bmp.Dispose()
}

function Save-Scene([System.Drawing.Bitmap]$Bmp,[System.Drawing.Graphics]$G,[string]$Name) {
  $G.Dispose();$Bmp.Save((Join-Path $out $Name),[System.Drawing.Imaging.ImageFormat]::Png);$Bmp.Dispose()
}

$homeShot='C:\Users\Turan\Downloads\Simulator Screenshot - iPhone 17 Pro - 2026-09-12 at 21.28.39.png'
$gameShot='C:\Users\Turan\Downloads\Simulator Screenshot - iPhone 17 Pro - 2026-09-12 at 21.29.31.png'
$exampleShot='C:\Users\Turan\Downloads\Simulator Screenshot - iPad Pro 13-inch (M5) - 2026-09-12 at 21.37.01.png'
$favoriteShot='C:\Users\Turan\Downloads\Simulator Screenshot - iPad Pro 13-inch (M5) - 2026-09-12 at 21.36.45.png'
$levelShot='C:\Users\Turan\Downloads\Simulator Screenshot - iPad Pro 13-inch (M5) - 2026-09-12 at 21.36.36.png'
$beeGenerated='C:\Users\Turan\.codex\generated_images\01a096f7-674d-7cc2-a8a4-156288b2253a\exec-6e062be4-cc65-4079-bd04-578c6a7c4b13.png'
$beePath=Join-Path $out 'vocbee-3d-mascot.png'
if (-not (Test-Path $beePath)) { Extract-Bee $beeGenerated $beePath }
$bee=[System.Drawing.Image]::FromFile($beePath)

# 01 — Overview
$c=New-Scene '#FFF5A8' '#F7C85A' '#FFFFFF';$b=$c[0];$g=$c[1]
Draw-Header $g 'Kelime öğrenmenin' 'yeni yolu' $white 'Kartlar, örnekler, oyun ve yapay zekâ tek uygulamada.' $ink 82 112
$phone=Make-Phone $homeShot 760 1660;Draw-Rotated $g $phone 545 1640 -7 1;$phone.Dispose()
$card=Make-FloatingCrop $homeShot (New-Object System.Drawing.Rectangle 62,820,1080,1160) 650 700;Draw-Rotated $g $card 865 1660 7 1;$card.Dispose()
Draw-Rotated $g $bee 270 2140 -12 0.47
Save-Scene $b $g '01-genel-bakis.png'

# 02 — Swipe cards
$c=New-Scene '#B7EBD9' '#66C8A6' '#FFF8EA';$b=$c[0];$g=$c[1]
Draw-Header $g 'Kaydır.' 'Öğren. İlerle.' $white 'Kelime kartlarını saniyeler içinde öğren.'
$phone=Make-Phone $homeShot 740 1610;Draw-Rotated $g $phone 650 1630 6 1;$phone.Dispose()
$card=Make-FloatingCrop $homeShot (New-Object System.Drawing.Rectangle 58,850,1090,1260) 710 760;Draw-Rotated $g $card 390 1630 -10 1;$card.Dispose()
Draw-Rotated $g $bee 955 2050 9 0.36
Save-Scene $b $g '02-kaydirarak-ogren.png'

# 03 — Game
$c=New-Scene '#97DDF6' '#388EC7' '#FFD700';$b=$c[0];$g=$c[1]
Draw-Header $g 'Öğrendiklerini' 'oyunda test et' $white 'Doğru anlamı seç, arıyla birlikte ilerle.'
$phone=Make-Phone $gameShot 770 1675;Draw-Rotated $g $phone 585 1640 -5 1;$phone.Dispose()
$answers=Make-FloatingCrop $gameShot (New-Object System.Drawing.Rectangle 190,1060,830,360) 760 300;Draw-Rotated $g $answers 720 1450 8 1;$answers.Dispose()
Draw-Rotated $g $bee 930 2150 8 0.5
Save-Scene $b $g '03-ari-oyunu.png'

# 04 — AI examples
$c=New-Scene '#D4C7F5' '#8F7FD0' '#FFFFFF';$b=$c[0];$g=$c[1]
Draw-Header $g 'Sadece anlamı değil,' 'kullanımı da öğren' $white 'Örnek cümleler ve yapay zekâ destekli gramer açıklamaları.' $ink 78 104
$phone=Make-Phone $exampleShot 760 1660;Draw-Rotated $g $phone 540 1650 -7 1;$phone.Dispose()
$panel=Make-FloatingCrop $exampleShot (New-Object System.Drawing.Rectangle 410,650,1240,760) 700 430;Draw-Rotated $g $panel 850 1600 7 1;$panel.Dispose()
Draw-Rotated $g $bee 220 2180 -8 0.36
Save-Scene $b $g '04-ai-ornekler.png'

# 05 — Favorites and progress
$c=New-Scene '#FFC9A9' '#F18E65' '#FFF8EA';$b=$c[0];$g=$c[1]
Draw-Header $g 'Önemli kelimeler' 'hep elinin altında' $white 'Favorilere ekle, ilerlemeni gör, istediğinde tekrar et.'
$phone=Make-Phone $favoriteShot 750 1640;Draw-Rotated $g $phone 645 1650 6 1;$phone.Dispose()
$list=Make-FloatingCrop $favoriteShot (New-Object System.Drawing.Rectangle 395,210,1270,650) 720 390;Draw-Rotated $g $list 390 1510 -9 1;$list.Dispose()
Draw-Rotated $g $bee 965 2130 9 0.4
Save-Scene $b $g '05-favoriler-ve-ilerleme.png'

# 06 — Levels / broad catalogue
$c=New-Scene '#162D23' '#07110D' '#FFD700';$b=$c[0];$g=$c[1]
$levelsHeadline='A1'+[char]0x2019+'den C1'+[char]0x2019+'e'
Draw-Header $g $levelsHeadline 'kendi hızında' $gold '20+ dil ve binlerce kelimeyle sana uygun bir yol.' $white
$phone=Make-Phone $levelShot 760 1660;Draw-Rotated $g $phone 525 1650 -6 1;$phone.Dispose()
$levels=New-Object System.Drawing.Bitmap 770,220,([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$lg=[System.Drawing.Graphics]::FromImage($levels);$lg.SmoothingMode='HighQuality'
$lp=Rounded-Path (New-Object System.Drawing.RectangleF 15,15,740,180) 70;$lb=New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(235,255,248,234));$lg.FillPath($lb,$lp)
Draw-Text $lg 'A1   A2   B1   B2   C1' $logo 34 Regular $ink 70 72 650 70 Center
$lb.Dispose();$lp.Dispose();$lg.Dispose();Draw-Rotated $g $levels 820 1220 7 1;$levels.Dispose()
Draw-Rotated $g $bee 910 2150 8 0.48
Save-Scene $b $g '06-seviyeler-ve-diller.png'

$bee.Dispose()

# Contact sheet
$sheet=New-Object System.Drawing.Bitmap 960,1400;$sg=[System.Drawing.Graphics]::FromImage($sheet);$sg.Clear($ink);$sg.InterpolationMode='HighQualityBicubic'
$names=@('01-genel-bakis.png','02-kaydirarak-ogren.png','03-ari-oyunu.png','04-ai-ornekler.png','05-favoriler-ve-ilerleme.png','06-seviyeler-ve-diller.png')
for($i=0;$i -lt $names.Count;$i++){$im=[System.Drawing.Image]::FromFile((Join-Path $out $names[$i]));$x=25+(($i%3)*310);$y=25+([Math]::Floor($i/3)*675);$sg.DrawImage($im,$x,$y,290,627);$im.Dispose()}
$sheet.Save((Join-Path $out 'preview-contact-sheet.png'),[System.Drawing.Imaging.ImageFormat]::Png);$sg.Dispose();$sheet.Dispose()
$fonts.Dispose();$serif.Dispose()
