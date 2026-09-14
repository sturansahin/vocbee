import os
import math
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter

OUTPUT_DIR = r'c:\Users\Turan\Desktop\vocbee\output\store-visuals'
os.makedirs(OUTPUT_DIR, exist_ok=True)

SERIF_FONT = r'c:\Users\Turan\Desktop\vocbee\DMSerifDisplay-Regular.ttf'
SANS_FONT = r'c:\Users\Turan\Desktop\vocbee\Montserrat.ttf'
GAME_FONT = r'c:\Users\Turan\Desktop\vocbee\LilitaOne-Regular.ttf'
DOODLE_IMG_PATH = r'c:\Users\Turan\Desktop\vocbee\doodle_arrow_perfect.png'

# Color constants
INK_DARK = (18, 56, 36)          # #123824
SLATE_BLUE = (136, 158, 178)     # #889EB2
WHITE = (255, 255, 255)
SUBTITLE_MUTED = (55, 80, 65)    # Richer contrast #375041
GOLD_ACCENT = (255, 195, 45)     # #FFC32D
BG_YELLOW = (250, 244, 172)      # #FAF4AC
BG_MINT = (174, 234, 208)        # #AEEAD0
CARD_CREAM = (254, 255, 222)     # #FEFFDE

def draw_smooth_ribbon(draw, pts, widths, fill_color, outline_color=None, outline_w=2):
    pts = np.array(pts, dtype=float)
    N = len(pts)
    tangents = np.zeros_like(pts)
    for i in range(N):
        if i == 0:
            tangents[i] = pts[1] - pts[0]
        elif i == N - 1:
            tangents[i] = pts[-1] - pts[-2]
        else:
            tangents[i] = pts[i+1] - pts[i-1]
        norm = np.linalg.norm(tangents[i])
        if norm > 0:
            tangents[i] /= norm
            
    normals = np.zeros_like(pts)
    normals[:, 0] = -tangents[:, 1]
    normals[:, 1] = tangents[:, 0]
    
    left_side = []
    right_side = []
    for i in range(N):
        w = widths[i]
        left_side.append(pts[i] + normals[i] * (w / 2.0))
        right_side.append(pts[i] - normals[i] * (w / 2.0))
        
    poly = left_side + right_side[::-1]
    poly_tuples = [(float(p[0]), float(p[1])) for p in poly]
    draw.polygon(poly_tuples, fill=fill_color)
    if outline_color and outline_w > 0:
        draw.line(poly_tuples + [poly_tuples[0]], fill=outline_color, width=outline_w)

