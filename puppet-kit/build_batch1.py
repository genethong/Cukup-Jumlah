"""Build script for Modern Clothes Batch 1 (Puppet v3)
Processes raw generations on chroma green, despills fringe, crops, resizes to target scale,
and exports WebP files to public/puppet.
"""
import os
import subprocess
import numpy as np
from PIL import Image
from scipy import ndimage

def key_image(raw_path, pad=6):
    im = np.asarray(Image.open(raw_path).convert('RGB')).astype(float)
    # Background estimation from corners
    bg = np.median(
        np.concatenate([
            im[:20, :20].reshape(-1, 3),
            im[-20:, -20:].reshape(-1, 3),
            im[:20, -20:].reshape(-1, 3),
            im[-20:, :20].reshape(-1, 3),
        ]),
        axis=0
    )
    d = np.linalg.norm(im - bg, axis=2)
    g = im[..., 1] - np.maximum(im[..., 0], im[..., 2])
    a = np.clip((d - 35) / 40.0, 0, 1)
    a = np.where(g > 40, np.minimum(a, np.clip((90 - g) / 50.0, 0, 1)), a)

    # Despill green fringe
    im_copy = im.copy()
    im_copy[..., 1] = np.minimum(im_copy[..., 1], np.maximum(im_copy[..., 0], im_copy[..., 2]) + 10)

    # Keep largest components
    lab, n = ndimage.label(a > 0.5)
    if n > 1:
        sz = ndimage.sum(np.ones_like(lab), lab, range(1, n + 1))
        keep = np.isin(lab, [i + 1 for i, s in enumerate(sz) if s > 2000])
        a = a * ndimage.binary_dilation(keep, iterations=3)

    rgba = Image.fromarray(np.dstack([im_copy, a * 255]).clip(0, 255).astype(np.uint8), 'RGBA')
    bb = rgba.getchannel('A').point(lambda v: 255 if v > 20 else 0).getbbox()
    x0, y0, x1, y1 = max(0, bb[0] - pad), max(0, bb[1] - pad), min(rgba.width, bb[2] + pad), min(rgba.height, bb[3] + pad)
    return rgba.crop((x0, y0, x1, y1))

def main():
    root = os.path.dirname(os.path.abspath(__file__))
    repo_root = os.path.abspath(os.path.join(root, '..'))
    raw_dir = os.path.join(root, 'raw')
    v3_parts_dir = os.path.join(root, 'v3', 'parts')
    public_dir = os.path.join(repo_root, 'public', 'puppet')

    tasks = [
        # (category, name, raw_rel, target_size, [public_rel_dests])
        ('outfits', 'tshirt', 'tops/tshirt.jpg', (441, 561), ['outfits/tshirt.webp']),
        ('outfits', 'hoodie', 'tops/hoodie.jpg', (441, 561), ['outfits/hoodie.webp']),
        ('sleeves', 'tshirt_upper', 'sleeves/tshirt_upper.jpg', (106, 140), ['sleeves/tshirt_upper.webp']),
        ('sleeves', 'hoodie_upper', 'sleeves/hoodie_upper.jpg', (106, 205), ['sleeves/hoodie_upper.webp']),
        ('sleeves', 'hoodie_forearm', 'sleeves/hoodie_forearm.jpg', (114, 292), ['sleeves/hoodie_forearm.webp']),
        ('trousers', 'jeans', 'trousers/jeans.jpg', (107, 360), ['trousers/jeans.webp', 'trousers/tshirt.webp', 'trousers/hoodie.webp']),
        ('footwear', 'sneakers', 'footwear/sneakers.jpg', (200, 148), ['footwear/sneakers.webp']),
    ]

    for cat, name, raw_rel, target_size, public_dests in tasks:
        raw_path = os.path.join(raw_dir, raw_rel)
        if not os.path.exists(raw_path):
            print(f"Skipping {name}: {raw_path} not found")
            continue

        cropped = key_image(raw_path)
        resized = cropped.resize(target_size, Image.LANCZOS)

        out_png_dir = os.path.join(v3_parts_dir, cat)
        os.makedirs(out_png_dir, exist_ok=True)
        out_png = os.path.join(out_png_dir, f"{name}.png")
        resized.save(out_png)
        print(f"Wrote PNG {out_png} {target_size}")

        for pub_rel in public_dests:
            pub_path = os.path.join(public_dir, pub_rel)
            os.makedirs(os.path.dirname(pub_path), exist_ok=True)
            subprocess.run(['cwebp', '-q', '90', '-alpha_q', '100', out_png, '-o', pub_path], check=True)
            size_kb = os.path.getsize(pub_path) / 1024.0
            print(f"  -> Encoded WebP {pub_path} ({size_kb:.1f} KB)")

if __name__ == '__main__':
    main()
