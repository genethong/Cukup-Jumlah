# 🇲🇾 CUKUP JUMLAH! — Master Project Summary & Documentation

> **Document Type:** Comprehensive Development Summary (Storyboard, Architecture, Graphics & Game Design)  
> **Target Game:** *Cukup Jumlah!* (Malaysian Political Satire Rhythm-Arcade Microgame)  
> **Created Date:** October 2026  
> **Status:** Fully Functional Production Master Build  
> **Engine / Stack:** React 19, TypeScript, TanStack Start/Router, Tailwind CSS v4, Three.js (WebGL), Web Audio API

---

## 1. Executive Summary & Core Game Concept

### 1.1 The Elevator Pitch
**Cukup Jumlah!** is a high-energy, satirical Malaysian political arcade microgame inspired by the lightning-fast comedic micro-challenges of *WarioWare, Inc.*, the tight metronomic musical cadence of *Rhythm Heaven*, the quintessential editorial caricatures of Datuk Lat and *Majalah Gila-Gila*, and the charming 3D isometric voxel aesthetic of *Crossy Road*.

Players step into the polished formal shoes of an aspiring Malaysian Member of Parliament (**Yang Berhormat / YB**). Starting with **3 Bundles of RM10,000 Cash Deposit** (*Wang Deposit Pilihan Raya*), players must navigate a gauntlet of frantic election trials across three acts: from surviving the strict vetting of Nomination Day to enduring chaotic 14-day walkabout photo-ops, to defending ballot boxes on polling night and negotiating a coalition government to secure the coveted **112 majority seats** in the Dewan Rakyat!

### 1.2 Core Theme, Cultural Satire & Civic Lore
* **Satirical Commentary:** Celebrates and lovingly parodies Malaysian political culture—from awkward wet market photo-ops, 2 AM mamak stall negotiations over roti canai, and flying Char Kuey Teow, to crooked songkoks (*songkok senget*), megaphone sound clashes, flash road paving before VIP convoys, and 11:59 PM bamboo flag wars.
* **Authentic Civic Foundation:** Every single challenge is anchored in the official **Federal Constitution of Malaysia** (*Perlembagaan Persekutuan*) and the **Election Offences Act 1954**, delivering genuine civic education alongside slapstick humor.
* **Zero External Assets Guarantee:** The entire game runs without external CDNs, image hosts, or raster image downloads. All visuals are 100% procedurally generated via SVG, HTML5 Canvas, and Three.js procedural WebGL meshes, and all audio is synthesized in real time via the Web Audio API.

---

## 2. Storyboard & Narrative Progression

The game follows a narrative three-act structure that mirrors a real Malaysian General Election (*Pilihan Raya Umum / PRU*):

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                  CUKUP JUMLAH! STORYBOARD FLOW                                  │
└─────────────────────────────────────────────────────────────────────────────────────────────────┘
                                                │
                                    [ 0. YB CUSTOMIZER ]
                    Create Candidate • Select Faction • Pick Talents & Quirks
                                                │
                                                ▼
                         [ ACT 1: HARI PENAMAAN CALON (Nomination Day) ]
         5 Microgames: Nomination Sprint ➔ Vetting Dossiers ➔ RM10k Deposit ➔ Watikah Stamp ➔ TV Hog
                                                │
                                                ▼
                         [ ACT 2: TEMPOH BERKEMPEN (14-Day Campaign) ]
         8 Microgames: Char Kuey Teow ➔ Speaker Clash ➔ Road Paving ➔ Ribbon Snip ➔ Shirt Toss
                       ➔ VIP Umbrella ➔ Drain Scrub ➔ Midnight Bamboo Flags
                                                │
                                                ▼
                      [ ACT 3: HARI MENGUNDI & MALAM KIRAAN UNDI ]
         5 Microgames: Indelible Ink ➔ Spoiled Ballots ➔ Blackout Defense ➔ Form 14 Tally
                       ➔ 2 AM Mamak Statutory Declaration (SD) Exchange
                                                │
                       ┌────────────────────────┴────────────────────────┐
                       ▼                                                 ▼
             [ >= 112 SEATS WON ]                              [ < 112 SEATS WON ]
           👑 GRAND VICTORY SEQUENCE                         ⚖️ PARLIMEN TERGANTUNG
       • Mengadap Tuanku (Istana Negara)                     • Cross-Party Coalition Talks
       • Sworn in as YAB Perdana Menteri                     • Rundingan Kerajaan Perpaduan
       • Interactive "Tunduk Hormat" Bow                     • Win: Unity PM | Lose: Opposition