def generate_enhanced_iphone():
    base = Image.open(r'c:\Users\Turan\Desktop\vocbee\iphone_screenshot.png').convert('RGBA')
    w, h = base.size # 1206, 2622
    
    cx1, cy1, cx2, cy2 = 227, 1088, 460, 1229
    card_w = cx2 - cx1
    card_h = cy2 - cy1
    
    # 1. Soft emerald glow
    glow = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    gdraw = ImageDraw.Draw(glow)
    gdraw.rounded_rectangle([cx1 - 26, cy1 - 26, cx2 + 26, cy2 + 26], radius=44, fill=(46, 204, 113, 160))
    glow = glow.filter(ImageFilter.GaussianBlur(28))
    base.paste(glow, (0, 0), glow)
    
    # 2. Winning card redraw
    card_surf = Image.new('RGBA', (card_w, card_h), (0, 0, 0, 0))
    cdraw = ImageDraw.Draw(card_surf)
    cdraw.rounded_rectangle([0, 0, card_w, card_h], radius=24, fill=(251, 180, 47, 255))
    cdraw.rounded_rectangle([6, 6, card_w - 6, card_h - 6], radius=20, fill=(188, 245, 205, 255))
    
    badge_r = 20
    badge_cx = card_w // 2
    badge_cy = 38
    cdraw.ellipse([badge_cx - badge_r, badge_cy - badge_r, badge_cx + badge_r, badge_cy + badge_r], fill=(24, 134, 62, 255))
    pts = [(badge_cx - 10, badge_cy), (badge_cx - 3, badge_cy + 7), (badge_cx + 10, badge_cy - 7)]
    cdraw.line(pts, fill=(255, 255, 255, 255), width=5, joint='curve')
    
    f_card = ImageFont.truetype(GAME_FONT, 33)
    cdraw.text((badge_cx, 92), 'dahil etmek', fill=(0, 0, 0, 255), font=f_card, anchor='mm')
    base.paste(card_surf, (cx1, cy1), card_surf)
    
    # 3. Dynamic swooping ribbon arrow
    arrow_surf = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    adraw = ImageDraw.Draw(arrow_surf)
    
    p0 = np.array([460.0, 1780.0])
    p1 = np.array([270.0, 1620.0])
    p2 = np.array([270.0, 1390.0])
    p3 = np.array([344.0, 1260.0])
    
    t_vals = np.linspace(0, 1, 120)
    pts_curve = []
    for t in t_vals:
        pt = (1-t)**3 * p0 + 3*(1-t)**2 * t * p1 + 3*(1-t) * t**2 * p2 + t**3 * p3
        pts_curve.append(pt)
        
    widths = [float(36 - i * 14 / len(pts_curve)) for i in range(len(pts_curve))]
    
    shadow_pts = [p + np.array([6.0, 12.0]) for p in pts_curve]
    draw_smooth_ribbon(adraw, shadow_pts, widths, (0, 0, 0, 95))
    draw_smooth_ribbon(adraw, pts_curve, widths, (255, 195, 45, 255), (230, 140, 15, 255), 3)
    inner_widths = [max(2.0, w - 12.0) for w in widths]
    draw_smooth_ribbon(adraw, pts_curve, inner_widths, (255, 245, 175, 180))
    
    tip = np.array([344.0, 1242.0])
    left_barb = np.array([304.0, 1288.0])
    right_barb = np.array([384.0, 1288.0])
    notch = np.array([344.0, 1275.0])
    
    poly = [(tip[0], tip[1]), (left_barb[0], left_barb[1]), (notch[0], notch[1]), (right_barb[0], right_barb[1])]
    poly_shadow = [(p[0]+6, p[1]+12) for p in poly]
    adraw.polygon(poly_shadow, fill=(0, 0, 0, 95))
    adraw.polygon(poly, fill=(255, 205, 50, 255))
    adraw.line(poly + [poly[0]], fill=(230, 140, 15, 255), width=4)
    
    for sx, sy, l in [(490, 1460, 150), (710, 1480, 180), (430, 1680, 130), (760, 1700, 140), (310, 1420, 110), (920, 1460, 120)]:
        adraw.line([(sx, sy), (sx - 14, sy + l)], fill=(255, 255, 255, 90), width=4)
        
    base.paste(arrow_surf, (0, 0), arrow_surf)
    out_path = os.path.join(OUTPUT_DIR, 'iphone-gameplay-enhanced.png')
    base.save(out_path)
    return base

