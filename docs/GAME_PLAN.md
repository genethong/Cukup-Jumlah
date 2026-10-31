# Cukup Jumlah! — Game Plan (source of truth)

Last updated: 31 Oct 2026. This page replaces `GAME_DESIGN_ORIGINAL.md` as the plan. The old doc and the existing code are a parts bin: keep what passes the five rules below, cut the rest.

## 1. The five rules (set by Axel, non-negotiable)

1. **A Malaysian election arcade game.** Quick rhythm microgames across one general election.
2. **100% factual and legally correct.** Every law, number and procedure shown must match the current law. If a citation can't be verified, show no citation.
3. **No 3R.** No race, religion or royalty content: no ethnic labels or ethnic-coded options, no religious jokes or symbols as jokes, no royal figures, crowns or royal yellow.
4. **Nothing that could get us sued.** Fictional people and parties only. No real names, faces, logos or slogans, and no party names that echo real ones. No official emblems (Jata Negara, SPR logo). No game that implies a real body or group commits a crime. A parody disclaimer on the title screen.
5. **Wayang kulit puppet avatars.** The whole game is styled as a puppet show, not just the characters.

## 2. What stays

- 3 acts: Nomination Day, the 14-day campaign, Polling Day and the count.
- Deposits as lives (start with 3), 112 of 222 seats as the goal, rhythm at 125 BPM.
- Fact cards between rounds, bilingual BM/EN.
- The puppet character creator (`/dev?lab=puppet`).

## 3. Look: the whole game is a puppet show

The stage is a fixed 9:16 portrait frame on every device (phone-first; centred on laptops). It is a lit cloth screen (*kelir*) with a warm oil-lamp glow. The gunungan sweeps across between microgames. The dalang calls out each command. The HUD is paper props: cut-out banknote deposits and a paper ballot box that fills with seats. "PADU!" and "HILANG DEPOSIT!" are cut-paper stamps. Menus sit backstage. The newsprint, pixel and 3D voxel looks are retired.

Treat wayang kulit with respect: the jokes are about the fictional politicians, never about the art form, the gunungan or the dalang.

## 4. Audit of the existing content