```

### 2.1 The 3 Narrative Acts

#### Act 1: Hari Penamaan Calon (Nomination Day)
* **Setting:** Pusat Penamaan Calon Dewan SPR (Chrono-locked at 9:00 AM – 10:00 AM).
* **The Stakes:** Missing the 10:00 AM deadline or failing nomination paper vetting means immediate disqualification before the campaign even begins!
* **Featured Challenges:**
  1. **Pecut Dewan SPR:** 3-lane obstacle dash through media scrums, grab iced teh-o-ais, and slide into the SPR registration hall at 9:59 AM.
  2. **Semak Borang:** Scrutinize incoming candidate dossiers per Federal Constitution Articles 47 & 48. Approve eligible candidates, reject undischarged bankrupts and minors.
  3. **Bayar Deposit:** Count out the exact mandatory cash deposit packets (RM10,000 candidate deposit + RM5,000 campaign material deposit) under the ticking clock.
  4. **Cop Watikah:** Align and slam the official party president authorization stamp (*Surat Watikah Pelantikan*) under Regulation 11(2)(c).
  5. **Rebut Kamera TV:** Shove political rivals aside and muscle into the center frame of the live television broadcast for maximum media mileage.

#### Act 2: Tempoh Berkempen (14-Day Campaign Trail)
* **Setting:** Pasar Malam, rural villages (*kampung*), roadworks, and community halls across the constituency.
* **The Stakes:** Winning the hearts and votes of the electorate while fulfilling ridiculous campaign photo-op tropes.
* **Featured Challenges:**
  1. **Goreng Kuey Teow:** Awkwardly grab a hawker spatula at a night market stall; stir through 3 cooking phases with explosive wok-hei while smiling for paparazzi flashbulbs.
  2. **Perang Speaker:** Megaphone shouting duel against the rival party's campaign tent across the street while preventing the portable generator from overheating.
  3. **Turap Jalan Kilat:** Pour hot asphalt tar and steamroll potholes on rural roads minutes before the VIP Minister's luxury convoy arrives.
  4. **Potong Reben:** Snip 3 giant gold ribbons at community hall launches with ceremonial oversized scissors right on beat.
  5. **Baling Baju Kempen:** Launch free party t-shirts to ecstatic villagers from the back of an open-bed campaign lorry while dodging stray kampung chickens.
  6. **Payung Bos:** Escort the VIP party boss along the red carpet in a blinding tropical monsoon storm, keeping their silk suit 100% dry.
  7. **Cuci Longkang:** Scrub roadside drain silt and strike an exaggerated double thumbs-up pose for press cameras.
  8. **Pacak Bendera:** 11:50 PM midnight scramble before the campaign blackout period. Balance a 10-meter swaying bamboo pole against the wind and tie party flags with red raffia string.

#### Act 3: Hari Mengundi, Malam Kiraan Undi & Rundingan SD
* **Setting:** Bilik Mengundi Sekolah Kebangsaan, Counting Halls, and 2 AM Mamak Stalls.
* **The Stakes:** Defending every single ballot, tallying parliamentary seats, and securing the 112-seat majority.
* **Featured Challenges:**
  1. **Celup Dakwat Kekal:** Guide trembling voter index fingers into the official SPR purple indelible ink bottle without messy spillage.
  2. **Tapis Undi Rosak:** PACA ballot sorting per Regulation 25: Accept valid votes with unambiguous intent, immediately reject cross-party scribbles and sambal-stained papers.
  3. **Blackout Peti Undi:** Mysterious electrical blackout at the counting center! Sweep a battery-powered flashlight across the acrylic ballot box to ward off ghostly tampering hands.
  4. **Borang 14:** Tally votes with Polling and Counting Agents (PACA) to hit exactly the 112-seat threshold and co-sign the official Form 14 tally sheet.
  5. **Runding Perpaduan (Tolak Beg SD):** Late-night Mamak coalition negotiations. Slide confidential Statutory Declaration (SD) briefcases across oily marble tables to allied party chiefs without knocking over cups of hot Teh Tarik.

### 2.2 Endgame Branching & Climaxes

| Endgame Scenario | Condition | Interactive Mechanics & Climax |
|---|---|---|
| 👑 **Cukup Jumlah! (Grand Victory)** | $\ge 112$ kerusi parlimen won | Summoned to Istana Negara to Mengadap Seri Paduka Baginda Tuanku; royal appointment as **YAB Perdana Menteri Malaysia**; interactive **Tunduk Hormat kepada Rakyat** bow button with crowd cheers. |
| ⚖️ **Parlimen Tergantung (Hung Parliament)** | $< 112$ kerusi parlimen won | Triggers the **Runding Perpaduan** emergency coalition negotiation stage. If successful, sworn in as **PM Kerajaan Perpaduan**; if rejected, relegated to Opposition. |
| 🎙️ **Ketua Pembangkang (Opposition)** | Coalition talks fail | Appointed **YB Ketua Pembangkang / Ahli Parlimen Pembangkang**; interactive **Jerit "Tarik Balik!"** parliamentary check-and-balance button. |
| 💸 **Deposit Lebur! (Game Over)** | 0 Cash Deposit Bundles remaining | Candidate loses all RM10,000 deposit bundles; disqualification certificate stamped in red ink with record scratch sound effect. |

---

## 3. The 4 Political Factions (Parties)

Players represent one of four satirical political parties, each with unique colorways, slogans, cultural tropes, and badge identities:

| Party | Full Name | Color & Palette | Slogan | Cultural Trope & Mascot |
|:---:|:---:|:---:|:---:|---|
| **PNL** | *Parti Nasi Lemak* | **Sambal Red** (`#DC2626`) + Daun Pisang Green | *"Sambal Pedas, Suara Tegas"* | Fiery grassroots reformists with loud megaphones, shouting *"Tarik Balik!"* at every press conference. Mascot: 🌶️ |
| **BD** | *Barisan Durian* | **Musang Gold** (`#EAB308`) + Vellfire Chrome | *"Raja Segala Parti, Berisi & Berduri"* | Elite veteran establishment politicians who travel exclusively by Vellfire convoys, wearing high songkoks and gold rings. Mascot: 👑 |
| **GTT** | *Gabungan Teh Tarik* | **Mamak Blue** (`#2563EB`) + Froth Amber | *"Buih Lebih, Janji Buih"* | Pragmatic 2 AM mamak negotiators who draft complex multi-party coalition agreements on paper napkins. Mascot: ☕ |
| **PBB** | *Parti Boba Bersatu* | **Pastel Slate** (`#F8FAFC`) + Taro Purple | *"Manis 100%, Ais 0%"* | Tech-savvy Gen-Z TikTok politicians who present national budget proposals via 15-second viral video dances. Mascot: 🧋 |