def generate_enhanced_ipad():
    base = Image.open(r'c:\Users\Turan\Desktop\vocbee\ipad_screenshot.png').convert('RGBA')
    w, h = base.size # 2064, 2752
    
    sky_top = Image.new('RGBA', (w, 70), (125, 199, 237, 255))
    base.paste(sky_top, (0, 0))
    sdraw = ImageDraw.Draw(base)
    f_time = ImageFont.truetype(r'C:\Windows\Fonts\segoeui.ttf', 32)
    sdraw.text((60, 22), '09:41', fill=(0, 0, 0, 230), font=f_time)
    sdraw.text((w - 180, 22), '100%', fill=(0, 0, 0, 230), font=f_time)
    
    cx1, cy1, cx2, cy2 = 629, 1143, 885, 1295
    card_w = cx2 - cx1
    card_h = cy2 - cy1
    
    glow = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    gdraw = ImageDraw.Draw(glow)
    gdraw.rounded_rectangle([cx1 - 28, cy1 - 28, cx2 + 28, cy2 + 28], radius=46, fill=(46, 204, 113, 160))
    glow = glow.filter(ImageFilter.GaussianBlur(30))
    base.paste(glow, (0, 0), glow)
    
    card_surf = Image.new('RGBA', (card_w, card_h), (0, 0, 0, 0))
    cdraw = ImageDraw.Draw(card_surf)
    cdraw.rounded_rectangle([0, 0, card_w, card_h], radius=26, fill=(251, 180, 47, 255))
    cdraw.rounded_rectangle([7, 7, card_w - 7, card_h - 7], radius=22, fill=(188, 245, 205, 255))
    
    badge_r = 22
    badge_cx = card_w // 2
    badge_cy = 42
    cdraw.ellipse([badge_cx - badge_r, badge_cy - badge_r, badge_cx + badge_r, badge_cy + badge_r], fill=(24, 134, 62, 255))
    pts = [(badge_cx - 11, badge_cy), (badge_cx - 3, badge_cy + 8), (badge_cx + 11, badge_cy - 8)]
    cdraw.line(pts, fill=(255, 255, 255, 255), width=5, joint='curve')
    
    f_card = ImageFont.truetype(GAME_FONT, 38)
    cdraw.text((badge_cx, 100), 'strength', fill=(0, 0, 0, 255), font=f_card, anchor='mm')
    base.paste(card_surf, (cx1, cy1), card_surf)
    
    arrow_surf = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    adraw = ImageDraw.Draw(arrow_surf)
    
    p0 = np.array([920.0, 1840.0])
    p1 = np.array([680.0, 1650.0])
    p2 = np.array([680.0, 1450.0])
    p3 = np.array([757.0, 1325.0])
    
    t_vals = np.linspace(0, 1, 120)
    pts_curve = []
    for t in t_vals:
        pt = (1-t)**3 * p0 + 3*(1-t)**2 * t * p1 + 3*(1-t) * t**2 * p2 + t**3 * p3
        pts_curve.append(pt)
        
    widths = [float(44 - i * 16 / len(pts_curve)) for i in range(len(pts_curve))]
    
    shadow_pts = [p + np.array([8.0, 16.0]) for p in pts_curve]
    draw_smooth_ribbon(adraw, shadow_pts, widths, (0, 0, 0, 95))
    draw_smooth_ribbon(adraw, pts_curve, widths, (255, 195, 45, 255), (230, 140, 15, 255), 4)
    inner_widths = [max(3.0, w - 14.0) for w in widths]
    draw_smooth_ribbon(adraw, pts_curve, inner_widths, (255, 245, 175, 180))
    
    tip = np.array([757.0, 1308.0])
    left_barb = np.array([707.0, 1358.0])
    right_barb = np.array([807.0, 1358.0])
    notch = np.array([757.0, 1344.0])
    
    poly = [(tip[0], tip[1]), (left_barb[0], left_barb[1]), (notch[0], notch[1]), (right_barb[0], right_barb[1])]
    poly_shadow = [(p[0]+8, p[1]+16) for p in poly]
    adraw.polygon(poly_shadow, fill=(0, 0, 0, 95))
    adraw.polygon(poly, fill=(255, 205, 50, 255))
    adraw.line(poly + [poly[0]], fill=(230, 140, 15, 255), width=5)
    
    for sx, sy, l in [(890, 1520, 180), (1160, 1540, 200), (840, 1760, 150), (1220, 1780, 160), (700, 1480, 140), (1350, 1520, 150)]:
        adraw.line([(sx, sy), (sx - 16, sy + l)], fill=(255, 255, 255, 90), width=5)
        
    base.paste(arrow_surf, (0, 0), arrow_surf)
    out_path = os.path.join(OUTPUT_DIR, 'ipad-gameplay-enhanced.png')
    base.save(out_path)
    return base

