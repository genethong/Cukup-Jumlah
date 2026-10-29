# 🇲🇾 CUKUP JUMLAH! — Game Design Document (GDD)

> **Version:** 1.0.0 (Production Master)  
> **Genre:** Satirical Malaysian Political Microgame / Rhythm-Arcade  
> **Inspirations:** *WarioWare, Inc.*, *Rhythm Heaven*, *Majalah Gila-Gila*, Datuk Lat editorial cartoons  
> **Platform:** Web / Mobile-First Responsive (Viewport Target: 390×844)  
> **Tech Stack:** React 19, TanStack Start/Router, Tailwind CSS v4, Web Audio API (zero external assets/CDNs)

---

## 1. Executive Summary & Core Concept

### 1.1 The Elevator Pitch
**Cukup Jumlah!** is a fast-paced, cheeky, satirical Malaysian political arcade microgame. Players step into the polished formal shoes of an aspiring Malaysian Member of Parliament (YB) maneuvering through the high-stakes chaos of an election: from surviving the strict screening of Nomination Day (Hari Penamaan Calon), to frantic roadside campaigning photo-ops, to securing the coveted **112 majority seats** in Dewan Rakyat before their **RM10,000 cash deposit** is forfeited!

### 1.2 Core Theme & Tone
* **Theme:** Authentic Malaysian General Election (Pilihan Raya Umum / PRU) culture.
* **Tone:** High-energy slapstick satire paired with genuine civic education based on the official Federal Constitution of Malaysia (*Perlembagaan Persekutuan*).
* **Humor Style:** Relatable Malaysian political tropes (awkward wet market photo-ops, 2 AM mamak negotiations, flying Char Kuey Teow, songkok senget, and obsessive seat-counting).

---

## 2. Visual & Art Direction ("The Locked Art Bible")

The artistic concept follows a strictly locked visual formula:

```
┌────────────────────────────────────────────────────────────────────────┐
│ ART FORMULA: 1B + 2A + 3A + 4A + RHYTHM LAYER                          │
├──────────────────┬─────────────────────────────────────────────────────┤
│ 1B: Art Style    │ Majalah Satira / Datuk Lat & Gila-Gila Caricatures  │
│ 2A: Screen Frame │ Sekolah Kebangsaan (SK) Classroom Polling Center    │
│ 3A: Life Counter │ 3x RM10,000 Cash Deposit Bundles (Wang Deposit SPR) │
│ 4A: Comedic Tone │ Wackier Slapstick, Panic Sweat & Action Pop SFX     │
│ Rhythm Layer     │ 125 BPM "Say the Word on Beat" Call-and-Response    │
└──────────────────┴─────────────────────────────────────────────────────┘
```

### 2.1 The Classroom Frame (Sekolah Kebangsaan)
* **Top Header — Papan Hitam SK (Green Chalkboard):**
  * Matte chalkboard green (`#152a20`) with subtle chalk dust texture and timber molding.
  * Powdery chalk typography for the countdown timer and station marker: `SK SRI BANGSAR • SALURAN 3`.
  * **3x RM10,000 Cash Deposit Bundles (`💵 RM10k`):** Represents player lives. When a microgame fails, an official red ink rubber stamp slams down: **`HILANG RM10,000 DEPOSIT! 💸`**.
* **Center Playfield — Meja Kayu SK (School Desk):**
  * Warm timber grain (`#c28448`) desk surface. Microgames are framed like comic book paper panels with bold 4px black borders and hard drop shadows (`shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]`).
* **Bottom HUD — Peti Undi SPR (Transparent Acrylic Ballot Box):**
  * Acrylic ballot box with yellow security zip-ties tracking the national race: **`SASARAN: 112 KERUSI`** with a live majority threshold progress bar.