---

## 4. Visual & Graphical Direction

The visual style is defined by a hybrid design philosophy: **Retro Sunday Newsprint Comic Frame (2D)** combined with **Crisp Isometric Voxel Characters (3D)**.

```
┌────────────────────────────────────────────────────────────────────────┐
│                   VISUAL & GRAPHICAL DESIGN FORMULA                    │
├──────────────────┬─────────────────────────────────────────────────────┤
│ Outer Frame      │ Sekolah Kebangsaan (SK) Classroom Polling Station   │
│ Paper Playfield  │ Sunday Newspaper Comic Page (Halftone & Black Inks) │
│ Life Counter     │ 3x RM10,000 Cash Deposit Bundles (Wang Deposit SPR) │
│ Target Counter   │ Transparent Acrylic SPR Ballot Box (112 Target)     │
│ 3D Characters    │ Crossy Road Clean Voxel Style (Three.js WebGL)      │
│ Action FX        │ Retro Comic Starbursts & Stamped Ink Overlays       │
└──────────────────┴─────────────────────────────────────────────────────┘
```

### 4.1 The Classroom Frame & Sunday Newsprint HUD (`SekolahFrame.tsx`)
* **Chalkboard & Newsprint Hybrid:**
  * Top bar features clean newsprint card textures, halftone dot accents, and an active station marker (`PUSAT PENAMAAN CALON • DEWAN SPR` or `SALURAN 3`).
  * Live metronome dots (1, 2, 3, 4) pulse with gold glow and rhythmic audio feedback.