def make_device_mockup_iphone(screen_img, target_w=972, target_h=2110, corner_radius=135, bezel=20):
    inner_w = target_w - bezel * 2
    inner_h = target_h - bezel * 2
    screen_resized = screen_img.resize((inner_w, inner_h), Image.Resampling.LANCZOS)
    
    mask = Image.new('L', (inner_w, inner_h), 0)
    mdraw = ImageDraw.Draw(mask)
    mdraw.rounded_rectangle([0, 0, inner_w, inner_h], radius=corner_radius - bezel, fill=255)
    
    pad = 80
    phone = Image.new('RGBA', (target_w + pad * 2, target_h + pad * 2), (0, 0, 0, 0))
    
    shadow = Image.new('RGBA', (target_w + pad * 2, target_h + pad * 2), (0, 0, 0, 0))
    sdraw = ImageDraw.Draw(shadow)
    for offset, blur, alpha in [(20, 30, 40), (35, 50, 25), (10, 15, 60)]:
        sdraw.rounded_rectangle([pad, pad + offset, pad + target_w, pad + target_h + offset], radius=corner_radius, fill=(0, 0, 0, alpha))
    shadow = shadow.filter(ImageFilter.GaussianBlur(18))
    phone.paste(shadow, (0, 0), shadow)
    
    pdraw = ImageDraw.Draw(phone)
    pdraw.rounded_rectangle([pad, pad, pad + target_w, pad + target_h], radius=corner_radius, fill=(15, 15, 15, 255))
    pdraw.rounded_rectangle([pad + 2, pad + 2, pad + target_w - 2, pad + target_h - 2], radius=corner_radius - 2, outline=(45, 45, 45, 255), width=2)
    phone.paste(screen_resized, (pad + bezel, pad + bezel), mask)
    return phone, pad

def make_device_mockup_ipad(screen_img, target_w=1720, target_h=2290, corner_radius=72, bezel=30):
    inner_w = target_w - bezel * 2
    inner_h = target_h - bezel * 2
    screen_resized = screen_img.resize((inner_w, inner_h), Image.Resampling.LANCZOS)
    
    mask = Image.new('L', (inner_w, inner_h), 0)
    mdraw = ImageDraw.Draw(mask)
    mdraw.rounded_rectangle([0, 0, inner_w, inner_h], radius=corner_radius - bezel, fill=255)
    
    pad = 100
    device = Image.new('RGBA', (target_w + pad * 2, target_h + pad * 2), (0, 0, 0, 0))
    
    shadow = Image.new('RGBA', (target_w + pad * 2, target_h + pad * 2), (0, 0, 0, 0))
    sdraw = ImageDraw.Draw(shadow)
    for offset, blur, alpha in [(25, 40, 45), (45, 65, 30), (12, 20, 70)]:
        sdraw.rounded_rectangle([pad, pad + offset, pad + target_w, pad + target_h + offset], radius=corner_radius, fill=(0, 0, 0, alpha))
    shadow = shadow.filter(ImageFilter.GaussianBlur(22))
    device.paste(shadow, (0, 0), shadow)
    
    ddraw = ImageDraw.Draw(device)
    ddraw.rounded_rectangle([pad, pad, pad + target_w, pad + target_h], radius=corner_radius, fill=(20, 20, 20, 255))
    ddraw.rounded_rectangle([pad + 2, pad + 2, pad + target_w - 2, pad + target_h - 2], radius=corner_radius - 2, outline=(55, 55, 55, 255), width=3)
    device.paste(screen_resized, (pad + bezel, pad + bezel), mask)
    return device, pad

