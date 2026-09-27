import os
import math
from PIL import Image, ImageDraw, ImageFont, ImageFilter

ASSETS_DIR = r"c:\Users\moham\Downloads\DFC\apps\mobile\assets"
os.makedirs(ASSETS_DIR, exist_ok=True)

# Brand colors from tokens.ts
BURGUNDY_PRIMARY = (122, 31, 61)   # #7A1F3D
BURGUNDY_DEEP = (94, 23, 48)       # #5E1730
BURGUNDY_DARK = (60, 12, 28)       # #3C0C1C
CREAM = (250, 245, 238)            # #FAF5EE
GOLD_ACCENT = (230, 180, 80)       # #E6B450
CHARCOAL = (31, 41, 55)            # #1F2937
MUTED = (107, 114, 128)            # #6B7280

FONT_DIR = os.path.join(os.environ.get('WINDIR', 'C:\\Windows'), 'Fonts')
FONT_BOLD = os.path.join(FONT_DIR, 'seguisb.ttf') if os.path.exists(os.path.join(FONT_DIR, 'seguisb.ttf')) else os.path.join(FONT_DIR, 'arialbd.ttf')
FONT_REG = os.path.join(FONT_DIR, 'segoeui.ttf') if os.path.exists(os.path.join(FONT_DIR, 'segoeui.ttf')) else os.path.join(FONT_DIR, 'arial.ttf')

def create_gradient(width, height, c1, c2):
    base = Image.new('RGB', (width, height), c1)
    top = Image.new('RGB', (width, height), c2)
    mask = Image.new('L', (width, height))
    for y in range(height):
        for x in range(width):
            ratio = (x + y) / (width + height)
            mask.putpixel((x, y), int(ratio * 255))
    base.paste(top, (0, 0), mask)
    return base

def generate_app_icon():
    # 1024x1024 full-bleed square icon (Apple / Android launcher)
    size = 1024
    img = create_gradient(size, size, BURGUNDY_PRIMARY, BURGUNDY_DARK)
    draw = ImageDraw.Draw(img)

    # Subtle inner ambient glow
    glow = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    glow_draw = ImageDraw.Draw(glow)
    glow_draw.ellipse([size * 0.15, size * 0.1, size * 0.85, size * 0.8], fill=(255, 255, 255, 18))
    glow = glow.filter(ImageFilter.GaussianBlur(80))
    img.paste(glow, (0, 0), glow)

    # Render "DFC"
    try:
        font_main = ImageFont.truetype(FONT_BOLD, 360)
        font_sub = ImageFont.truetype(FONT_BOLD, 46)
    except Exception:
        font_main = ImageFont.load_default()
        font_sub = ImageFont.load_default()

    text = "DFC"
    bbox = draw.textbbox((0, 0), text, font=font_main)
    w = bbox[2] - bbox[0]
    h = bbox[3] - bbox[1]
    x = (size - w) // 2 - bbox[0]
    y = (size - h) // 2 - bbox[1] - 40

    # Drop shadow
    shadow_offset = 12
    draw.text((x + 2, y + shadow_offset), text, font=font_main, fill=(30, 5, 12, 180))

    # Main text in warm cream
    draw.text((x, y), text, font=font_main, fill=CREAM)

    # Sleek gold accent line under DFC
    line_y = y + h + bbox[1] + 35
    line_w = int(w * 0.6)
    line_x1 = (size - line_w) // 2
    line_x2 = line_x1 + line_w
    draw.rounded_rectangle([line_x1, line_y, line_x2, line_y + 8], radius=4, fill=GOLD_ACCENT)

    # Subtitle "MADURAI"
    sub_text = "M A D U R A I"
    s_bbox = draw.textbbox((0, 0), sub_text, font=font_sub)
    sw = s_bbox[2] - s_bbox[0]
    sx = (size - sw) // 2 - s_bbox[0]
    sy = line_y + 24
    draw.text((sx, sy), sub_text, font=font_sub, fill=(240, 220, 210))

    out_path = os.path.join(ASSETS_DIR, "icon.png")
    img.save(out_path, "PNG", optimize=True)
    print(f"Created {out_path} ({size}x{size})")
    return img