* **3x RM10,000 Deposit Bundle Counter (`💵 x3`):**
  * Represents candidate lives. Losing a challenge triggers a heavy rubber stamp slam: **`HILANG RM10,000 DEPOSIT! 💸`**.
  * When reduced to zero, the run terminates in forfeiture.
* **Peti Undi SPR Majority Progress Bar:**
  * Displays the target `112 KERUSI` with live seat counters (`+5 Kerusi` per win).
  * Styled with yellow security zip-tie textures and acrylic ballot-box highlights.
* **Comic Action Bursts (`ComicActionBurst.tsx`):**
  * Hand-inked vector starbursts with halftone dot patterns and 5px drop shadows.
  * Dynamically flashes **`PADU! ⭐`** on perfect beats and **`HILANG DEPOSIT 💸`** on misses.

### 4.2 The 3D Voxel Engine (`src/game/Cukup Jumlah!/voxel/`)
Characters are rendered using an isometric **Three.js** WebGL pipeline designed to emulate the clean, vibrant voxel aesthetic of *Crossy Road*:

1. **Clean Block Archetype (`voxelBuilder.ts`):**
   * Characters are assembled from **6 cleanly aligned core blocks**: Head, Torso, 2 Arms, and 2 Legs.
   * Proportions follow an intentional caricature ratio: oversized head with compact limbs to ensure expressive silhouettes on mobile viewports.
2. **Procedural UV Texture Canvas Engine (`voxelSkin.ts`):**
   * Instead of heavy 3D geometry for small details, all facial features, hair, eyes, ties, songket samping borders, batik patterns, and shoes are drawn onto an internal dynamic HTML5 canvas mapped seamlessly onto the Three.js box materials.
   * **Facial Features:** Wide-spaced square eyes, misaligned toothy grins, manicured moustaches, rosy cheeks, and sweat droplets.
   * **True 3D Accents:** Applied selectively for major silhouettes—tall Songkok boxes, angled Songkok Senget caps, baseball cap visors, and twin hair buns.
3. **Interactive Character Animation:**
   * Metronome-synchronized vertical bouncing (`hopTime` bounce curve).
   * Interactive "Tunduk Hormat" bowing animation for victory ceremonies.
4. **3D Stage Environments (`stageBuilder.ts`):**
   * **Option 1: Floating Malaysian Voxel Chunk:** Floating terrain slab featuring asphalt tarmac with white centerlines, yellow/black road curbs, concrete sidewalk, open monsoon drain (*longkang*), bamboo flag pole, and mamak stall striped canopy.
   * **Option 2: Voxel SK Classroom Workbench:** Isometric wooden classroom desk with carved pencils, SPR ballot paperwork, and desk joints.
   * **Option 3: Hybrid Stage:** 3D voxel character anchored inside a 2D newsprint comic frame.
5. **Head Grid Inspector (`HeadGridInspector.tsx`):**
   * Built-in developer diagnostic viewport allowing live pixel-grid inspection (5×5×5, 5×6×5, and 5×7×5 ratios) with adjustable eye spacing, skin tones, and facial hair variations.

---

## 5. Audio & Rhythm Architecture (`rhythm.ts`)

The game's feel is powered by an in-house **125 BPM Web Audio Synthesizer**:

