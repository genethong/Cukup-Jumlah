#!/usr/bin/env python3
"""
Generate precision papercraft assets for modern batch 1:
- outfits/tshirt.webp
- sleeves/tshirt_upper.webp
- outfits/hoodie.webp
- sleeves/hoodie_upper.webp
- sleeves/hoodie_forearm.webp
"""

import os
import math
import numpy as np
from PIL import Image, ImageFilter, ImageDraw
from scipy.ndimage import binary_erosion, gaussian_filter

def create_cardstock(width, height, base_rgb, fiber_strength=0.035, seed=42):
    """Generate authentic heavyweight cardstock paper texture."""
    np.random.seed(seed)
    tex = np.zeros((height, width, 3), dtype=np.float32)
    for c in range(3):
        tex[:, :, c] = base_rgb[c]
    
    noise = np.random.normal(0, fiber_strength * 255, (height, width, 1))
    x = np.linspace(0, 12, width)
    y = np.linspace(0, 12, height)
    xx, yy = np.meshgrid(x, y)
    pulp = np.sin(xx * 2.1 + yy * 1.8) * (fiber_strength * 0.4 * 255)
    
    tex = tex + noise + pulp[:, :, np.newaxis]
    return np.clip(tex, 0, 255).astype(np.uint8)

def apply_cardstock_bevel(img_rgba, mask_bool, depth=2, light_angle_deg=135):
    """Apply cut-edge bevel directly onto an RGBA image."""
    rad = math.radians(light_angle_deg)
    dx = math.cos(rad)
    dy = -math.sin(rad)
    
    eroded1 = binary_erosion(mask_bool, iterations=1)
    eroded2 = binary_erosion(mask_bool, iterations=depth)
    edge = mask_bool & ~eroded2
    
    shifted_light = np.roll(np.roll(mask_bool, int(round(dy)), axis=0), int(round(dx)), axis=1)
    shifted_shadow = np.roll(np.roll(mask_bool, -int(round(dy)), axis=0), -int(round(dx)), axis=1)
    
    highlight = edge & ~shifted_light
    shadow = edge & ~shifted_shadow
    neutral = edge & ~highlight & ~shadow
    
    arr = np.array(img_rgba, dtype=np.float32)
    
    # Highlight: lighter cut edge
    for c in range(3):
        arr[highlight, c] = np.clip(arr[highlight, c] * 1.12, 0, 255)
        arr[shadow, c] = np.clip(arr[shadow, c] * 0.80, 0, 255)
        arr[neutral, c] = np.clip(arr[neutral, c] * 0.90, 0, 255)
        
    return Image.fromarray(arr.astype(np.uint8))

def make_drop_shadow(mask_im, offset=(2, 3), blur_radius=3.5, shadow_alpha=0.35, shadow_rgb=(30, 20, 15)):
    """Create a soft, warm paper drop shadow image."""
    w, h = mask_im.size
    offset_mask = Image.new("L", (w, h), 0)
    offset_mask.paste(mask_im, offset)
    offset_mask = offset_mask.filter(ImageFilter.GaussianBlur(blur_radius))
    
    shadow_arr = np.zeros((h, w, 4), dtype=np.uint8)
    shadow_arr[:, :, 0] = shadow_rgb[0]
    shadow_arr[:, :, 1] = shadow_rgb[1]
    shadow_arr[:, :, 2] = shadow_rgb[2]
    shadow_arr[:, :, 3] = (np.array(offset_mask, dtype=np.float32) * shadow_alpha).astype(np.uint8)
    
    return Image.fromarray(shadow_arr)