def generate_adaptive_icon():
    # 1024x1024 with foreground in safe area (center ~600px)
    size = 1024
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Draw centered badge inside safe zone
    badge_radius = 290
    center_x, center_y = size // 2, size // 2
    box = [center_x - badge_radius, center_y - badge_radius, center_x + badge_radius, center_y + badge_radius]
    
    # Shadow for badge
    shadow = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    s_draw = ImageDraw.Draw(shadow)
    s_draw.ellipse([box[0] + 4, box[1] + 16, box[2] + 4, box[3] + 16], fill=(0, 0, 0, 80))
    shadow = shadow.filter(ImageFilter.GaussianBlur(25))
    img.paste(shadow, (0, 0), shadow)

    draw.ellipse(box, fill=BURGUNDY_PRIMARY)

    try:
        font_main = ImageFont.truetype(FONT_BOLD, 220)
        font_sub = ImageFont.truetype(FONT_BOLD, 30)
    except Exception:
        font_main = ImageFont.load_default()
        font_sub = ImageFont.load_default()

    text = "DFC"
    bbox = draw.textbbox((0, 0), text, font=font_main)
    w = bbox[2] - bbox[0]
    h = bbox[3] - bbox[1]
    x = (size - w) // 2 - bbox[0]
    y = (size - h) // 2 - bbox[1] - 25
    draw.text((x, y), text, font=font_main, fill=CREAM)

    # Gold accent
    line_y = y + h + bbox[1] + 15
    line_w = int(w * 0.5)
    line_x1 = (size - line_w) // 2
    line_x2 = line_x1 + line_w
    draw.rounded_rectangle([line_x1, line_y, line_x2, line_y + 6], radius=3, fill=GOLD_ACCENT)

    sub_text = "M A D U R A I"
    s_bbox = draw.textbbox((0, 0), sub_text, font=font_sub)
    sw = s_bbox[2] - s_bbox[0]
    sx = (size - sw) // 2 - s_bbox[0]
    sy = line_y + 16
    draw.text((sx, sy), sub_text, font=font_sub, fill=(240, 220, 210))

    out_path = os.path.join(ASSETS_DIR, "adaptive-icon.png")
    img.save(out_path, "PNG", optimize=True)
    print(f"Created {out_path} ({size}x{size})")

def generate_splash():
    # 1284x2778 splash screen (light clean background #FFFFFF matching app.config.js)
    w, h = 1284, 2778
    img = Image.new('RGB', (w, h), (255, 255, 255))
    draw = ImageDraw.Draw(img)

    center_x = w // 2
    center_y = int(h * 0.44)
    badge_radius = 200
    box = [center_x - badge_radius, center_y - badge_radius, center_x + badge_radius, center_y + badge_radius]

    shadow = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    s_draw = ImageDraw.Draw(shadow)
    s_draw.ellipse([box[0], box[1] + 15, box[2], box[3] + 15], fill=(0, 0, 0, 25))
    shadow = shadow.filter(ImageFilter.GaussianBlur(30))
    img.paste(shadow, (0, 0), shadow)

    draw.ellipse(box, fill=BURGUNDY_PRIMARY)

    try:
        font_main = ImageFont.truetype(FONT_BOLD, 150)
        font_title = ImageFont.truetype(FONT_BOLD, 52)
        font_subtitle = ImageFont.truetype(FONT_REG, 34)
    except Exception:
        font_main = ImageFont.load_default()
        font_title = ImageFont.load_default()
        font_subtitle = ImageFont.load_default()

    text = "DFC"
    bbox = draw.textbbox((0, 0), text, font=font_main)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]
    tx = center_x - tw // 2 - bbox[0]
    ty = center_y - th // 2 - bbox[1] - 15
    draw.text((tx, ty), text, font=font_main, fill=CREAM)

    bar_y = ty + th + bbox[1] + 10
    bar_w = int(tw * 0.5)
    draw.rounded_rectangle([center_x - bar_w//2, bar_y, center_x + bar_w//2, bar_y + 5], radius=3, fill=GOLD_ACCENT)

    title = "DINASARI FOOD COURIER"
    t_bbox = draw.textbbox((0, 0), title, font=font_title)
    t_w = t_bbox[2] - t_bbox[0]
    draw.text((center_x - t_w // 2 - t_bbox[0], center_y + badge_radius + 60), title, font=font_title, fill=CHARCOAL)

    sub = "Hyper-Local Delivery \u2022 Madurai"
    s_bbox = draw.textbbox((0, 0), sub, font=font_subtitle)
    s_w = s_bbox[2] - s_bbox[0]
    draw.text((center_x - s_w // 2 - s_bbox[0], center_y + badge_radius + 130), sub, font=font_subtitle, fill=MUTED)

    out_path = os.path.join(ASSETS_DIR, "splash.png")
    img.save(out_path, "PNG", optimize=True)
    print(f"Created {out_path} ({w}x{h})")

def generate_favicon(icon_img):
    favicon = icon_img.resize((48, 48), Image.Resampling.LANCZOS)
    out_path = os.path.join(ASSETS_DIR, "favicon.png")
    favicon.save(out_path, "PNG")
    print(f"Created {out_path} (48x48)")

if __name__ == "__main__":
    icon = generate_app_icon()
    generate_adaptive_icon()
    generate_splash()
    generate_favicon(icon)
    print("All mobile assets generated successfully!")