```
Beat 1 (Call)      --> Beat 2 (Build)     --> Beat 3 (Cue)           --> Beat 4 (HIT WINDOW)
"CUKUP..."             "...KE..."             "...BELUM?!"              --> "JUMLAH! 💥"
"JAM 9:59..."          "...PINTU DEWAN..."    "...NAK TUTUP?!"          --> "PECUT MASUK! 🏃"
"KIRA..."              "...TEPAT..."          "...RM10,000?!"           --> "BAYAR! 💵"
"KACAU..."             "...KUALI..."          "...PANAS?!"              --> "KACAU LAJU! 🥢"
```

### 5.1 Rhythm Engine Specifications
* **Tempo:** Locked at **125 BPM** ($480\text{ ms}$ per beat).
* **Synthesized Audio Cues (Zero External MP3s/WAVs):**
  * **Beat 1 (The Downbeat):** Low-frequency Kompang kick drum oscillator ($110\text{ Hz} \to 45\text{ Hz}$ pitch drop).
  * **Beats 2 & 3 (The Build):** High-frequency resonant woodblock clicks ($880\text{ Hz}$).
  * **Beat 4 (The Hit Window):** Bright acoustic bell/chime cue ($1760\text{ Hz}$).
  * **Success Fanfare:** Rapid ascending C-Major arpeggio ($C_5 \to E_5 \to G_5 \to C_6$) with white-noise synthesized crowd cheering.
  * **Failure Penalty:** Low-pitch rubber stamp slam with immediate vinyl record scratch filter sweep.
* **Hit Tolerance Window:** $\pm 180\text{ ms}$ on standard difficulty; expanded to $\pm 260\text{ ms}$ when the *Mesra Rakyat* talent is active.

---

## 6. Candidate Creation & Gameplay Modifiers

Players construct their politician in the **YB Customizer** (`YbCustomizer.tsx`), configuring four distinct customization tabs:

```
┌────────────────────────────────────────────────────────────────────────┐
│                      YB CUSTOMIZER ARCHITECTURE                        │
├─────────────────┬──────────────────────────────────────────────────────┤
│ 1. Rupa (Face)  │ Skin tones (6 shades), Haircut, Hair color, Facial   │
│                 │ hair (Kumis/Beard), Eyes & Glasses, Speech Bubbles   │
├─────────────────┼──────────────────────────────────────────────────────┤
│ 2. Pakaian      │ Baju Melayu + Songket, Formal Corporate Suit, Batik, │
│    (Wardrobe)   │ Jaket Banjir, Songkok, Songkok Senget, Kopiah        │
├─────────────────┼──────────────────────────────────────────────────────┤
│ 3. Parti (Flag) │ Faction alignment: PNL, BD, GTT, or PBB              │
├─────────────────┼──────────────────────────────────────────────────────┤
│ 4. Bakat/Quirks │ Active mechanical perks and comedic disadvantages    │
└─────────────────┴──────────────────────────────────────────────────────┘
```

### 6.1 Candidate Talents (Perks)
* 🍯 **Lidah Manis:** Grants $+1.5\text{s}$ extra reading buffer before the timer countdown starts.
* 🤝 **Mesra Rakyat:** Widens the rhythmic hit window and hitboxes by $+30\%$.
* 🧮 **Pakar Kira:** Displays live remaining calculation totals in counting games (e.g. *Bayar Deposit*, *Borang 14*).
* 🧱 **Muka Tembok:** Player begins the election run with **4 Deposit Bundles** instead of 3.

### 6.2 Candidate Quirks (Comedic Handicaps)
* 💤 **Kaki Zzz:** Candidate dozes off at the start of a round; player must rapidly tap to wake them up before timer expires.
* 📢 **Janji Manis:** Demanding voters interrupt gameplay with sudden pop-up demands requiring an extra dismiss tap.
* 🌶️ **Sensitif:** Reduced timer ($1.0\text{s}$ less time), raising urgency and panic.

---

## 7. Complete Microgame Catalog (18 Microgames)