### 2.2 Character Caricature System (Lat / Gila-Gila Style)
* **Outlines:** Thick, hand-inked 3px–4px black strokes (`#0f172a`).
* **Facial Anatomy:** Expressive round cartoon heads, oversized bulbous noses, wide toothy forced grins, and arching sweat beads when stressed.
* **Modular Wardrobe:**
  * **Headwear:** Songkok standard, songkok senget with gold trim, tudung, kopiah, pomade, and topi jerami.
  * **Outfits:** Baju Melayu with gold songket samping, batik with floral swirls, formal corporate suits, and flood relief jackets (*Jaket Banjir*).
  * **Iconic Props:** Parker gold pen peeking out of breast pocket, gleaming gold Rolex watch, leather document briefcase, and Good Morning towel.

---

## 3. The 4 Political Parties (Factions)

| Faction | Theme & Color | Slogan & Cultural Trope | Mascot Emoji |
|---|---|---|:---:|
| **PNL** *(Parti Nasi Lemak)* | **Sambal Red** (`#DC2626`) + Daun Pisang Green | *"Sambal Pedas, Suara Tegas"*<br>Fiery street reformist, megaphones, grassroots rallies. | 🌶️ |
| **BD** *(Barisan Durian)* | **Musang Gold** (`#EAB308`) + Vellfire Chrome | *"Raja Segala Parti, Berisi & Berduri"*<br>Veteran political elites, Vellfires, high songkok, gold rings. | 👑 |
| **GTT** *(Gabungan Teh Tarik)* | **Mamak Blue** (`#2563EB`) + Froth Amber | *"Buih Lebih, Janji Buih"*<br>2 AM mamak negotiators, stainless steel mugs, pragmatic consensus. | ☕ |
| **PBB** *(Parti Boba Bersatu)* | **Pastel Slate** (`#F8FAFC`) + Taro Purple | *"Manis 100%, Ais 0%"*<br>Youth TikTok generation, smartphone ring-light tripods, striped boba straws. | 🧋 |

---

## 4. Audio & Game Feel: The 125 BPM "On-The-Beat" Engine

Inspired by *Rhythm Heaven* (e.g. *Ringside*, *Love Rap*) and Malaysian political call-and-response chants:

### 4.1 Rhythmic Call-and-Response Loop
Every microgame runs on a synchronized **125 BPM metronome groove** (`480ms per beat`).
1. **Beats 1, 2, 3 (The Call):** The game delivers a rhythmic voice/speech prompt above the desk.
2. **Beat 4 (The Hit Window):** The player executes the tap right on the downbeat!

```
Beat 1 (Call)   --> Beat 2 (Build)  --> Beat 3 (Cue)        --> Beat 4 (PLAYER TAP!)
"CUKUP..."          "...KE..."          "...BELUM?!"           --> "JUMLAH!" 💥
"BORANG..."         "...KERTAS..."      "...KELAYAKAN?!"       --> "IMBAS! 📑"
"KIRA..."           "...TEPAT..."       "...RM10,000?!"        --> "BAYAR! 💵"
"ANGKAT..."         "...SURAT..."       "...WATIKAH?!"         --> "COP TEPAT! 📑"
"KACAU..."          "...KUALI..."       "...PANAS?!"           --> "KACAU LAJU! 🥢"
"SIAP..."           "...SEDIA..."       "...GUNTING?!"         --> "GUNTING! ✂️"
"JAGA..."           "...HUJAN..."       "...BOS VIP?!"         --> "PAYUNG! ☂️"
"IKAT..."           "...TIANG..."       "...LAMPU?!"           --> "PACAK! 🚩"
```

### 4.2 Web Audio Sound Cues
* **Beat Metronome:** Deep kompang kick on beat 1; snappy woodblock click on beats 2 & 3; bell-chime cue on beat 4.
* **On-Beat Success (`PADU! ⭐`):** Instant C-major upward arpeggio with celebratory crowd cheer.
* **Off-Beat / Failure (`HILANG DEPOSIT 💸`):** Heavy rubber stamp slam (`BAM!`), followed by a comedic vinyl record scratch (`SKRRRT!`).