Verdicts: **Keep** (fine as is, apart from the look), **Fix** (keep the idea, change what's listed), **Cut**.

### Microgames

| # | Game | Verdict | What to change |
|---|---|---|---|
| 1 | Pecut Dewan SPR | Fix | Nomination window 9–10am is correct. Drop the "Section 24" citation (unverified). |
| 2 | Semak Borang | Fix | Use the exact Art. 47/48 grounds: citizen, 18+, resident; disqualified if bankrupt, of unsound mind, or convicted with ≥1 year jail or ≥RM2,000 fine without a free pardon. Frame it as you checking your own papers, not as the Returning Officer's job. |
| 3 | Bayar Deposit | Fix | RM10,000 is right. The RM5,000 is a **deposit for clearing campaign material afterwards** (Act 5, s.24B), not a "permit for flags and posters". Drop the "Regulation 8" citation until verified. |
| 4 | Cop Watikah | Fix | Party candidates do submit a letter authorising use of the party symbol. Drop "Regulation 11(2)(c)" until verified. |
| 5 | Rebut Kamera TV | Fix | Jostling for the shot, no elbowing or hitting. |
| 6 | Goreng Kuey Teow | Keep | Slice game. |
| 7 | Perang Speaker | Fix | Slice game. Don't mention a "police permit"; the rules changed in 2012. No legal citation unless verified. |
| 8 | Turap Jalan Kilat | Fix | Keep: a well-known trope across all parties (Axel's call). Keep it generic: no real place names, agencies or project signboards, no ruling-party colours on the convoy, and the joke is the rushed photo-op, not stolen money. |
| 9 | Potong Reben | Keep | |
| 10 | Baling Baju Kempen | Fix | Giving free gifts to voters is close to "treating" under Act 5. Throw pamphlets or wave flags instead. |
| 11 | Payung Bos | Fix | Remove the "royal yellow" umbrella. |
| 12 | Cuci Longkang | Keep | |
| 13 | Pacak Bendera | Keep | Campaigning ends at 11:59pm on the eve of polling (correct). |
| 14 | Celup Dakwat Kekal | Fix | Slice game. SPR staff apply ink to the voter's left index finger, so the YB casts **their own** vote and gets inked; the YB doesn't ink others. |
| 15 | Tapis Undi Rosak | Fix | The presiding officer decides rejections; agents can object. The player is the counting agent agreeing or objecting. Rejection grounds must match the regulations exactly (lawyer check). |
| 16 | Blackout Peti Undi | **Cut** | Ghost hands tampering with ballot boxes echoes real fraud allegations. |
| 17 | Borang 14 | Fix | Slice game. Form 14 is the count for **one polling stream**, signed by the presiding officer and given to counting agents. It is not a 112-seat tally. Drop "Section 16 Act 19" until verified. |
| 18 | Runding Perpaduan | Fix | No briefcases or 2am secret deals. Rename to "Rundingan Gabungan": collect signed support letters from fictional parties. Don't use "Kerajaan Perpaduan" (a real government's label). |

### Endings

| Ending | Verdict | What to change |
|---|---|---|
| Grand Victory | Fix | No Istana, Tuanku, crowns or bow. A plain screen: "Dilantik sebagai Perdana Menteri" plus the Art. 43(2)(a) card, worded exactly (see section 5). |
| Hung Parliament → coalition talks | Fix | As game 18. |
| Opposition | Keep | "Tarik Balik!" is fine. |
| Deposit Lebur | Keep | The fact card explains the real rule (below 1/8 of votes). |

### Parties, customiser and other content

- **Parties: rename all four.** "Barisan", "Bersatu" and "Gabungan" echo real coalitions and parties. Keep food themes with neutral words, e.g. Parti Nasi Lemak, Parti Durian, Parti Teh Tarik, Parti Boba. Drop the crown mascot and gold/yellow as a party colour (royal colour).
- **Old customiser (`YbCustomizer.tsx`): retire.** It has ethnic-coded outfits ("baju_tang", "kurta") and a "Melayu 🕌" label. The puppet creator replaces it.
- **Headwear** (songkok, tudung, ketayap, serban) stays as clothing. It is never a punchline.
- **SPR** may be named factually, never shown as corrupt or incompetent, and its logo is never used. No Jata Negara (restricted under the Emblems and Names (Prevention of Improper Use) Act 1963).
- **Share card text** "Raja Photo-Op": rename (uses "Raja").
- **Remove from v1:** 3D voxel code and the `three` package, pixel avatar, login/database and multiplayer leftovers.

## 5. Fact sheet

✅ = confirmed from a published source. ⚠️ = believed correct but not yet confirmed; don't cite the number in game until it is.

| Fact | Status |
|---|---|
| Parliamentary candidate deposit RM10,000; forfeited if the candidate gets 1/8 of the votes or less | ✅ amount and rule. ⚠️ regulation number |
| Campaign-material deposit RM5,000 (Parliament), RM3,000 (state), refunded after clean-up; Act 5, s.24B(4)(b) | ✅ (2018 parliamentary reply) |
| Campaign spending cap RM200,000 per parliamentary candidate; Act 5, s.19 | ✅ |
| Minimum age to be an MP is 18; Art. 47(b), amended by Act A1603 (2019) | ✅ |
| Disqualification grounds; Art. 48(1), including ≥1 year jail or ≥RM2,000 fine without free pardon | ⚠️ confirm text |
| Nomination papers handed in 9–10am on nomination day | ✅ (SPR practice) |
| Campaigning ends 11:59pm on the eve of polling; no campaigning on polling day | ✅ |
| Indelible ink on the left index finger, from 2013 (2012 regulation amendment) | ✅ practice. ⚠️ regulation number |
| PM: appointed by the YDPA as the MP who **in His Majesty's judgment is likely to command the confidence of the majority** of the Dewan Rakyat; Art. 43(2)(a). A PM who loses that majority's confidence must resign unless Parliament is dissolved; Art. 43(4) | ✅ wording. 112 of 222 is the majority, so it stays the game's target. The card must say the YDPA appoints and the majority keeps the PM in power; the old card made 112 sound like an automatic appointment |
| Dewan Rakyat has 222 seats; a simple majority is 112 | ✅ |
| Anti-hopping; Art. 49A (2022) | ✅ exists. ⚠️ exact grounds |
| Form 14 details, ballot rejection grounds (Reg. 25), party symbol letter (Reg. 11) | ⚠️ |

**Before public launch:** a short review by a Malaysian lawyer of this sheet, every fact card and the disclaimer. Everything they need is on this page.

## 6. Build order (one PR and preview each; Axel approves each)

1. **Style frame:** one still puppet-show scene at `/dev?lab=panggung` (stage, lamp glow, HUD, puppet, stamp, gunungan). Approve the look.
2. **Beat clock:** audio-driven timing, Perfect/Good/Miss, latency calibration, test page `/dev?lab=beat`.
3. **New game shell:** screens, HUD, transitions, all text in one BM/EN file, old code removed, parties renamed, endings fixed.
4. **Slice games, one PR each:** Borang 14 → Goreng Kuey Teow → Celup Dakwat Kekal → Perang Speaker. Playtest on phones.
5. **The other 13 games** (18, minus 1 cut, minus the 4 slice games) and the endings, then art/audio polish, playtest, lawyer review, launch.

Sources: [2018 parliamentary reply on campaign-material deposits](https://pardocs.sinarproject.org/documents/2018-march-april-parliamentary-session/oral-questions-soalan-lisan/2018-04-02-parliamentary-replies/soalan-32.pdf) · [GE15 deposit losses (FMT)](https://www.freemalaysiatoday.com/category/nation/2022/11/20/dr-m-mukhriz-among-369-candidates-who-lost-their-deposits) · [Election Offences Act 1954](https://en.wikipedia.org/wiki/Election_Offences_Act_1954) · [Constitution amendment 2019 (Allen & Gledhill)](https://www.allenandgledhill.com/publication/articles/19847/federal-constitution-amended-with-effect-from-15-december-2021) · [Nomination 9–10am (Malay Mail)](https://www.malaymail.com/news/malaysia/2022/11/01/ge15-submission-of-nomination-papers-from-9am-to-10am-this-saturday-says-ec/36759) · [Campaign ends 11.59pm (Malay Mail)](https://www.malaymail.com/amp/news/malaysia/2022/11/18/ge15-14-day-campaigning-period-will-end-at-1159-tonight/40389) · [Indelible ink (Borneo Post)](https://www.theborneopost.com/2013/02/21/voters-still-confused-about-the-use-of-indelible-ink/) · [Art. 43 commentary (FMT)](https://freemalaysiatoday.com/category/opinion/2022/11/22/commanding-the-confidence-of-dewan-rakyat) · [Anti-hopping law (Skrine)](https://www.skrine.com/insights/alerts/august-2022/malaysias-anti-party-hopping-law-a-compromised-la)