def draw_brass_pin(img, cx, cy, radius=7):
    """Draw authentic metallic brass split-pin rivet."""
    pin_canvas = Image.new("RGBA", img.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(pin_canvas)
    
    draw.ellipse([cx - radius - 1, cy - radius - 1, cx + radius + 1, cy + radius + 1], fill=(45, 30, 15, 220))
    draw.ellipse([cx - radius, cy - radius, cx + radius, cy + radius], fill=(145, 105, 40, 255))
    draw.ellipse([cx - radius + 1, cy - radius + 1, cx + radius - 1, cy + radius - 1], fill=(195, 150, 60, 255))
    draw.ellipse([cx - radius + 2, cy - radius + 2, cx + radius - 2, cy + radius - 2], fill=(225, 185, 90, 255))
    draw.ellipse([cx - radius + 3, cy - radius + 2, cx - radius + 5, cy - radius + 4], fill=(255, 250, 210, 245))
    draw.line([cx - radius + 3, cy, cx + radius - 3, cy], fill=(90, 60, 20, 230), width=1)
    
    img.alpha_composite(pin_canvas)

def generate_tshirt():
    """Craft papercraft T-shirt body (441x561)."""
    w, h = 441, 561
    base_rgb = (246, 242, 234) # Warm off-white cardstock
    tex = create_cardstock(w, h, base_rgb, fiber_strength=0.035, seed=101)
    
    # 1. Base torso silhouette mask
    body_mask = Image.new("L", (w, h), 0)
    draw = ImageDraw.Draw(body_mask)
    
    # Smooth polygon following the torso and natural sleeve caps
    # Neck: (221, 35)
    # Left shoulder slope: (221, 35) -> (170, 48) -> (115, 85) -> (62, 136)
    # Left sleeve cap: extends past shoulder pin (62, 136) down-outward along arm angle (~15 deg) to (32, 160)
    # then curves into armpit at (66, 188)
    # Side seam: (66, 188) -> (72, 340) -> (66, 512) -> (65, 538)
    # Bottom hem: (65, 538) across to (376, 538)
    # Right side seam: (376, 538) -> (375, 512) -> (369, 340) -> (375, 188)
    # Right sleeve cap: (375, 188) -> (409, 160) -> (377, 136) -> (326, 85) -> (271, 48) -> (221, 35)
    
    poly_points = [
        (170, 48),
        (115, 85),
        (62, 136),
        (32, 160),
        (38, 178),
        (66, 188),
        (72, 340),
        (66, 512),
        (65, 538),
        (376, 538),
        (375, 512),
        (369, 340),
        (375, 188),
        (403, 178),
        (409, 160),
        (377, 136),
        (326, 85),
        (271, 48),
        (221, 48)
    ]
    draw.polygon(poly_points, fill=255)
    
    # Crew neck cutout
    neck_cutout = Image.new("L", (w, h), 0)
    neck_draw = ImageDraw.Draw(neck_cutout)
    neck_draw.ellipse([221 - 44, 35 - 15, 221 + 44, 35 + 24], fill=255)
    
    body_arr = np.array(body_mask) > 128
    neck_arr = np.array(neck_cutout) > 128
    body_arr = body_arr & ~neck_arr
    
    body_mask = Image.fromarray((body_arr * 255).astype(np.uint8))
    
    # Base T-shirt image
    tshirt = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    tex_rgba = Image.fromarray(np.dstack([tex, np.ones((h, w), dtype=np.uint8) * 255]))
    tshirt.paste(tex_rgba, (0, 0), body_mask)
    tshirt = apply_cardstock_bevel(tshirt, body_arr, depth=2)
    
    # 2. Add subtle double-stitch score line at bottom hem (y = 524)
    draw_t = ImageDraw.Draw(tshirt)
    draw_t.line([72, 524, 369, 524], fill=(215, 208, 198, 180), width=1)
    
    # 3. Add collar seam layer (separate paper cut-out ring with drop shadow)
    collar_mask = Image.new("L", (w, h), 0)
    c_draw = ImageDraw.Draw(collar_mask)
    # Outer collar ring
    c_draw.ellipse([221 - 52, 35 - 18, 221 + 52, 35 + 32], fill=255)
    # Inner cutout
    c_draw.ellipse([221 - 42, 35 - 12, 221 + 42, 35 + 20], fill=0)
    # Intersect with chest
    collar_arr = (np.array(collar_mask) > 128) & body_arr
    collar_mask_im = Image.fromarray((collar_arr * 255).astype(np.uint8))
    
    # Collar drop shadow onto chest
    c_shadow = make_drop_shadow(collar_mask_im, offset=(1, 2), blur_radius=2.5, shadow_alpha=0.32, shadow_rgb=(35, 25, 18))
    
    # Collar paper layer (slightly textured off-white)
    c_tex = create_cardstock(w, h, (242, 238, 228), fiber_strength=0.03, seed=102)
    c_img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    c_rgba = Image.fromarray(np.dstack([c_tex, np.ones((h, w), dtype=np.uint8) * 255]))
    c_img.paste(c_rgba, (0, 0), collar_mask_im)
    c_img = apply_cardstock_bevel(c_img, collar_arr, depth=2)
    
    # Composite collar shadow, then collar layer
    tshirt.alpha_composite(c_shadow)
    tshirt.alpha_composite(c_img)
    
    # 4. Brass split pins at shoulders [62, 136] and [377, 136]
    draw_brass_pin(tshirt, 62, 136, radius=7)
    draw_brass_pin(tshirt, 377, 136, radius=7)
    
    # 5. Whole T-shirt drop shadow
    full_mask = Image.fromarray((np.array(tshirt)[:, :, 3] > 50).astype(np.uint8) * 255)
    full_shadow = make_drop_shadow(full_mask, offset=(2, 3), blur_radius=3.5, shadow_alpha=0.28, shadow_rgb=(30, 20, 15))
    
    final_tshirt = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    final_tshirt.alpha_composite(full_shadow)
    final_tshirt.alpha_composite(tshirt)
    
    return final_tshirt

def generate_tshirt_upper():
    """Craft papercraft T-shirt upper sleeve (106x140)."""
    w, h = 106, 140
    base_rgb = (246, 242, 234)
    tex = create_cardstock(w, h, base_rgb, fiber_strength=0.035, seed=103)
    
    # Shoulder pin is at [53, 41]
    # Rounded top cap pivoting over shoulder, tapering down to mid-bicep (y ~ 126)
    sleeve_mask = Image.new("L", (w, h), 0)
    draw = ImageDraw.Draw(sleeve_mask)
    
    poly_points = [
        (53, 10),
        (30, 16),
        (14, 32),
        (8, 52),
        (12, 85),
        (18, 126),
        (88, 126),
        (94, 85),
        (98, 52),
        (92, 32),
        (76, 16)
    ]
    draw.polygon(poly_points, fill=255)
    # Round top cap
    draw.ellipse([8, 10, 98, 72], fill=255)
    
    mask_arr = np.array(sleeve_mask) > 128
    mask_im = Image.fromarray((mask_arr * 255).astype(np.uint8))
    
    sleeve = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    tex_rgba = Image.fromarray(np.dstack([tex, np.ones((h, w), dtype=np.uint8) * 255]))
    sleeve.paste(tex_rgba, (0, 0), mask_im)
    sleeve = apply_cardstock_bevel(sleeve, mask_arr, depth=2)
    
    # Folded hem band at y = 114..126
    draw_s = ImageDraw.Draw(sleeve)
    draw_s.line([18, 114, 88, 114], fill=(215, 208, 198, 190), width=1)
    
    # Brass pin at [53, 41]
    draw_brass_pin(sleeve, 53, 41, radius=7)
    
    # Drop shadow
    full_mask = Image.fromarray((np.array(sleeve)[:, :, 3] > 50).astype(np.uint8) * 255)
    shadow = make_drop_shadow(full_mask, offset=(2, 3), blur_radius=3.0, shadow_alpha=0.30, shadow_rgb=(30, 20, 15))
    
    final_sleeve = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    final_sleeve.alpha_composite(shadow)
    final_sleeve.alpha_composite(sleeve)
    
    return final_sleeve

def generate_hoodie():
    """Craft flat layered papercraft Hoodie body (441x561)."""
    w, h = 441, 561
    charcoal_rgb = (66, 62, 59) # Flat charcoal slate cardstock
    tex = create_cardstock(w, h, charcoal_rgb, fiber_strength=0.035, seed=201)
    
    # 1. Base torso body mask
    body_mask = Image.new("L", (w, h), 0)
    draw = ImageDraw.Draw(body_mask)
    
    poly_points = [
        (170, 48),
        (115, 85),
        (62, 136),
        (30, 160),
        (36, 178),
        (66, 188),
        (70, 340),
        (65, 512),
        (64, 538),
        (377, 538),
        (376, 512),
        (371, 340),
        (375, 188),
        (405, 178),
        (411, 160),
        (377, 136),
        (326, 85),
        (271, 48),
        (221, 48)
    ]
    draw.polygon(poly_points, fill=255)
    
    # Neck cutout
    neck_cutout = Image.new("L", (w, h), 0)
    neck_draw = ImageDraw.Draw(neck_cutout)
    neck_draw.ellipse([221 - 45, 35 - 15, 221 + 45, 35 + 24], fill=255)
    
    body_arr = (np.array(body_mask) > 128) & ~(np.array(neck_cutout) > 128)
    body_mask = Image.fromarray((body_arr * 255).astype(np.uint8))
    
    hoodie = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    tex_rgba = Image.fromarray(np.dstack([tex, np.ones((h, w), dtype=np.uint8) * 255]))
    hoodie.paste(tex_rgba, (0, 0), body_mask)
    hoodie = apply_cardstock_bevel(hoodie, body_arr, depth=2)
    
    # Bottom ribbed hem band from y = 495 to 538
    draw_h = ImageDraw.Draw(hoodie)
    draw_h.line([66, 495, 375, 495], fill=(45, 42, 40, 230), width=2)
    # Subtle ribbing score marks
    for rx in range(85, 360, 12):
        draw_h.line([rx, 497, rx, 536], fill=(54, 50, 48, 120), width=1)
        
    # 2. Separate Kangaroo Pocket Layer (y = 350 to 488)
    pocket_mask = Image.new("L", (w, h), 0)
    p_draw = ImageDraw.Draw(pocket_mask)
    pocket_pts = [
        (142, 352),
        (299, 352),
        (340, 420),
        (340, 488),
        (101, 488),
        (101, 420)
    ]
    p_draw.polygon(pocket_pts, fill=255)
    pocket_arr = np.array(pocket_mask) > 128
    pocket_mask_im = Image.fromarray((pocket_arr * 255).astype(np.uint8))
    
    # Pocket drop shadow onto body
    p_shadow = make_drop_shadow(pocket_mask_im, offset=(1, 3), blur_radius=3.5, shadow_alpha=0.45, shadow_rgb=(20, 15, 12))
    
    # Pocket paper texture
    p_tex = create_cardstock(w, h, (70, 66, 62), fiber_strength=0.035, seed=202)
    p_img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    p_rgba = Image.fromarray(np.dstack([p_tex, np.ones((h, w), dtype=np.uint8) * 255]))
    p_img.paste(p_rgba, (0, 0), pocket_mask_im)
    p_img = apply_cardstock_bevel(p_img, pocket_arr, depth=2)
    
    # Slanted hand-entry welt lines
    p_draw_img = ImageDraw.Draw(p_img)
    p_draw_img.line([142, 352, 101, 420], fill=(42, 38, 35, 230), width=2)
    p_draw_img.line([299, 352, 340, 420], fill=(42, 38, 35, 230), width=2)
    
    # 3. Separate Hood Paper Layer (framing neck and draping over collarbone y = 15 to 135)
    hood_mask = Image.new("L", (w, h), 0)
    hd_draw = ImageDraw.Draw(hood_mask)
    hood_pts = [
        (155, 30),
        (221, 15),
        (287, 30),
        (315, 75),
        (305, 125),
        (265, 145),
        (221, 125),
        (177, 145),
        (137, 125),
        (127, 75)
    ]
    hd_draw.polygon(hood_pts, fill=255)
    # Inner opening
    hd_draw.ellipse([221 - 42, 35 - 12, 221 + 42, 35 + 40], fill=0)
    hood_arr = np.array(hood_mask) > 128
    hood_mask_im = Image.fromarray((hood_arr * 255).astype(np.uint8))
    
    hd_shadow = make_drop_shadow(hood_mask_im, offset=(1, 3), blur_radius=4.0, shadow_alpha=0.50, shadow_rgb=(18, 14, 10))
    
    hd_tex = create_cardstock(w, h, (62, 58, 55), fiber_strength=0.035, seed=203)
    hd_img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    hd_rgba = Image.fromarray(np.dstack([hd_tex, np.ones((h, w), dtype=np.uint8) * 255]))
    hd_img.paste(hd_rgba, (0, 0), hood_mask_im)
    hd_img = apply_cardstock_bevel(hd_img, hood_arr, depth=2)
    
    # 4. White paper drawstrings hanging from hood
    string_canvas = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    s_draw = ImageDraw.Draw(string_canvas)
    # Left string from (198, 105) to (195, 215)
    s_draw.line([198, 105, 196, 215], fill=(232, 228, 220, 240), width=3)
    s_draw.ellipse([193, 212, 199, 222], fill=(185, 175, 160, 255)) # aglet
    # Right string from (244, 105) to (247, 215)
    s_draw.line([244, 105, 246, 215], fill=(232, 228, 220, 240), width=3)
    s_draw.ellipse([243, 212, 249, 222], fill=(185, 175, 160, 255))
    
    string_mask = Image.fromarray((np.array(string_canvas)[:, :, 3] > 50).astype(np.uint8) * 255)
    s_shadow = make_drop_shadow(string_mask, offset=(1, 2), blur_radius=2.0, shadow_alpha=0.35, shadow_rgb=(20, 15, 12))
    
    # Composite all layers onto body:
    # Body -> Pocket shadow -> Pocket -> Hood shadow -> Hood -> String shadow -> String
    hoodie.alpha_composite(p_shadow)
    hoodie.alpha_composite(p_img)
    hoodie.alpha_composite(hd_shadow)
    hoodie.alpha_composite(hd_img)
    hoodie.alpha_composite(s_shadow)
    hoodie.alpha_composite(string_canvas)
    
    # 5. Brass split pins at [62, 136] and [377, 136]
    draw_brass_pin(hoodie, 62, 136, radius=7)
    draw_brass_pin(hoodie, 377, 136, radius=7)
    
    # 6. Overall garment drop shadow
    full_mask = Image.fromarray((np.array(hoodie)[:, :, 3] > 50).astype(np.uint8) * 255)
    full_shadow = make_drop_shadow(full_mask, offset=(2, 3), blur_radius=3.5, shadow_alpha=0.32, shadow_rgb=(25, 18, 12))
    
    final_hoodie = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    final_hoodie.alpha_composite(full_shadow)
    final_hoodie.alpha_composite(hoodie)
    
    return final_hoodie

def generate_hoodie_upper():
    """Craft papercraft Hoodie upper sleeve (106x205)."""
    w, h = 106, 205
    charcoal_rgb = (66, 62, 59)
    tex = create_cardstock(w, h, charcoal_rgb, fiber_strength=0.035, seed=204)
    
    # Shoulder pin is at [53, 41]
    # Reaches down to elbow at y ~ 198
    sleeve_mask = Image.new("L", (w, h), 0)
    draw = ImageDraw.Draw(sleeve_mask)
    
    poly_points = [
        (53, 10),
        (28, 16),
        (12, 32),
        (6, 52),
        (10, 120),
        (14, 198),
        (92, 198),
        (96, 120),
        (100, 52),
        (94, 32),
        (78, 16)
    ]
    draw.polygon(poly_points, fill=255)
    draw.ellipse([6, 10, 100, 72], fill=255)
    
    mask_arr = np.array(sleeve_mask) > 128
    mask_im = Image.fromarray((mask_arr * 255).astype(np.uint8))
    
    sleeve = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    tex_rgba = Image.fromarray(np.dstack([tex, np.ones((h, w), dtype=np.uint8) * 255]))
    sleeve.paste(tex_rgba, (0, 0), mask_im)
    sleeve = apply_cardstock_bevel(sleeve, mask_arr, depth=2)
    
    # Brass pin at [53, 41]
    draw_brass_pin(sleeve, 53, 41, radius=7)
    
    full_mask = Image.fromarray((np.array(sleeve)[:, :, 3] > 50).astype(np.uint8) * 255)
    shadow = make_drop_shadow(full_mask, offset=(2, 3), blur_radius=3.0, shadow_alpha=0.32, shadow_rgb=(25, 18, 12))
    
    final_sleeve = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    final_sleeve.alpha_composite(shadow)
    final_sleeve.alpha_composite(sleeve)
    
    return final_sleeve

def generate_hoodie_forearm():
    """
    Craft papercraft Hoodie forearm sleeve (114x292).
    Elbow pin is at [57, 17].
    Wrist pin of base/forearm_hand is at y=210 relative to elbow at y=32 => +178px.
    So in this sleeve, wrist cuff terminates at y = 17 + 178 = 195.
    BELOW y = 195: 100% TRANSPARENT so the chibi hand is fully visible below the cuff!
    """
    w, h = 114, 292
    charcoal_rgb = (66, 62, 59)
    tex = create_cardstock(w, h, charcoal_rgb, fiber_strength=0.035, seed=205)
    
    # Forearm sleeve covers elbow (y=2..175), ending in ribbed cuff at y=175..195
    sleeve_mask = Image.new("L", (w, h), 0)
    draw = ImageDraw.Draw(sleeve_mask)
    
    poly_points = [
        (57, 4),
        (30, 8),
        (12, 18),
        (8, 40),
        (12, 110),
        (22, 175),
        (24, 195),
        (90, 195),
        (92, 175),
        (102, 110),
        (106, 40),
        (102, 18),
        (84, 8)
    ]
    draw.polygon(poly_points, fill=255)
    draw.ellipse([8, 4, 106, 36], fill=255)
    
    mask_arr = np.array(sleeve_mask) > 128
    # Enforce strictly nothing below y = 195
    mask_arr[196:, :] = False
    mask_im = Image.fromarray((mask_arr * 255).astype(np.uint8))
    
    sleeve = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    tex_rgba = Image.fromarray(np.dstack([tex, np.ones((h, w), dtype=np.uint8) * 255]))
    sleeve.paste(tex_rgba, (0, 0), mask_im)
    sleeve = apply_cardstock_bevel(sleeve, mask_arr, depth=2)
    
    # Ribbed wrist cuff from y = 175 to 195
    draw_s = ImageDraw.Draw(sleeve)
    draw_s.line([22, 175, 92, 175], fill=(42, 38, 35, 230), width=2)
    # Vertical rib score lines
    for cx in range(30, 88, 8):
        draw_s.line([cx, 176, cx, 194], fill=(52, 48, 45, 140), width=1)
    # Cuff bottom edge highlight / bevel line
    draw_s.line([24, 195, 90, 195], fill=(35, 30, 28, 255), width=1)
    
    full_mask = Image.fromarray((np.array(sleeve)[:, :, 3] > 50).astype(np.uint8) * 255)
    shadow = make_drop_shadow(full_mask, offset=(2, 3), blur_radius=3.0, shadow_alpha=0.32, shadow_rgb=(25, 18, 12))
    
    final_sleeve = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    final_sleeve.alpha_composite(shadow)
    final_sleeve.alpha_composite(sleeve)
    
    # Final sanity check: ensure rows 196..291 have 0 alpha for the hand area below
    final_arr = np.array(final_sleeve)
    # Let drop shadow cast slightly below y=195 (up to y=202), but after y=204 strictly zero
    final_arr[205:, :, :] = 0
    final_sleeve = Image.fromarray(final_arr)
    
    return final_sleeve

if __name__ == "__main__":
    os.makedirs("/tmp/batch1_test", exist_ok=True)
    
    tshirt = generate_tshirt()
    tshirt.save("/tmp/batch1_test/tshirt.png")
    print("Generated tshirt: size =", tshirt.size)
    
    t_upper = generate_tshirt_upper()
    t_upper.save("/tmp/batch1_test/tshirt_upper.png")
    print("Generated tshirt_upper: size =", t_upper.size)
    
    hoodie = generate_hoodie()
    hoodie.save("/tmp/batch1_test/hoodie.png")
    print("Generated hoodie: size =", hoodie.size)
    
    h_upper = generate_hoodie_upper()
    h_upper.save("/tmp/batch1_test/hoodie_upper.png")
    print("Generated hoodie_upper: size =", h_upper.size)
    
    h_forearm = generate_hoodie_forearm()
    h_forearm.save("/tmp/batch1_test/hoodie_forearm.png")
    print("Generated hoodie_forearm: size =", h_forearm.size)