---

## 5. Microgame Catalog & Mechanics

Each microgame lasts between **4.0s to 8.0s** (with an initial 1.5s reading buffer).

### Act 1: Hari Penamaan Calon (Nomination Day)
* **1. Semak Borang (Eligibility Screening):**
  * *Prompt:* `IMBAS KELAYAKAN!`
  * *Satirical Lore:* Clerk scrutinizes incoming Borang 4A candidates.
  * *Mechanic:* Evaluate candidate dossier. Reject underage (<18) or undischarged bankrupts per Federal Constitution Articles 47 & 48.
  * *Action:* Tap **`LULUSKAN!`** or **`REJECT (TOLAK)`**.

* **2. Bayar Deposit (Candidate Deposit Cash):**
  * *Prompt:* `KIRA DEPOSIT TEPAT!`
  * *Satirical Lore:* Section 19 of the Election Offences Act requires an exact RM10,000 deposit before 10:00 AM.
  * *Mechanic:* Tap bundles of `+RM1,000`, `+RM2,000`, and `+RM5,000` to hit exactly RM10,000. Overcounting causes SPR to reject the cash!

* **3. Cop Watikah (Party Endorsement Stamp):**
  * *Prompt:* `COP SURAT WATIKAH!`
  * *Satirical Lore:* Aligning the official party president's stamp on the nomination endorsement document.
  * *Mechanic:* Moving reticle sweeps across the letter. Tap on beat 4 when aligned inside the red dashed box to stamp `DISAHKAN ✅`!

### Act 2: Tempoh Berkempen (14-Day Campaign Trail)
* **4. Goreng Kuey Teow (Press Photo-Op):**
  * *Prompt:* `KACAU KUALI!`
  * *Satirical Lore:* Politician holding a spatula awkwardly at a night hawker stall to look humble in front of journalists.
  * *Mechanic:* Rapidly mash the stir button 8 times. Blinding camera flashes pop across the screen (`KLIK! 📸 FLASH!`).

* **5. Payung Bos (VIP Protocol):**
  * *Prompt:* `PAYUNGKAN VIP!`
  * *Satirical Lore:* Keeping the oblivious VIP dry while monsoon rain pours down during a walkabout.
  * *Mechanic:* Smooth horizontal slider controls the golden umbrella, matching the wandering VIP's erratic movements.

* **6. Potong Reben (Mega Launch Ceremony):**
  * *Prompt:* `GUNTING REBEN!`
  * *Satirical Lore:* Launching a RM50 street lamp post paint job with a RM5,000 ceremonial party.
  * *Mechanic:* Tap the golden scissors on beat 4 to sever the ribbon with an explosion of confetti (`GUNTING! ✂️`).

* **7. Pacak Bendera (Midnight Flag Guerrilla War):**
  * *Prompt:* `IKAT BENDERA!`
  * *Satirical Lore:* SPR campaigning rules strictly require all flag installations to halt at 11:59 PM.
  * *Mechanic:* Tap 4 times to knot party flags with red tali rafia onto bamboo poles under sodium streetlight glow before midnight strikes.

### Act 3: Malam Kiraan Undi & Rundingan SD
* **8. Borang 14 (Penyata Pengundian SPR):**
  * *Prompt:* `KIRA BORANG 14!`
  * *Satirical Lore:* Polling station tally verification with polling agents (PACA) at closing time.
  * *Mechanic:* Tap ballot stacks on beat 4 to record valid votes precisely up to the target.

* **9. Tolak Beg SD (2 AM Mamak Statutory Declaration Exchange):**
  * *Prompt:* `TOLAK BEG SD!`
  * *Satirical Lore:* Late-night coalition dealmaking at a 24-hour mamak stall over teh tarik and roti canai.
  * *Mechanic:* Regulate the briefcase slide momentum and release on beat 4 into ally YB's target catch zone, avoiding kuah dhal and paparazzi flashes.