def build_store_screenshot(is_ipad, bg_color, line1_tokens, line2_tokens, subtitle_text, bottom_l1_tokens, bottom_l2_tokens, output_name):
    W, H = (2048, 2732) if is_ipad else (1242, 2688)
    canvas = Image.new('RGBA', (W, H), bg_color + (255,))
    draw = ImageDraw.Draw(canvas)
    
    accent_color = WHITE if bg_color == BG_MINT else SLATE_BLUE
    
    # 1. Headline
    f_h1_size = int(144 if is_ipad else 126)
    f_sub_size = int(44 if is_ipad else 38)
    f_h1 = ImageFont.truetype(SERIF_FONT, f_h1_size)
    f_sub = ImageFont.truetype(SANS_FONT, f_sub_size)
    
    top_y = int(130 if is_ipad else 125)
    space_w = draw.textlength(' ', font=f_h1)
    
    # Line 1
    total_l1_w = 0
    token_widths = []
    for idx, (txt, is_acc) in enumerate(line1_tokens):
        tw = draw.textlength(txt, font=f_h1)
        token_widths.append(tw)
        total_l1_w += tw
        if idx > 0:
            total_l1_w += space_w
            
    cur_x = (W - total_l1_w) / 2.0
    for idx, (txt, is_acc) in enumerate(line1_tokens):
        if idx > 0:
            cur_x += space_w
        color = accent_color if is_acc else INK_DARK
        draw.text((cur_x, top_y), txt, fill=color, font=f_h1)
        cur_x += token_widths[idx]
        
    # Line 2
    l2_y = top_y + int(f_h1_size * 1.15)
    if line2_tokens:
        total_l2_w = 0
        token_widths_l2 = []
        for idx, (txt, is_acc) in enumerate(line2_tokens):
            tw = draw.textlength(txt, font=f_h1)
            token_widths_l2.append(tw)
            total_l2_w += tw
            if idx > 0:
                total_l2_w += space_w
                
        cur_x2 = (W - total_l2_w) / 2.0
        for idx, (txt, is_acc) in enumerate(line2_tokens):
            if idx > 0:
                cur_x2 += space_w
            color = accent_color if is_acc else INK_DARK
            draw.text((cur_x2, l2_y), txt, fill=color, font=f_h1)
            cur_x2 += token_widths_l2[idx]
        next_y = l2_y + int(f_h1_size * 1.16)
    else:
        next_y = top_y + int(f_h1_size * 1.25)
        
    # Subtitle
    w_sub = draw.textlength(subtitle_text, font=f_sub)
    start_x_sub = (W - w_sub) / 2.0
    sub_color = (25, 65, 45) if bg_color == BG_MINT else SUBTITLE_MUTED
    draw.text((start_x_sub, next_y), subtitle_text, fill=sub_color, font=f_sub)
    
    # Doodle Arrow: placed near the right of Line 1, dipping down towards the device
    doodle = Image.open(DOODLE_IMG_PATH).convert('RGBA')
    d_scale = 1.70 if is_ipad else 1.35
    doodle_w = int(doodle.width * d_scale)
    doodle_h = int(doodle.height * d_scale)
    doodle_scaled = doodle.resize((doodle_w, doodle_h), Image.Resampling.LANCZOS)
    
    doodle_x = int((W + total_l1_w) / 2.0 + (30 if is_ipad else 18))
    doodle_y = int(top_y + (10 if is_ipad else 5))
    doodle_x = min(doodle_x, W - doodle_w - 20)
    canvas.paste(doodle_scaled, (doodle_x, doodle_y), doodle_scaled)
    
    # 2. Mockup Device
    if is_ipad:
        screen_img = Image.open(os.path.join(OUTPUT_DIR, 'ipad-gameplay-enhanced.png'))
        device_w = 1720
        device_h = 2290
        device_mockup, pad = make_device_mockup_ipad(screen_img, target_w=device_w, target_h=device_h, corner_radius=72, bezel=30)
        device_x = (W - device_w) // 2 - pad
        device_y = int(next_y + 115) - pad
        canvas.paste(device_mockup, (device_x, device_y), device_mockup)
    else:
        screen_img = Image.open(os.path.join(OUTPUT_DIR, 'iphone-gameplay-enhanced.png'))
        device_w = 972
        device_h = 2100
        device_mockup, pad = make_device_mockup_iphone(screen_img, target_w=device_w, target_h=device_h, corner_radius=145, bezel=22)
        device_x = (W - device_w) // 2 - pad
        device_y = int(next_y + 105) - pad
        canvas.paste(device_mockup, (device_x, device_y), device_mockup)
        
    # 3. Bottom Floating Card
    card_margin_x = int(35 if is_ipad else 20)
    card_w = W - card_margin_x * 2
    card_h = int(540 if is_ipad else 440)
    card_top_y = H - int(450 if is_ipad else 370)
    card_radius = int(95 if is_ipad else 82)
    
    bottom_surf = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    bdraw = ImageDraw.Draw(bottom_surf)
    for s_off, s_alpha in [(12, 40), (24, 25)]:
        bdraw.rounded_rectangle([card_margin_x, card_top_y + s_off, card_margin_x + card_w, card_top_y + card_h + s_off], radius=card_radius, fill=(0, 0, 0, s_alpha))
    bottom_surf = bottom_surf.filter(ImageFilter.GaussianBlur(14))
    canvas.paste(bottom_surf, (0, 0), bottom_surf)
    
    draw.rounded_rectangle([card_margin_x, card_top_y, card_margin_x + card_w, card_top_y + card_h], radius=card_radius, fill=CARD_CREAM)
    
    f_b_size = int(96 if is_ipad else 84)
    f_b = ImageFont.truetype(SERIF_FONT, f_b_size)
    space_b = draw.textlength(' ', font=f_b)
    
    # Bottom Line 1
    total_b1_w = 0
    b1_widths = []
    for idx, (txt, is_acc) in enumerate(bottom_l1_tokens):
        bw = draw.textlength(txt, font=f_b)
        b1_widths.append(bw)
        total_b1_w += bw
        if idx > 0:
            total_b1_w += space_b
            
    cur_bx1 = (W - total_b1_w) / 2.0
    by1 = card_top_y + int(55 if is_ipad else 50)
    for idx, (txt, is_acc) in enumerate(bottom_l1_tokens):
        if idx > 0:
            cur_bx1 += space_b
        color = SLATE_BLUE if is_acc else INK_DARK
        draw.text((cur_bx1, by1), txt, fill=color, font=f_b)
        cur_bx1 += b1_widths[idx]
        
    # Bottom Line 2
    if bottom_l2_tokens:
        total_b2_w = 0
        b2_widths = []
        for idx, (txt, is_acc) in enumerate(bottom_l2_tokens):
            bw = draw.textlength(txt, font=f_b)
            b2_widths.append(bw)
            total_b2_w += bw
            if idx > 0:
                total_b2_w += space_b
                
        cur_bx2 = (W - total_b2_w) / 2.0
        by2 = by1 + int(f_b_size * 1.15)
        for idx, (txt, is_acc) in enumerate(bottom_l2_tokens):
            if idx > 0:
                cur_bx2 += space_b
            color = SLATE_BLUE if is_acc else INK_DARK
            draw.text((cur_bx2, by2), txt, fill=color, font=f_b)
            cur_bx2 += b2_widths[idx]
            
    out_file = os.path.join(OUTPUT_DIR, output_name)
    canvas.convert('RGB').save(out_file, quality=95)
    print('Generated:', out_file)
    
    if not is_ipad:
        preview_w = 853
        preview_h = int(H * preview_w / W)
        prev = canvas.convert('RGB').resize((preview_w, preview_h), Image.Resampling.LANCZOS)
        prev_name = output_name.replace('.png', '-preview.png')
        prev.save(os.path.join(OUTPUT_DIR, prev_name))
        
    return canvas