| # | Act | Microgame ID | Title (BM / EN) | Mechanics & Input | Constitutional & Legal Reference |
|---|---|---|---|---|---|
| 1 | 1 | `pecut_spr` | Pecut Dewan SPR<br>*SPR Nomination Sprint* | 3-lane arrow key / tap dodge; avoid journalists, grab Teh O Ais, reach door before 10:00 AM | Section 24, Election Offences Act 1954 |
| 2 | 1 | `semak_borang` | Semak Borang Penamaan<br>*Candidate Dossier Vetting* | Tap Lulus / Tolak; filter candidates based on age ($\ge 18$) and bankruptcy status | Federal Constitution Articles 47 & 48 |
| 3 | 1 | `bayar_deposit` | Bayar Deposit RM10,000<br>*Candidate Deposit Cash* | Tap cash bundles (`+RM1k`, `+RM2k`, `+RM5k`) to reach exact RM10,000 + RM5,000 totals | Section 19, Election Offences Act 1954 |
| 4 | 1 | `cop_watikah` | Cop Watikah Parti<br>*Stamp Authorization Letter* | Moving crosshair sweeps across letter; tap on beat 4 inside designated stamp target | Regulation 11(2)(c), Elections (Conduct of Elections) 1981 |
| 5 | 1 | `rebut_kamera` | Rebut Kamera TV<br>*Live TV Airtime Scramble* | Keep YB centered in moving camera frame; tap to elbow rival politicians out of shot | Broadcasting Act / Press Freedom Guidelines |
| 6 | 2 | `goreng_kueyteow` | Goreng Kuey Teow Mamak<br>*Char Kuey Teow Photo-Op* | Rapidly mash stir button through 3 ingredient phases; hold smile on beat 4 | Hawker Licensing & Public Relations Satire |
| 7 | 2 | `perang_speaker` | Perang Speaker Ceramah<br>*Megaphone Sound Clash* | Slogan volume meter clash; tap on beat to overpower rival tent, tap vents to cool generator | Police Permit & Peaceful Assembly Act |
| 8 | 2 | `turap_jalan` | Turap Jalan Kilat<br>*Flash Road Paving* | Tap to pour hot tar into potholes, drag roller before VIP Minister's luxury convoy arrives | JKR Rural Development Infrastructure Trope |
| 9 | 2 | `potong_reben` | Potong Reben Perasmian<br>*VIP Ribbon Snip* | Golden scissors alignment; snip through 3 celebratory ribbons on downbeat 4 | Official Ceremonial Protocol (Protokol Rasmi) |
| 10 | 2 | `baling_baju` | Baling Baju Kempen<br>*T-Shirt Campaign Toss* | Angle trajectory and launch free t-shirts into cheering crowd while avoiding chickens | Campaign Souvenirs Regulation |
| 11 | 2 | `payung_bos` | Payungkan Bos VIP<br>*Monsoon VIP Umbrella Escort* | Horizontal slider to steer large golden umbrella over erratic wandering VIP in monsoon rain | VIP Escort Etiquette Satire |
| 12 | 2 | `cuci_longkang` | Cuci Longkang & Pose<br>*Drain Scrubbing Photo-Op* | Swipe up/down to scrub clogged drain silt; tap thumb icon to strike a proud thumbs-up pose | Gotong-Royong Campaign Photo-Op Satire |
| 13 | 2 | `pacak_bendera` | Pacak Bendera Tengah Malam<br>*Midnight Bamboo Flag Duel* | Keep swaying 10m pole upright in crosswinds; tap 5 times to knot red raffia string | SPR Campaigning Cutoff Rule (11:59 PM) |
| 14 | 3 | `celup_dakwat` | Celup Dakwat Kekal<br>*Indelible Ink Dipping* | Position moving finger crosshair directly into the neck of the official purple ink bottle | Regulation 19, Elections (Conduct of Elections) 1981 |
| 15 | 3 | `tapis_undi_rosak` | Tapis Undi Rosak<br>*PACA Ballot Paper Sorting* | Sort 7 ballots: Accept unambiguous crosses ([D]), reject multi-ticks or sambal stains ([A]) | Regulation 25, Elections (Conduct of Elections) 1981 |
| 16 | 3 | `blackout_peti` | Pertahankan Peti Undi<br>*Blackout Defense* | Move flashlight beam to track and reveal mysterious ghostly hands reaching for the ballot box | Electoral Transparency & PACA Vigilance Satire |
| 17 | 3 | `borang_14` | Meterai Borang 14 Rasmi<br>*Form 14 Official Tally* | Tally ballots to reach 112 seats; apply polling agent signature on beat 4 | Form 14 (Penyata Pengundian SPR) Regulations |
| 18 | 3 | `runding_perpaduan` | Rundingan Kerajaan Perpaduan<br>*2 AM Mamak Briefcase Slide* | Slide confidential SD document briefcase across mamak table into partner's target zone | Federal Constitution Article 43(2)(a) (Appointment of PM) |

