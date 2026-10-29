# Cukup Jumlah: Puppet Avatar Art Bible and Production Brief

**For:** Google Antigravity (or any AI art/code tool) working in the `genethong/Cukup-Jumlah` repo.
**Goal:** make new puppet parts that are indistinguishable from the existing set. The owner loves the current look. **Matching the existing look is the job. Do not reinterpret it.**

---

## ⚠️ READ FIRST: setup and two mandatory first tasks

**Setup**
- The repo is `genethong/Cukup-Jumlah`. The current puppet lab (the component, rig loader and `/dev?lab=puppet` page) lives on branch `cursor/puppet-avatar-lab-f32b` (PR #3). It is **not merged to main yet**. Start your work from that branch: `git fetch && git checkout cursor/puppet-avatar-lab-f32b && git pull`, then create your own new branch from it. Never push to `main`; open a PR with screenshots.
- Unpack the bundle (`art-bible-refs/`) next to this file. Every image and script this doc cites is in that folder.
- The build script uses folder paths from the machine it was written on. Change them to your local paths first (see the Workflow section).

**First task 1: calibrate the prompts before making anything new.**
The exact image-generation prompts that created the current parts were **not saved**. The prompt templates in this doc are rebuilt to reproduce the look. So before you generate any new part, regenerate ONE existing part, the **songkok**, using the master style block and the headwear template, with the style reference images attached. Put it side by side with `art-bible-refs` and the existing songkok part. Compare the material (cardstock/felt grain), brass pins, filigree, palette, lighting and scale. Adjust the prompt until it is indistinguishable, then **write the final working prompt back into this doc** (Prompt templates section) and use it for everything else. If you can't get a close match, stop and report rather than shipping off-style parts.

**First task 2: remove all race/ethnicity labels (neutrality cleanup).**
The current test page still uses race labels, which is against the golden rules. Before adding new parts, rename and clean up everything listed in the neutrality section of this doc. That includes:
- head files such as `malay_man`, `chinese_man`, `indian_woman`, `malay_woman`, `kadazan_man`
- tone names, and the head→tone links in `rig.json`
- lab UI labels such as "Lelaki Melayu", "Wanita India" and "Lelaki Cina"
- any captions like "kulit sederhana"

Replace them with neutral IDs: `tone_1`…`tone_8` for skin, and separate controls for gender (Lelaki/Perempuan), face shape, eyes, brows, nose, expression and hair. Skin tone must be its own picker, not tied to a face. Ship that cleanup as its own PR, with before and after screenshots of `/dev?lab=puppet`.

---


All reference images are in `art-bible-refs/` beside this file. Every number below was measured from the real files (`puppet-kit/v2/rig.json`, `build_v2.py`, `preview_v2.py`, the part PNGs, and PR #3 source on branch `cursor/puppet-avatar-lab-f32b`). Anything marked **(ESTIMATED)** or **(PROPOSED)** is not measured. Measure it on the first real asset, then write the measured value back into this file.

| Ref | What it shows |
|---|---|
| `01_style_ref_scene.jpg` | The original mood/scene reference (warm paper stage) |
| `02_kit_sheet.jpg` | The original kit sheet: blank head, jointed body, faces, hats, outfits, sarongs. **Attach to every prompt.** |
| `03_ingame_after_fixes.png` | The in-game Puppet Lab after all PR #3 fixes. **This is the target.** |
| `04_v2_preview_GOOD.png` | v2 assembled preview: sleeves, kain, hats correct |
| `05_pr3_combos_rest_and_sway.png` | PR #3 QA sheet: every combination, at rest and mid-sway |
| `06_parts_with_pins_on_green.png` | Real parts on #00FF00 with every pin drawn (magenta) and sizes labelled |
| `dont/v1_preview_sleeveless_no_trousers.png` | **DON'T:** v1 had bare skin arms (it looked sleeveless), bare legs under shirts, and a samping/kain that was too short |
| `parts/` | Real single parts (PNG = build output, WebP = game asset), incl. `trousers_*.webp` leg overlays |
| `scripts/` | `build_v2.py`, `preview_v2.py`, `rig.json` (v2), and the v1 scripts for history |

---

## 1. Purpose and golden rules

1. **Look:** a *wayang kulit*-inspired, layered paper/felt cut-out puppet. Each body part is a flat cardstock piece joined with brass split pins, with a wooden rod below. Characters are cute and chibi, and the satire comes from **situations and props** (a mic, a campaign tee, a fictional flag), never from mocking a body or a group.
2. **Fictional people only.** No real politicians and no likenesses. No real party logos, flags, colours-as-identity, or slogans. Any party flag or campaign tee uses an invented symbol (for example a star-in-a-circle, a durian, or a teh-tarik cup).
3. **Strict neutrality. NO race or ethnicity labels or presets anywhere:** not in UI text, file names, rig keys, prompts or commit messages. A character is built from **neutral, independent controls**: gender (Lelaki/Perempuan), skin swatch, face shape, eyes, brows, nose, expression, hair, facial hair, extras, headwear, top, bottom, footwear and prop. Any combination is allowed.
   - ⚠️ **Legacy debt to remove:** the current repo still has ethnic names. Head files are `malay_man`, `malay_woman`, `chinese_man`, `indian_woman` and `kadazan_man`. Tones are named (`light`, `tan`, `golden`, `medium_brown`, `dark`). `rig.skin.head_tone` binds a head to a tone. The Lab UI shows labels such as "Lelaki Melayu" (see `03_ingame_after_fixes.png`). The new set **replaces** all of these with neutral IDs (section 6). Keep the old files only until the new heads ship, then delete them in the same PR that switches the UI.
4. **Never lose the look.** When in doubt, put the new part next to `03_ingame_after_fixes.png` and the real parts in `art-bible-refs/parts/`. If a part looks different, regenerate it.

---

## 2. Visual style spec

### Materials
- **Cardstock/felt body:** matte paper with a fine felt/fibre grain visible at full size, and slightly rounded die-cut edges. Each piece reads as a flat layer with a thin (about 2–4 px at output size) **darker cut edge/bevel**, as if the card has thickness. It is not an ink outline.
- **Cloth pieces** (baju, sarong, samping, tudung) are also paper/felt layers, decorated with **cut-out filigree**: batik florals, songket diamond lattices and gold thread borders, rendered as layered paper lace and metallic foil, not as printed photo texture. Good examples are the kurung's gold lace panel, the baju Melayu's gold buttons and embroidery, and the songket samping's diamond grid.
- **Joints:** round **brass split-pin heads** at every pivot (neck, shoulder, elbow, wrist, hip, knee, ankle). Measured on `base/torso`: mean brass is about `#9D7A2F` (157,122,47), with highlights up to `#FEF8CB`. Each pin has a small specular dot and a soft shadow.
- **Rod:** thin wooden rod with a brass ferrule under the figure. The game draws it in code (CSS gradient `#4a301c → #a56b3c → #e6c79a → #8a5a32 → #3d2618`). **Do not paint rods into parts.**

### Palette (sampled from the real v2 parts, median-cut, most common first)
| Element | Hex |
|---|---|
| Base skin (untinted master, torso/limbs) | `#E0AA64` `#D8A35C` `#E4AE68` · shade `#C18E4B` · edge `#AA7D3A` |
| Hair (black-brown felt) | `#201A12` `#342D26` · highlight `#4F3A1F` |
| Baju Melayu red | `#8A1C19` `#992420` · shadow `#62150F` · gold `#C18D48` |
| Kurung teal | `#0E897F` `#118D82` · shadow `#225C48` · gold lace `#CE9D4F` |
| Suit warm grey | `#6B6965` `#777169` · shadow `#544B3C` · trousers about (111,107,103) |
| Batik shirt | `#312B18` `#6B3610` `#CA9042` `#A96926` |
| Songkok black velvet | `#0A0805` `#2A241C` · gold band `#98733B` |
| Ketayap cream | `#F3EBDF` `#DBCCB1` · shadow `#9B896A` |
| Tudung dusty rose | `#C56E61` `#B46254` · shadow `#783C2D` |
| Turban saffron | `#F88510` `#CE5703` · shadow `#832902` |
| Cap navy | `#1D283C` `#2A334A` · gold filigree `#AC936E` |
| Sarong/kain | `#C2853E` `#692A1A` `#612015` `#322322` |
| Songket samping | `#4C1809` `#B47B2C` `#6F2214` `#CC9643` |
| Shoe leather | `#664427` `#50341C` |
| Brass pins | `#9D7A2F` mid, `#FEF8CB` highlight |
| Stage/preview background | `#ECDCBE` (236,220,190) |

The palette is warm and earthy: deep reds, teal, saffron, songket gold and warm greys. New garments should pick from these families. There are no neons and no pure white. The nearest to white is ketayap cream `#F3EBDF`.

### Lighting and shadow
- Soft, warm, top-left studio light with gentle shading inside each paper layer. Each layer casts a **small soft drop shadow** onto the layer below it, which gives the paper-stack depth.
- **Do not bake a ground shadow into the parts.** The game adds it: `drop-shadow(0 18px 12px rgba(62,34,14,0.32))` and a radial floor ellipse `rgba(72,40,16,0.38)`. The preview script uses alpha×0.35 with GaussianBlur(12), offset (14,18).

### Outline
No black cartoon line. Edges come from the darker cut-card bevel and the layer shadow. Faces have painted features (brows, eyes and moustache are themselves felt cut-outs).

### Proportions (chibi, front view, measured)
- At assembly, the head (512 px) sits on the torso (560 px), with legs of 360 px and feet at 75%. Computed from the pins: head top (torso neck 34 − head neck 468 ≈ −434) to the sole (hip 512 + leg 272 + foot 92×0.75 ≈ 853) is about **1,290 px**, so the head is **about 40% of the height** (the brief says about 1/3; the existing art is slightly chunkier, so keep matching the existing art).
- Heads are 512 px tall and about 367–404 px wide. The neck pin is about 426–474 px down.
- The figure is a strictly **front view**. It stands upright and is symmetric except for the expression and props.

### Avoid
| DON'T | Why |
|---|---|
| Photoreal skin, pores, fabric photo texture | Breaks the paper look. Regenerate. |
| 3D "tube" limbs, plastic or vinyl sheen, clay | It happened during generation. Regenerate. |
| Perspective, 3/4 view, foreshortening | Parts must pin flat |
| Inconsistent scale (a giant hat, a tiny head) | Normalise as in section 3 |
| Baked background, ground shadow, rod, text, watermark | It pollutes the chroma key |
| Bare arms on sleeved garments, bare shins under trousers | See `dont/v1_preview_sleeveless_no_trousers.png` |

**DO:** match `03_ingame_after_fixes.png` and `04_v2_preview_GOOD.png`: sleeves on the arms, trousers on the legs, the kain hem on the shoe, the samping at the knee, toes pointing outward.

---

## 3. Canvas and format specs

1. **Generate** one part per image, front view, centred, on a flat **#00FF00** background with no shadow on the background and nothing else in frame. The originals were 1024×1024 JPGs. The sarong and the kurung/batik sleeves were generated on white (`mode 'w'`, flood-filled from the border), but **use green for everything new**.
2. **Chroma key** (exact `build_v2.py` logic):
   - bg = median of three 20×20 corners; d = |pixel − bg|
   - alpha = clip((d − 35)/40, 0, 1)
   - greenness g = G − max(R,B); where g > 40, alpha = min(alpha, clip((90 − g)/50, 0, 1))
   - **despill:** G = min(G, max(R,B) + 10)
   - drop specks: keep connected components > 2,000 px, then dilate the mask 3 iterations
   - Measured residue: semi-transparent edge pixels still average (114,124,71), which is slightly green. Check the edges against the beige stage, and if a fringe shows, tighten despill to `+0` for that part.
   - **Never use green in a part's design** (no green garments, no green leaves). Teal `#0E897F` survives the key, but check it.
3. **Trim:** bbox of alpha > 20, plus **6 px padding** on every side.
4. **Normalise** (output px; measured values from rig.json):

| Category | Rule | Measured sizes |
|---|---|---|
| heads | height = **512** | 367–404 × 512 |
| base/torso + all tops | height = **560**, sharing the torso's scale factor so pins line up | torso 440×560; outfits 440–441 × 561–588 (kurung is 588 because its hem drops lower) |
| base/upper_arm | height 230 | 98×230 |
| base/forearm_hand | height 300 | 92×300 |
| base/leg | height 360 | 107×360 |
| base/foot | width 200 | 200×148 |
| trousers (leg overlay) | **exactly the leg canvas** | 107×360 |
| sleeves upper | height 205 (short sleeve: 135) | 82–88 × 205 |
| sleeves forearm | width = forearm width × 1.2 (about 110) | 110 × 292–361 |
| headwear | width = head width × factor: songkok 0.72, ketayap 0.70, turban 0.86, cap 0.95, tudung 1.16 (head width ref = 404) | 283–469 wide |
| lower: samping | width = hip span (306 px) × 1.25 | 382×427 |
| lower: sarong/kain | height 430, row-tapered 1.0→0.68, then width = hip span × 1.5 | 458×697 |
| props | **(PROPOSED)** height 300 for hand-held props (about forearm length); flag 600 including pole | — |

   ⚠️ Mismatch found: `v2/parts/sleeves/batik_shirt_upper.png` on disk is 122×150, but `rig.json` says 59×135. Re-measure it whenever you rebuild.
5. **Export:** the build writes PNG (RGBA). The game uses **WebP** RGBA in `public/puppet/<category>/<id>.webp` (for example `cwebp -q 90 -alpha_q 100`, **(PROPOSED)** settings). Measured game sizes: a head WebP is about 22 KB and a trouser WebP is about 7–12 KB. **Budget: ≤ 60 KB per WebP (PROPOSED)**, and investigate anything larger.
6. **Naming:** `snake_case`, neutral, English or Malay garment words only, with no people, ethnicity, party or real-name words.
   - `heads/` is replaced by `face/` layers (section 6). Gendered sets use the prefix `m_` / `f_`: `face/f_shape_oval.webp`, `eyes/m_sleepy.webp`.
   - Sleeves: `sleeves/<top>_upper`, `sleeves/<top>_forearm`. Trousers: `trousers/<bottom>`.
7. **Folders**
```
puppet-kit/                         (art workspace, local)
  raw/<category>/<id>.png           green-screen originals, never edited
  v3/parts/<category>/<id>.png      keyed, trimmed, normalised
  v3/rig.json
repo:
  public/puppet/<category>/<id>.webp
  public/puppet/base_tones/<tone_N>/<part>.webp
  src/game/cukup-jumlah/puppet/rig.json   (copy of v3/rig.json, file paths -> .webp)
  docs/art/puppet/*.png             QA screenshots
```

---

## 4. The rig

### Where it lives in the repo (PR #3)
- `src/game/cukup-jumlah/puppet/rig.json` is the data.
- `loadRig.ts` holds the TS types (`RigPart {file,size,pins}`, `PuppetRig`, union types `HeadId`, `HeadwearId`, `OutfitId`, `LowerId`, `ToneId`). **New IDs must be added to these unions.**
- `layout.ts` does all of the maths: `headOrigin`, `headwearOrigin`, `lowerOrigin`, `lowerDraw`, `lowerHemY`, `sarongScaleX`, `footPointWorld`, `measureFrame`, and the constants `REST_ARM_OUT_DEG = 10`, `NET_HIP_OUT_DEG = 1`, `FOOT_SCALE = 0.75`.
- `PuppetAvatar.tsx` renders the parts with CSS transforms. Trousers come from `/puppet/trousers/${outfit}.webp` and are drawn at the leg's hip pin, at leg size.
- `motion.ts` drives the springs, 125 BPM sway, bob and hop. Also `PuppetLab.tsx`, `PuppetSheet.tsx` (the QA sheet), `puppet.test.tsx`, and the route `src/routes/dev.tsx`.

### Schema (real excerpt, v2)
```json
{
 "parts": {
  "base/torso": {"file":"parts/base/torso.png","size":[440,560],
     "pins":{"neck":[220,34],"shoulder_L":[62,135],"shoulder_R":[377,135],"hip_L":[65,512],"hip_R":[371,512]}},
  "base/upper_arm": {"size":[98,230],"pins":{"shoulder":[49,41],"elbow":[49,196]}},
  "base/forearm_hand": {"size":[92,300],"pins":{"elbow":[51,32],"wrist":[52,210]}},
  "base/leg": {"size":[107,360],"pins":{"hip":[55,43],"knee":[46,185],"ankle":[42,315]}},
  "base/foot": {"size":[200,148],"pins":{"ankle":[44,56]}},
  "heads/malay_man": {"size":[404,512],"pins":{"neck":[203,468],"crown":[202,4],"hat_brim":[202,143],"face_center":[202,259]}},
  "headwear/songkok": {"size":[291,216],"pins":{"brim":[145,208]}},
  "headwear/tudung": {"size":[469,650],"pins":{"face_hole_center":[235,277]}},
  "outfits/baju_melayu": {"size":[441,561],"pins":{"neck":[221,35],"shoulder_L":[62,136],"shoulder_R":[377,136],"hip_L":[66,512],"hip_R":[372,512]}},
  "lower/sarong": {"size":[458,697],"pins":{"waist":[229,8]}},
  "sleeves/baju_melayu_upper": {"size":[88,205],"pins":{"shoulder":[44,29]}},
  "sleeves/baju_melayu_forearm": {"size":[110,292],"pins":{"elbow":[55,17]}}
 },
 "draw_order": ["leg x2","foot x2","lower:sarong","torso","outfit","lower:songket_samping","head","headwear","upper_arm x2","sleeve_upper x2","forearm_hand x2","sleeve_forearm x2"],
 "joints": {"torso.neck":"head.neck","torso.shoulder_L/R":"upper_arm.shoulder","upper_arm.elbow":"forearm_hand.elbow","torso.hip_L/R":"leg.hip","leg.ankle":"foot.ankle","head.hat_brim":"headwear.brim","head.face_center":"tudung.face_hole_center"},
 "sleeves": {"baju_melayu":["upper","forearm"],"business_suit":["upper","forearm"],"baju_kurung":["upper","forearm"],"batik_shirt":["upper"]},
 "placement": {
  "headwear_brim_dy": {"songkok":15,"ketayap":15,"turban":55,"baseball_cap":70},
  "headwear_note": "place headwear.brim at head.hat_brim + (0, dy)",
  "tudung": "place tudung.face_hole_center at head.face_center",
  "lower_waist_dy_from_hips": {"songket_samping":-110,"sarong":-60},
  "lower_note": "waist pin x = torso centre, y = torso hip pin y + dy",
  "mirror": "right-side limbs, sleeves and the right foot are mirrored horizontally"
 },
 "skin": {"method":"…","tones":{…},"base_tones_dir":"parts/base_tones/<tone>/<part>.webp"}
}
```
Pins are `[x,y]` in the part's own output pixels, with the origin at the top-left.

### Parenting
torso → head (neck) → headwear (hat_brim + dy, or face_center for a tudung) · torso → upper_arm (shoulder_L/R) → forearm_hand (elbow) → prop (wrist) · torso → leg (hip_L/R) → foot (ankle) · torso → lower (waist) · upper_arm → sleeve_upper (same shoulder pivot) · forearm → sleeve_forearm (same elbow pivot) · leg → trousers (same hip pivot, same canvas).

### Draw order (back to front), extended for v3
legs (L behind R: zIndex 2/3) → trousers on each leg → feet → lower:kain/sarong/long skirt → torso → top → lower:samping/short skirt → **head base → face_shape → nose → eyes → brows → mouth/expression → facial hair → extras → hair_back… hair_front** → headwear (tudung over everything on the head) → upper arms → sleeve_upper → forearm_hand → **prop** → sleeve_forearm.
Note: the tudung is drawn over the head, and the code has no separate back drape.

### Mirroring
- Art is drawn for the **figure's right-hand side of the screen = `_L`** (unmirrored). The other side is `scaleX(-1)` about **its own pivot pin**: x′ = width − 1 − x.
- **Leg:** mirrored about its own **hip pin**.
- **Foot:** the bitmap's toes point to +x. Each foot is flipped about its **ankle pin** and then scaled 0.75. On the right leg the hip flip cancels the foot flip, so on **both sides the toes point outward**.
- Sleeves and trousers mirror with their parent limb.
- Props are **not** mirrored by default: only the hand holding them gets one. **(PROPOSED)** Prop on the screen-right hand, with a `mirror_ok` flag for props without text.

### Per-part offsets
- **Headwear drop:** the brim is placed at `head.hat_brim + (0, dy)`. Measured dy: songkok 15, ketayap 15, turban 55, baseball_cap 70. **Each new hat needs its own dy, found by eye in the preview** (the hat should cover the hairline and sit just above the brows).
- **Tudung:** `face_hole_center` (tudung 235,277) is placed on `head.face_center`.
- **Lower garments:**
  - Waist is at x = torso centre, y = hip_y + dy (samping −110, sarong −60). `layout.ts lowerDraw` then **stretches Y only** so the hem lands on `lowerHemY`.
  - **Samping and other knee-length garments:** the hem is on the leg **knee** pin.
  - **Kain, sarong and long skirts:** the hem is at the **top of the shoe leather**. The foot sprite is bare skin to y = 100 of 148, and the code computes `shoeTop = ankle + (100 − 56)·0.75`. The wide body of the kain (94% of its height before the tail) meets the leather, with +48 px overlap.
  - Sarong X scale = (outer edge of the L leg to the outer edge of the R leg, + 22 px each side) / opaque content width (sarong content x 54…404).
  - **(PROPOSED)** for new bottoms: shorts hem at the mid-thigh (hip + 0.45·(knee − hip)); jeans/slacks/track pants are trousers overlays with no lower part; the long skirt follows the kain rule.

### How to measure pins for a new part
1. Open the keyed and trimmed PNG at output size in any editor that shows pixel coordinates.
2. Click the **centre of the brass pin head** (or, for hats, the centre of the bottom edge of the band, as in `brim = [W/2, H−8]`. For lower garments the waist is `[W/2, 8]`).
3. For tops, **copy the torso pins exactly** (scale-shared). Do not re-measure the torso; draw the top over the torso silhouette.
4. For a sleeve: shoulder pin = the brass pin at the top. Forearm sleeve elbow = `[W/2, 0.06·H]`.
5. Write the pins into `rig.json` and run the preview (section 9). If a joint shows a gap, nudge 2–4 px and re-run. Record the final numbers.
6. Alternative: add the raw 1024-frame pin to the `P` dict in `build_v2.py`, and the script converts it: `pin_out = (raw − crop_origin) × scale`.

---

## 5. Skin tone system

**Method** (`build_v2.py`, `skin_mask` + `tint`):
- The mask is pixels with **hue 12°–45°, saturation 0.22–0.78, value > 0.30, alpha > 0.05**.
- Exclude a circle around **every pin** so the brass is not tinted: radius `28 × part_scale` for base parts, and `26 × 512/raw_head_h` around the head neck pin.
- Feather the mask: Gaussian σ = 1.0.
- `src` = the mean RGB of masked pixels. New RGB = old × (target / src), clipped, blended by the mask.
- Results are **pre-baked** to `base_tones/<tone>/{torso,upper_arm,forearm_hand,leg,foot}`, because a runtime tint would be too slow.
- **Never tint tops, sleeves, trousers, lower garments, headwear or props**, because songket gold and batik orange fall inside the same hue range. Garment skin tabs (neck) hide under the head.
- **Skin is a separate control from the face.** The v3 head base and the bare-skin areas of face layers (face shape, nose, ears) are tinted with the same swatch. Eyes, brows, hair and mouth interiors are dark or white enough to fall outside the mask, but **verify this on every new layer**, and lips may need to be excluded if they get tinted.

**8 swatches, unnamed.** IDs `tone_1 … tone_8`. The UI shows only a colour circle.
| ID | RGB | Hex | Source |
|---|---|---|---|
| tone_1 | 246,218,186 | `#F6DABA` | **PROPOSED** (new, lighter) |
| tone_2 | 236,196,154 | `#ECC49A` | existing (was "light") |
| tone_3 | 214,164,114 | `#D6A472` | existing (was "tan") |
| tone_4 | 196,136,84 | `#C48854` | existing (was "golden") |
| tone_5 | 178,118,71 | `#B27647` | **PROPOSED** (midpoint of 4 and 6) |
| tone_6 | 160,100,58 | `#A0643A` | existing (was "medium_brown") |
| tone_7 | 118,70,40 | `#764628` | existing (was "dark") |
| tone_8 | 86,52,32 | `#563420` | **PROPOSED** (new, deepest) |

Untinted master skin mean (measured on the heads): about (207–222, 150–166, 79–94). Delete `skin.head_tone`, so that no head implies a tone.

---

## 6. The new option list (production checklist)

`[v1]` = recommended first-ship subset (about 60%). Unmarked items come later. File paths are relative to `public/puppet/`, and all files are `.webp`.

### 6.0 Gender switch
`Lelaki` / `Perempuan` switches the **head base, face-shape, eyes and hair sets** (`m_`/`f_`) and the **body set** (the PROPOSED `base/f_torso` with a slightly narrower shoulder and the same pin layout; until that exists, both use `base/torso`). **Tops, bottoms, footwear, headwear and props are shared**, except items that are gender-typical by design. All items stay selectable by either gender; the UI only changes the default ordering.

### 6.1 Modular head: structure and face-layer pins
Replace the baked `heads/*` with a **blank head base** plus layers. Every face layer is drawn **on a full 512-tall transparent canvas that is the same size as its head base**, already positioned. **No per-layer offsets are needed: every layer of one gender shares the same canvas and the same pins.** This is the most robust way to make layers combine freely.

- `head/m_base.webp`, `head/f_base.webp`: a bald, featureless felt head with ears and neck tab, like the blank head top-left in `02_kit_sheet.jpg`. 512 px tall. Width **(ESTIMATED)** about 400.
- Head pins (keep the existing names so `layout.ts` still works). Fractions are measured from the build rule, where hh = neck_y − crown_y:
  - `crown` [W/2, top]
  - `hat_brim` [W/2, top + 0.30·hh]
  - `face_center` [W/2, top + 0.55·hh]
  - `neck` (measured 426–474 on the old heads; pick one value for each base and use it everywhere)
- New face-layer guide pins. These fractions are **(ESTIMATED)** from the old heads; measure them on the base and freeze them in rig.json:
  - `brow_line` y = top + 0.42·hh
  - `eye_line` y = top + 0.50·hh, and eye_L/eye_R x = W/2 ∓ 0.17·W
  - `nose_tip` y = top + 0.62·hh
  - `mouth_center` y = top + 0.72·hh
  - `chin` y = top + 0.84·hh
  - `ear_L`/`ear_R` (for earrings) at the earlobes
  - `face_hole` = the existing `face_center`, used by the tudung
- **Face shape** layers replace the base's face silhouette (skin, tinted). Width differences stay inside the base's ear-to-ear box, so hats still fit.
- **Generation trick:** generate each feature **on top of the actual blank base** (attach the base image) in green-screen, then subtract: key out the green, and then remove the pixels that match the base (|Δ| < 12), so only the feature remains. Re-align by template-matching to the base if the model shifted it.

Layer stack (back to front): `hair_back` → base → face_shape → nose → eyes → brows → mouth (expression) → facial_hair → extras → `hair_front` → headwear.

### 6.2 Checklist
**Skin:** `base_tones/tone_1…tone_8/{torso,upper_arm,forearm_hand,leg,foot}` · face base/shape tinted at runtime-prebake `[v1: all 8]`

**Face shape** (×2 genders): `face/{m,f}_shape_round` [v1], `_oval` [v1], `_square` [v1], `_long`

**Eyes** (×2): `eyes/{m,f}_normal` [v1], `_narrow` [v1], `_biground` [v1], `_sleepy`

**Eyebrows** (shared): `brows/thin` [v1], `brows/thick` [v1], `brows/bushy`, `brows/arched` [v1]

**Nose** (shared): `nose/small` [v1], `nose/round` [v1], `nose/wide` [v1], `nose/pointy`

**Expressions = mouth (+ optional overlay), swappable at runtime:** `mouth/smile` (neutral smile) [v1], `mouth/smug` [v1], `mouth/laugh` [v1], `mouth/nervous` + `fx/sweat_drop` [v1], `mouth/angry` + `fx/angry_brow_tilt` [v1], `mouth/shocked`, `mouth/cry` + `fx/tears`, `mouth/sleepy` + `fx/zzz`. Expressions **may** also override the brows (angry, shocked). Store this as `expressions.<id>.brows_override` in rig.json.

**Hair (men):** `hair/m_sidepart` [v1], `m_crewcut` [v1], `m_slickback` [v1], `m_curly`, `m_manbun`, `m_balding` [v1], `m_bald` (an empty layer, no file) [v1]. Each is split into `_front` (+ optional `_back`).

**Hair (women):** `hair/f_longstraight` [v1], `f_bob` [v1], `f_ponytail` [v1], `f_bun` [v1], `f_curly`, `f_pixie`. Long hair needs a `_back` layer behind the torso.

**Facial hair (optional):** `facial_hair/moustache` [v1], `moustache_thick` [v1], `goatee`, `beard_full` [v1], `stubble`

**Extras:** `extras/spectacles` [v1], `sunglasses` [v1], `mole`, `freckles`, `earrings` (pinned to ear_L/R)

**Headwear** (each needs a pin and a `headwear_brim_dy`): none [v1], `songkok` [v1, re-use], `kopiah` (= ketayap, re-use) [v1], `tudung_bawal` [v1] (face_hole_center), `tudung_sarung` (face_hole_center), `turban` [v1, re-use], `cap` [v1, re-use the baseball_cap], `bucket_hat`, `beanie`, `helmet_moto` [v1], `hard_hat`

**Tops, modern** (each = `tops/<id>` + `sleeves/<id>_upper` + `sleeves/<id>_forearm` where long-sleeved):
`tshirt` (upper only) [v1], `polo` (upper only) [v1], `hoodie` (upper+forearm), `office_shirt` (upper+forearm) [v1], `shirt_rolled` (upper + short forearm cuff), `blazer` (= business_suit, re-use) [v1], `jersey_football` (upper only, fictional club crest) [v1], `singlet` (no sleeves: this is the only top that legitimately shows bare arms), `campaign_tee` (upper only; fictional symbol and slogan only) [v1]

**Tops, traditional:** `baju_melayu` [v1, re-use], `baju_kurung` [v1, re-use], `batik_shirt` [v1, re-use; add the missing forearm only if long-sleeved], `kebaya` (upper+forearm), `cheongsam_top` (upper short sleeve), `kurta` (upper+forearm) [v1], `sari_drape` (upper + a drape overlay over the left shoulder; the drape is drawn into the top)

**Bottoms** (`trousers/<id>` = leg overlay 107×360 on the leg pins; `lower/<id>` = cloth over both legs):
`jeans` (trousers) [v1], `slacks` (trousers; the suit grey is about 111,107,103) [v1], `cargo` (trousers), `shorts` (trousers, ending mid-thigh, with the skin leg showing below) [v1], `trackpants` (trousers), `skirt` (lower, knee rule + leg overlay none), `samping` (lower, knee rule, worn **over** trousers) [v1, re-use], `kain` (lower, shoe-top rule) [v1, re-use the sarong], `long_skirt` (lower, shoe-top rule + **trousers overlay in the same colour** so no skin shows at the edges) [v1]

**Footwear** (replaces the skin-and-shoe `base/foot`; draw a **skin-less** shoe at 200×148 with ankle [44,56], toes to +x. Bare-foot styles keep the tinted skin foot underneath): `selipar` (over the skin foot) [v1], `sneakers` [v1], `leather_shoes` (= the current foot leather) [v1], `sandals` (over the skin foot), `gumboots` (taller; also needs a `trousers`-style shin overlay), `heels`

**Props** (`props/<id>`, a `grip` pin aligned to the forearm `wrist` pin [52,210]; **PROPOSED** height 300): `mic` [v1], `umbrella`, `flag_fictional` (invented symbol only) [v1], `spatula`, `phone_selfie` [v1], `handbag`, `briefcase` [v1], `teh_tarik` [v1]

Rig changes: replace `sleeves{}` with `tops{<id>:{sleeves:[...], trousers_default?:...}}`, and add `footwear`, `props`, `face_layers` and `expressions` sections. Update `loadRig.ts` unions and `layout.ts` for the new keys.

---

## 7. Prompt templates

**Provenance:** the exact prompts used for the existing parts **could not be recovered**. They are not in `build_v2.py`, `preview_v2.py`, `build.py`, the logs on the box, or the repo; the scripts only list the source image hashes. The templates below are **canonical reconstructions** written to reproduce the look.

### Validated working prompt for Songkok (Task 1 Calibration)
- **Tool constraint:** The generation pipeline accepts at most 3 reference image paths (`ImagePaths`). When generating parts, attach the 3 most essential references (e.g. `parts/songkok.png`, `02_kit_sheet.jpg`, and `parts/torso.png` for pin references).
- **Final calibrated prompt (matches flat cardstock, brass rivets, cut-out filigree & drop shadow):**
```
STYLE: handcrafted layered paper-and-felt cut-out puppet piece, inspired by Malaysian wayang kulit craft, cute chibi proportions. Flat matte cardstock paper craft, strictly 2D flat silhouette, visible fine paper/felt fibre grain, slightly rounded die-cut edges with a thin darker cut edge bevel showing card thickness. Flat graphic paper cut-out layers with delicate soft drop shadows cast between stacked layers. Decorative details are layered paper filigree and metallic gold foil cut-outs: songket diamond openwork lattice, paper lace. Warm earthy palette (dark black-brown cardstock #0A0805 #201A12, songket gold #C18D48, brass #9D7A2F). Round brass split-pin rivets #9D7A2F with tiny specular highlights at joints and fasteners. Soft top-left studio lighting. Strictly FRONT VIEW, perfectly flat 2D, symmetric, centred, single isolated puppet piece.
BACKGROUND: perfectly flat pure chroma green #00FF00, no gradient, no floor, no cast shadow on background.
NOT photoreal, NOT 3D render, NOT plastic, NOT clay, NOT cloth, NOT velvet, no realistic fabric shading, no fabric wrinkles, no perspective, no embossing, no embroidery, no text, no watermark, no green colors on the piece itself.
Match the exact style, materials, and construction of the attached reference image parts/songkok.png.

SUBJECT: One flat songkok puppet hat piece. Made of two stacked cut-paper cardstock layers:
1. Base layer: A flat, solid matte dark black-brown cardstock shape (#0A0805 #201A12) with a clean die-cut edge bevel and completely flat matte shading (zero fabric texture, zero velvet sheen, zero 3D curves).
2. Filigree band layer: A separate horizontal cut-out paper filigree band of metallic gold songket diamond lace (#C18D48 #98733B) layered across the lower portion. This band is a delicate cut-paper filigree openwork lattice (cut-out paper holes showing the dark base beneath), NOT embossed, NOT embroidered. It casts a soft gentle drop shadow onto the dark base cardstock beneath it.
3. Fasteners: Exactly TWO round metallic brass split-pin rivets (#9D7A2F with a tiny specular dot highlight #FEF8CB), one pin at the far-left end of the gold band and one pin at the far-right end of the gold band, visibly securing the paper band to the cardstock cap.
```
- **Key prompt calibration takeaways for all subsequent parts:**
  1. Explicitly designate **layers** (e.g., base layer vs overlay filigree layer) and stipulate **soft drop shadows between stacked layers**.
  2. For decorative trims and bands, mandate **"cut-out paper filigree openwork lattice, NOT embossed, NOT embroidered"**.
  3. Specify **"round metallic brass split-pin rivets #9D7A2F with specular dot highlight #FEF8CB"** with explicit coordinate/anchor points (e.g., at both ends of a band or at limb joint pivots).
  4. Specify **"completely flat matte cardstock paper, die-cut bevel edge, zero fabric texture, zero velvet sheen, zero 3D curvature"** to prevent realistic textile rendering.
- **Calibration artifacts:**
  - `docs/art/puppet/00_calibration_songkok_comparison_v2.png`: Side-by-side comparison between original and calibrated test 2.
  - `docs/art/puppet/00_calibration_songkok_triptych.png`: 3-way progression showing original reference vs test 1 (flawed) vs test 2 (matched).

### Master style block (paste into every prompt, unchanged)
```
STYLE: handcrafted layered paper-and-felt cut-out puppet piece, inspired by Malaysian wayang kulit
and Malay craft, cute chibi proportions. Matte cardstock with visible fine felt fibre grain, slightly
rounded die-cut edges with a thin darker bevel showing card thickness, gentle soft shadow between
stacked paper layers. Decorative details are cut-paper filigree and gold foil: batik florals, songket
diamond lattice, gold thread borders. Warm earthy palette (deep red #8A1C19, teal #0E897F, songket gold
#C18D48, warm grey #6B6965, felt skin #E0AA64, hair #201A12). Brass split-pin rivets #9D7A2F at joints.
Soft warm top-left studio light. Strictly FRONT VIEW, flat, symmetric, centred, single isolated piece.
BACKGROUND: perfectly flat pure chroma green #00FF00, no gradient, no floor, no cast shadow on background.
NOT photoreal, NOT 3D render, NOT plastic, NOT clay, NOT tube-shaped limbs, no perspective, no text,
no watermark, no logos, no real people, no green colours on the piece itself.
Match the exact style of the attached reference images.
```

**Attach to every prompt:** `02_kit_sheet.jpg`, `03_ingame_after_fixes.png`, and the closest real part from `art-bible-refs/parts/`. Add the category-specific attachments listed below.

### Per-category templates
**Head base**
`[MASTER] One bald blank puppet head, {male|female} chibi proportions, featureless smooth felt face (no eyes, brows, nose, mouth, hair), small round ears, short neck tab at the bottom with one brass split pin. Same head size and shape as the blank head top-left in the kit sheet.` Attach `parts/example_head.webp`.

**Face layer** (face shape, eyes, brows, nose, mouth, facial hair, extras)
`[MASTER] The attached blank puppet head, unchanged, with ONLY this added: {e.g. "sleepy half-closed eyes, felt cut-out, dark brown #201A12 with tiny white highlight"}. Keep the head position, size and outline pixel-identical to the attachment.` Attach `head/{m,f}_base`. Then subtract the base (section 6.1).

**Expression**
`[MASTER] … with ONLY a {laughing open mouth | smug one-sided grin | angry gritted teeth | shocked O mouth | crying wobbly mouth} cut-out felt mouth{, plus a blue paper sweat drop on the temple | plus paper tear drops}.` Reference: the six faces in `02_kit_sheet.jpg`.

**Hair**
`[MASTER] The attached blank puppet head wearing {hairstyle} made of layered black-brown felt (#201A12, highlight #4F3A1F) with cut-paper strand grooves. Head unchanged.` Generate twice: front layer (hair in front of the head), and for long styles the back layer alone.

**Headwear**
`[MASTER] One {songkok-style hat | bucket hat | motorbike helmet with visor | …}, strictly front view, flat 2D die-cut cardstock layers, sized to fit the attached puppet head, {color} matte cardstock base with visible die-cut edge bevel, layered cut-paper filigree band (#C18D48) with openwork lattice casting soft drop shadow on the base layer, and round metallic brass split-pin rivets (#9D7A2F with specular dot #FEF8CB) at both ends of the band securing it, no head inside it, zero fabric/cloth texture, zero 3D curvature.` Attach the head base and the closest headwear part reference. For a tudung: `…a tudung {bawal|sarung} with a clear oval opening for the face, draping over the shoulders, dusty rose #C56E61 felt with a cut-lace edge`. Attach `parts/tudung.png`.

**Top + matching sleeves (always three images, same session/seed)**
1. `[MASTER] One {top} garment piece shaped exactly to the attached puppet torso silhouette, same neckline width, shoulders and hem, with brass split pins at the shoulder points, no arms, no sleeves beyond the shoulder cap.` Attach `parts/torso.png` and `parts/baju_melayu.png`.
2. `[MASTER] The upper-arm sleeve for that same {top}, a vertical piece sized to the attached upper arm (98×230), brass pin at the top.` Attach `parts/upper_arm.png` and `parts/baju_melayu_upper.png`.
3. `[MASTER] The forearm sleeve for that same {top}, vertical tube-free flat piece covering the attached forearm, cuff at the bottom, the hand NOT included.` Attach `parts/forearm_hand.png` and `parts/baju_melayu_forearm.png`.

**Bottom + leg overlay**
- Trousers: `[MASTER] One trouser leg for {jeans|slacks|…}, a flat vertical piece shaped exactly to the attached puppet leg silhouette (hip to ankle), {colour}, with a seam and cut-paper detail, no foot.` Attach `parts/leg.png` and `parts/trousers_business_suit.webp`. **Fit it to the 107×360 leg canvas.**
- Cloth: `[MASTER] One {kain|long skirt|skirt|samping} cut-paper cloth panel, front view, waist band at top, {songket/batik} cut-out pattern, straight hem.` Attach `parts/sarong.png` or `parts/songket_samping.png`.

**Footwear**
`[MASTER] One {sneaker|selipar|gumboot|heel} seen from the front-side as in the attached puppet foot, toes pointing to the RIGHT, {for open footwear: drawn without the foot}, brass pin at the ankle.` Attach `parts/foot.png`.

**Prop**
`[MASTER] One {handheld microphone|folded umbrella|small flag with an invented star-in-circle symbol (no real party)|kitchen spatula|smartphone held for a selfie|handbag|briefcase|glass of teh tarik with foam}, flat cut-paper prop, vertical, sized for a chibi puppet hand, a clear grip area.` Attach `parts/forearm_hand.png`.

---

## 8. Lessons learned and pitfalls (all of these happened once)
1. **Outfits need sleeve pieces** (`_upper`, and `_forearm` if long-sleeved). Without them the arms show skin and the figure looks sleeveless (`dont/v1_preview…`).
2. **Trousers need leg overlays** (`trousers/<id>`, on the 107×360 leg canvas). Even with a kain, keep a same-colour overlay so no skin shows at the edge, as with the kurung's teal.
3. **Mirroring:** the mirrored leg flips about its **own hip pin**. The foot flips about its **ankle**. **Toes point outward** on both sides.
4. **Feet** go under the hips: `NET_HIP_OUT_DEG = 1`, with the leg art's own slant cancelled, and `FOOT_SCALE = 0.75`.
5. **Kain/sarong hem reaches the top of the shoe leather** (foot y = 100), with no skin gap. **Samping ends at the knee pin.**
6. **Arms rest about 10° outward** (`REST_ARM_OUT_DEG`), so sleeves do not cover the side seams.
7. **Generations sometimes come out photoreal or as 3D tubes.** Reject and regenerate them; do not try to fix them.
8. **Tudung needs a face-hole anchor** (`face_hole_center` → `head.face_center`).
9. **Each hat needs its own drop offset** (`headwear_brim_dy`).
10. **Keep the scale normalised** (section 3). One scale factor is shared by the torso and every top.
11. Suit trousers are **warm grey** (about 111,107,103), not blue-grey. Garment colours must match their top.
12. Don't tint garments: gold and orange fall in the skin hue mask.
13. The kurung hangs lower (588 tall), so tops may be taller than 560 as long as the **pins are identical** to the torso pins.
14. Green chroma leaves a faint fringe (measured edge mean is 114,124,71). Check the parts on a beige background.

---

## 9. QA checklist (before every PR)
- [ ] Run `preview` to render a **sheet of all combinations at rest AND mid-sway**. In the game, use `PuppetSheet.tsx` (the "Semua kombinasi" link in the Lab, route `/dev`), and match `05_pr3_combos_rest_and_sway.png`.
- [ ] Joints: no gaps or exposed edges at the neck, shoulders, elbows, hips, knees or ankles. The brass pins line up across sleeve and limb.
- [ ] Sleeves cover the arms on every sleeved top. Trousers cover the legs. No bare skin unless intended (singlet, shorts, selipar).
- [ ] Hems: kain/long skirt touch the shoe top, samping/skirt at the knee, shorts at mid-thigh.
- [ ] Hats sit on the hairline for **every** face shape and hair combination. The tudung face hole frames every face shape.
- [ ] Feet are under the hips, toes point outward, scale is 0.75.
- [ ] Style: put the part next to `03_ingame_after_fixes.png`. Is it paper/felt, front view, and in the same palette? Nothing photoreal, 3D, plastic or green-fringed.
- [ ] Neutrality: grep the diff for ethnicity words, real names or party names (`git diff | grep -iE "malay|melayu|chinese|cina|india|kadazan|iban|umno|pas|dap|pkr|bersatu"`). It must return nothing new.
- [ ] Sizes: each WebP is ≤ 60 KB (PROPOSED budget), and the dimensions match rig.json.
- [ ] `npm test` (the vitest `puppet.test.tsx`) and the typecheck both pass.
- [ ] Save screenshots to `docs/art/puppet/` (desktop Lab, mobile 390 px, combos sheet) and embed them in the PR.

---

## 10. Workflow for Antigravity (step by step)
**Never push to `main`. Never force-push. Every change goes through a PR that Axel approves.**
1. `git checkout main && git pull`
2. `git checkout -b art/puppet-v3-<short-topic>` (for example `art/puppet-v3-tops-modern`)
3. **Generate** the parts with the section 7 prompts and the attachments, one part per image on #00FF00. Save them to `puppet-kit/raw/<category>/<id>.png`. Reject photoreal or 3D results.
4. **Build:** copy `art-bible-refs/scripts/build_v2.py` to `puppet-kit/build_v3.py` and make these edits:
   - Set `A` to your raw folder.
   - The `path()` function globs `{A}/{hash}*.jpg`, so change it to `f"{A}/{cat}/{name}.png"`.
   - Add every new part to `R` (`name: (category, file, 'g')`).
   - Add its raw-frame pins to `P`.
   - Add its target size (section 3).
   - Change `TONES` to `tone_1…tone_8` and remove `HEAD_TONE`.

   Then run:
   ```
   pip install numpy pillow scipy
   cd puppet-kit && python3 build_v3.py      # writes v3/parts/** and v3/rig.json (script does os.chdir('v2') — change to 'v3')
   ```
5. **Update rig.json:** measure or adjust the pins (section 4), add `headwear_brim_dy`, `lower_waist_dy_from_hips`, the sleeve and trouser maps, and the new face-layer pins.
6. **Preview:** `cd puppet-kit/v3 && python3 ../preview_v3.py /tmp/sheet.png`. `preview_v2.py` reads `rig.json` from the current folder and writes `preview.png` and the argv path. Edit its `chars` list to cover the new options. It does not yet draw trousers, 10° arms or 75% feet (that logic is in `layout.ts`), so **the game's `/dev` Lab and PuppetSheet are the source of truth for the final QA.**
7. Convert to WebP: `for f in v3/parts/**/*.png; do cwebp -q 90 -alpha_q 100 "$f" -o "<repo>/public/puppet/…/$(basename "${f%.png}").webp"; done`. Copy `rig.json` to `src/game/cukup-jumlah/puppet/rig.json` with `.png` changed to `.webp`, and update the unions in `loadRig.ts`.
8. `npm run dev`, open `/dev`, go to the Wayang tab and run the QA checklist (section 9). Take the screenshots.
9. `git add -A && git commit -m "Puppet v3: <what>"` then `git push -u origin <branch>`, and open a PR to `main` with the screenshots and a list of the new IDs. **Do not merge it yourself.**