def main():
    print('1. Enhancing iPhone gameplay screenshot...')
    generate_enhanced_iphone()
    
    print('2. Enhancing iPad gameplay screenshot...')
    generate_enhanced_ipad()
    
    print('3. Generating iPhone App Store Visuals...')
    # Yellow - English (Matching Reference 2)
    build_store_screenshot(
        is_ipad=False,
        bg_color=BG_YELLOW,
        line1_tokens=[('Play', False), ('your', True), ('way', False)],
        line2_tokens=[('to new words', False)],
        subtitle_text='Match the word. Fly into the correct lane.',
        bottom_l1_tokens=[('Turn vocabulary', False)],
        bottom_l2_tokens=[('into play', True)],
        output_name='iphone-store-game-yellow-en.png'
    )
    
    # Yellow - Turkish
    build_store_screenshot(
        is_ipad=False,
        bg_color=BG_YELLOW,
        line1_tokens=[('Öğrenirken', False)],
        line2_tokens=[('oyna', True)],
        subtitle_text='Doğru anlamı seç, arıyla ilerle.',
        bottom_l1_tokens=[('Bilgini oyuna', False)],
        bottom_l2_tokens=[('dönüştür', True)],
        output_name='iphone-store-game-yellow-tr.png'
    )
    
    # Mint - English (Matching Reference 1 & 3)
    build_store_screenshot(
        is_ipad=False,
        bg_color=BG_MINT,
        line1_tokens=[('Play', False), ('your', True), ('way', False)],
        line2_tokens=[('to new words', False)],
        subtitle_text='Match the word. Fly into the correct lane.',
        bottom_l1_tokens=[('Turn vocabulary', False)],
        bottom_l2_tokens=[('into play', True)],
        output_name='iphone-store-game-mint-en.png'
    )
    
    # Mint - Turkish
    build_store_screenshot(
        is_ipad=False,
        bg_color=BG_MINT,
        line1_tokens=[('Öğrenirken', False)],
        line2_tokens=[('oyna', True)],
        subtitle_text='Doğru anlamı seç, arıyla ilerle.',
        bottom_l1_tokens=[('Bilgini oyuna', False)],
        bottom_l2_tokens=[('dönüştür', True)],
        output_name='iphone-store-game-mint-tr.png'
    )

    print('4. Generating iPad App Store Visuals...')
    # iPad Yellow - English
    build_store_screenshot(
        is_ipad=True,
        bg_color=BG_YELLOW,
        line1_tokens=[('Play', False), ('your', True), ('way', False)],
        line2_tokens=[('to new words', False)],
        subtitle_text='Match the word. Fly into the correct lane.',
        bottom_l1_tokens=[('Turn vocabulary', False)],
        bottom_l2_tokens=[('into play', True)],
        output_name='ipad-store-game-yellow-en.png'
    )
    
    # iPad Yellow - Turkish
    build_store_screenshot(
        is_ipad=True,
        bg_color=BG_YELLOW,
        line1_tokens=[('Öğrenirken', False)],
        line2_tokens=[('oyna', True)],
        subtitle_text='Doğru anlamı seç, arıyla ilerle.',
        bottom_l1_tokens=[('Bilgini oyuna', False)],
        bottom_l2_tokens=[('dönüştür', True)],
        output_name='ipad-store-game-yellow-tr.png'
    )
    
    # iPad Mint - English
    build_store_screenshot(
        is_ipad=True,
        bg_color=BG_MINT,
        line1_tokens=[('Play', False), ('your', True), ('way', False)],
        line2_tokens=[('to new words', False)],
        subtitle_text='Match the word. Fly into the correct lane.',
        bottom_l1_tokens=[('Turn vocabulary', False)],
        bottom_l2_tokens=[('into play', True)],
        output_name='ipad-store-game-mint-en.png'
    )

    print('5. Creating Contact Sheet Overview...')
    sheet_w, sheet_h = 1920, 1080
    sheet = Image.new('RGB', (sheet_w, sheet_h), (24, 28, 26))
    sdraw = ImageDraw.Draw(sheet)
    f_title = ImageFont.truetype(SERIF_FONT, 44)
    sdraw.text((60, 40), 'VocBee App Store Visuals — Bee Runner Game Feature', fill=(255, 255, 255), font=f_title)
    
    thumbs = [
        ('iphone-store-game-yellow-en.png', 'iPhone (EN) - Yellow'),
        ('iphone-store-game-yellow-tr.png', 'iPhone (TR) - Yellow'),
        ('iphone-store-game-mint-en.png', 'iPhone (EN) - Mint'),
        ('ipad-store-game-yellow-en.png', 'iPad (EN) - Yellow'),
    ]
    f_lbl = ImageFont.truetype(SANS_FONT, 22)
    for idx, (fname, label) in enumerate(thumbs):
        im = Image.open(os.path.join(OUTPUT_DIR, fname))
        tw = 400
        th = int(im.height * tw / im.width)
        if th > 850:
            th = 850
            tw = int(im.width * th / im.height)
        t_resized = im.resize((tw, th), Image.Resampling.LANCZOS)
        x = 60 + idx * 455
        y = 130
        sheet.paste(t_resized, (x, y))
        sdraw.text((x + 10, y + th + 15), label, fill=(200, 210, 205), font=f_lbl)
        
    sheet.save(os.path.join(OUTPUT_DIR, 'store-visuals-overview.png'))
    print('Done all successfully!')

if __name__ == '__main__':
    main()