---

## 8. Technical Architecture & File Directory

### 8.1 Technology Stack
* **Language & Framework:** React 19, TypeScript
* **Routing & State:** TanStack Start & TanStack Router
* **Styling & Design System:** Tailwind CSS v4, Lucide React icons
* **3D Graphics:** Three.js (WebGL with Orthographic isometric cameras)
* **Audio Engine:** HTML5 Web Audio API (real-time procedural oscillators and biquad filters)
* **Persistence:** Browser `localStorage` for language preferences, profiles, and high scores

### 8.2 Codebase Structure

```
src/
├── routes/
│   ├── index.tsx                         # Primary application entry point & screen router
│   └── __root.tsx                        # HTML root document & global shell
├── styles.css                            # Tailwind v4 configuration & comic drop-shadow tokens
└── game/
    └── Cukup Jumlah!/
        ├── CukupJumlahGame.tsx           # Central orchestrator: state, loop, metronome & screens
        ├── SekolahFrame.tsx              # Classroom/newsprint HUD, deposits, timer & ballot meter
        ├── YbCustomizer.tsx              # Candidate builder, traits, quirks & live 3D preview
        ├── EndgameScreen.tsx             # Royal audience, Istana Negara ceremony & branching endings
        ├── LevelSelectModal.tsx          # Developer / QA stage warp & cheat engine (Shift+D)
        ├── ActShareCardModal.tsx         # Dynamic HTML5 canvas social poster card generator
        ├── ComicActionBurst.tsx          # Halftone vector comic starbursts (PADU! / LEBUR!)
        ├── CukupJumlahLogo.tsx           # Hand-styled vector game title logo
        ├── comicAvatar.tsx               # High-level character avatar wrapper
        ├── pixelAvatar.tsx               # 16-bit retro canvas avatar renderer (fallback/profile)
        ├── rhythm.ts                     # 125 BPM Web Audio procedural sound synthesizer
        ├── languageContext.tsx           # Bilingual localization engine (Bahasa Melayu & English)
        ├── facts.ts                      # Federal Constitution educational knowledge database
        ├── types.ts                      # Core TypeScript interfaces, factions, talents, and screens
        │
        ├── minigames/                    # All 18 microgame implementations
        │   ├── PecutDewanSPR.tsx         # Act 1: 3-lane nomination obstacle sprint
        │   ├── SemakBorang.tsx           # Act 1: Constitutional candidate vetting
        │   ├── BayarDeposit.tsx          # Act 1: RM10k cash bundle counting
        │   ├── CopWatikah.tsx            # Act 1: Party authorization letter stamp
        │   ├── RebutKameraTV.tsx         # Act 1: Live news airtime scuffle
        │   ├── GorengKueyTeow.tsx        # Act 2: Hawker stall photo-op
        │   ├── PerangSpeaker.tsx         # Act 2: Megaphone volume clash
        │   ├── TurapJalanKilat.tsx       # Act 2: Fast asphalt paving before convoy
        │   ├── PotongReben.tsx           # Act 2: Golden scissors ribbon snip
        │   ├── BalingBajuKempen.tsx      # Act 2: T-shirt toss from campaign lorry
        │   ├── PayungBos.tsx             # Act 2: Monsoon umbrella escort
        │   ├── CuciLongkang.tsx          # Act 2: Drain scrub & thumbs-up pose
        │   ├── PacakBendera.tsx          # Act 2: Midnight bamboo flagpole duel
        │   ├── CelupDakwatKekal.tsx      # Act 3: Indelible ink finger dipping
        │   ├── TapisUndiRosak.tsx        # Act 3: PACA ballot sorting
        │   ├── BlackoutPetiUndi.tsx      # Act 3: Flashlight blackout defense
        │   ├── Borang14.tsx              # Act 3: Form 14 seat tally
        │   └── RundingPerpaduan.tsx      # Act 3: 2 AM mamak SD briefcase exchange
        │
        └── voxel/                        # 3D Three.js Crossy Road voxel engine
            ├── voxelBuilder.ts           # 6-block character assembler, hopping physics & accents
            ├── voxelSkin.ts              # Procedural UV canvas skin texture painter
            ├── stageBuilder.ts           # 3D stage environments (Chunk, Workbench, Hybrid)
            ├── HeadGridInspector.tsx     # Developer 5x6x5 voxel face grid diagnostics
            ├── VoxelComparisonViewer.tsx # Side-by-side style comparison tool
            ├── VoxelSinglePreview.tsx    # Compact Three.js canvas for customizer/HUD
            └── StageComparisonViewer.tsx # Stage environment review viewport
```