---

## 6. Progression, Win & Loss Conditions

### 6.1 Life System: 3x RM10,000 Cash Deposit Bundles
* Players start each run with **3 Bundles of RM10,000 Cash** (`💵 x3`).
* Failing any microgame triggers a rubber stamp slam: **`HILANG RM10,000 DEPOSIT! 💸`**.
* If all 3 deposits are lost, player suffers **Game Over: `DEPOSIT LEBUR! CALON HILANG KELAYAKAN!`**.

### 6.2 Goal: The 112 Parliament Majority
* Each won microgame awards **+5 Kerusi Parlimen**.
* The overarching objective is to accumulate **112 seats** to trigger the endgame victory sequence: **"CUKUP JUMLAH! MENGADAP TUANKU UNTUK MEMBENTUK KERAJAAN!"**.

---

## 7. Codebase File Structure

```
src/game/cukup-jumlah/
├── CukupJumlahGame.tsx       # Main game state orchestrator, loop, and screen routing
├── SekolahFrame.tsx          # Green chalkboard HUD, metronome dots, deposit & ballot box
├── comicAvatar.tsx           # Datuk Lat / Gila-Gila hand-inked SVG caricature generator
├── pixelAvatar.ts            # Legacy 16-bit pixel canvas renderer (fallback)
├── rhythm.ts                 # Web Audio synthesizer (125 BPM metronome, SFX chimes & slams)
├── types.ts                  # Faction profiles, candidate traits, screen & microgame types
├── facts.ts                  # Federal Constitution educational reference database
├── YbCustomizer.tsx          # Interactive character creation screen with real-time speech bubbles
├── ActShareCardModal.tsx     # Social share card generator for completed acts
└── minigames/
    ├── SemakBorang.tsx       # Legal eligibility screening game
    ├── BayarDeposit.tsx      # RM10,000 cash bundle counting game
    ├── CopWatikah.tsx        # Moving rubber stamp alignment game
    ├── GorengKueyTeow.tsx    # Press photo-op rapid stir game
    ├── PayungBos.tsx         # Rainstorm VIP umbrella slider game
    ├── PotongReben.tsx       # Ribbon cutting ceremony game
    ├── PacakBendera.tsx      # Bamboo pole flag knotting game
    ├── Borang14.tsx          # Polling station Borang 14 tally game
    └── TolakBegSD.tsx        # 2 AM Mamak Statutory Declaration briefcase exchange
```

---

## 8. Development Status & Next Milestones

* **Current Status:** 
  * ✅ Art direction locked: Lat caricature + SK Frame + RM10k Bundles + Slapstick + 125 BPM Rhythm.
  * ✅ Live dev server running on `0.0.0.0:8080`.
  * ✅ Production build and TypeScript checks passing cleanly.
  * ✅ Automated browser smoke tests verified on desktop and mobile viewports.
  * ✅ **Milestone 1 Completed:** Act 3 *Malam Kiraan Undi & Rundingan SD* (`Borang14` PACA tally & `TolakBegSD` 2 AM Mamak exchange).
  * ✅ **Milestone 3 Completed:** Candidate Talents & Quirks active gameplay modifiers (Lidah Manis, Mesra Rakyat, Pakar Kira, Muka Tembok, Kaki Zzz, Janji Manis, Sensitif).
  * ✅ **Milestone 4 Completed:** The Grand "Cukup Jumlah!" Victory Sequence (`EndgameScreen.tsx`) with Istana Negara royal audience, interactive "Songkok Senget" bow, and Parlimen Tergantung (Hung Parliament) branch.
* **Upcoming Milestones (For Collaborating Agents):**
  * **Milestone 2:** Implement local high-score leaderboard (`localStorage`) tracking career campaigns, fastest times to 112 seats, and deposit bundles preserved.