---

## 9. Quality Assurance, QA Shortcuts & Educational Value

### 9.1 Developer QA & Level Select Modal (`LevelSelectModal.tsx`)
To verify and test all 18 microgames, endings, and mechanics without playing the entire campaign sequentially:
* **Activation Shortcut:** Press `Shift + D` on any screen, or add `?debug=true` / `?test=true` to the URL.
* **Capabilities:**
  * Warp to any of the 18 microgames instantly.
  * Inject custom seat counts (e.g. set to 111 seats to test victory, or 100 to test hung parliament).
  * Override active candidate Talents (*Lidah Manis*, *Mesra Rakyat*, *Pakar Kira*, *Muka Tembok*) and Quirks (*Kaki Zzz*, *Janji Manis*, *Sensitif*).
  * Direct access to all endgame scenarios (Victory, Hung Parliament, Unity Government, Opposition).

### 9.2 Real-World Educational Facts (`facts.ts`)
Between microgames and upon victory, players unlock verified constitutional knowledge cards:
* **Perkara 47 (Kelayakan Menjadi Ahli Parlimen):** Must be a citizen aged 18 or above (lowered from 21 via the Undi18 amendment).
* **Perkara 48 (Hilang Kelayakan Ahli Parlimen):** Disqualification criteria including undischarged bankruptcy, criminal conviction with imprisonment $\ge 1$ year or fine $\ge \text{RM2,000}$, and failure to file election expense returns.
* **Perkara 43(2)(a) (Pelantikan Perdana Menteri):** The Yang di-Pertuan Agong appoints as Prime Minister an MP who, in His Majesty's judgment, commands the confidence of the majority of the members of the Dewan Rakyat.
* **Perkara 49A (Akta Anti-Lompat Parti):** Parliamentary seats are vacated if an MP resigns from or ceases to be a member of their political party.
* **Section 19, Election Offences Act 1954:** Mandatory RM10,000 candidate deposit; forfeited if the candidate fails to secure at least one-eighth (12.5%) of the total valid votes polled.

---

## 10. Summary of Accomplishments & Current State

1. **Art & Identity Locked:** Seamless combination of Datuk Lat / *Gila-Gila* comedic flair with an ultra-clean *Crossy Road* Three.js voxel character system.
2. **Comprehensive Content:** All 18 planned microgames across 3 narrative acts are fully built and mechanically playable.
3. **Audio-Synchronized Gameplay:** Functional 125 BPM Web Audio engine providing rhythmic Kompang downbeats, woodblock build-ups, and chime cues.
4. **Endgame Completeness:** Multi-branching climaxes supporting Absolute Majority (112), Hung Parliament negotiations, Opposition Leader roles, and Deposit Forfeiture game-overs.
5. **Production Readiness:** Completely self-contained client-side game, zero external asset vulnerabilities, responsive mobile/desktop layout, passing builds and type-checks.
