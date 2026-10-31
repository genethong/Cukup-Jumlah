import type { ActNo, EndingId, RoundId } from "./flow";

// Every word the game shell shows, in Bahasa Melayu and English, in one place.
// Facts follow the fact sheet in docs/GAME_PLAN.md §5: only ✅ facts, and no regulation
// numbers that haven't been confirmed. Keep every party, person and slogan fictional.

export type Lang = "ms" | "en";
export type Text = { ms: string; en: string };

export const LANG_KEY = "cukup_jumlah_lang";

export function loadLang(): Lang {
  try {
    return window.localStorage.getItem(LANG_KEY) === "en" ? "en" : "ms";
  } catch {
    return "ms";
  }
}

export function saveLang(lang: Lang): void {
  try {
    window.localStorage.setItem(LANG_KEY, lang);
  } catch {
    // Private mode: the choice lasts for this visit only.
  }
}

/** Fills `{name}`-style slots. */
export function fill(text: string, slots: Record<string, string | number>): string {
  return text.replace(/\{(\w+)\}/g, (_, key: string) => String(slots[key] ?? `{${key}}`));
}

export const UI = {
  title: { ms: "Cukup Jumlah!", en: "Cukup Jumlah!" },
  tagline: {
    ms: "Permainan rentak pilihan raya dalam pentas wayang",
    en: "An election rhythm game on the shadow-puppet stage",
  },
  play: { ms: "Main", en: "Play" },
  continueAs: { ms: "Teruskan sebagai {name}", en: "Continue as {name}" },
  changeCandidate: { ms: "Tukar calon", en: "Change candidate" },
  otherLang: { ms: "English", en: "Bahasa Melayu" },
  disclaimer: {
    ms: "Parodi. Semua calon, parti dan slogan dalam permainan ini adalah rekaan dan tiada kaitan dengan mana-mana orang, parti atau badan sebenar. Fakta undang-undang diringkaskan untuk permainan.",
    en: "Parody. Every candidate, party and slogan in this game is made up and has nothing to do with any real person, party or body. Legal facts are simplified for the game.",
  },
  act: { ms: "Babak {n}", en: "Act {n}" },
  startAct: { ms: "Buka tirai", en: "Raise the curtain" },
  fact: { ms: "Fakta", en: "Fact" },
  seats: { ms: "kerusi", en: "seats" },
  seatsLabel: { ms: "{seats} daripada {goal} kerusi", en: "{seats} of {goal} seats" },
  depositsLabel: { ms: "Deposit tinggal {n}", en: "{n} deposits left" },
  tapHint: { ms: "Tepuk pada ketukan ke-4", en: "Tap on beat 4" },
  tapPad: { ms: "Pad tepuk", en: "Tap pad" },
  ready: { ms: "SEDIA...", en: "READY..." },
  go: { ms: "MULA!", en: "GO!" },
  comingSoon: {
    ms: "Permainan sebenar akan datang · tepuk pada ketukan ke-4",
    en: "Real game coming soon · tap on beat 4",
  },
  playAgain: { ms: "Main lagi", en: "Play again" },
  toTitle: { ms: "← Tajuk", en: "← Title" },
  noAudio: {
    ms: "Pelayar ini tidak menyokong bunyi Web Audio, jadi rentak tidak dapat dimainkan.",
    en: "This browser doesn't support Web Audio, so the beat can't play.",
  },
  stampWin: { ms: "PADU!", en: "PADU!" },
  stampLose1: { ms: "HILANG", en: "LOST" },
  stampLose2: { ms: "DEPOSIT!", en: "DEPOSIT!" },
  seatsGained: { ms: "+{n} kerusi", en: "+{n} seats" },
  finalSeats: { ms: "Kerusi dimenangi: {seats} / {total}", en: "Seats won: {seats} / {total}" },
} satisfies Record<string, Text>;

export const ACT_TITLES: Record<ActNo, Text> = {
  1: { ms: "Hari Penamaan Calon", en: "Nomination Day" },
  2: { ms: "Tempoh Berkempen", en: "The Campaign" },
  3: { ms: "Hari Mengundi & Kiraan", en: "Polling Day & the Count" },
};

/** What the dalang calls, and the line under it. Stand-ins until each game is built. */
export const ROUNDS: Record<RoundId, { call: Text; hint: Text }> = {
  pecut_spr: {
    call: { ms: "PECUT!", en: "RUN!" },
    hint: {
      ms: "Borang penamaan diserahkan 9–10 pagi",
      en: "Nomination papers go in from 9 to 10am",
    },
  },
  semak_borang: {
    call: { ms: "SEMAK!", en: "CHECK!" },
    hint: {
      ms: "Semak kertas sendiri: warganegara, 18 tahun ke atas",
      en: "Check your own papers: citizen, 18 or over",
    },
  },
  bayar_deposit: {
    call: { ms: "KIRA!", en: "COUNT!" },
    hint: { ms: "Deposit calon Parlimen: RM10,000", en: "Parliamentary deposit: RM10,000" },
  },
  cop_watikah: {
    call: { ms: "COP!", en: "STAMP!" },
    hint: { ms: "Surat kebenaran guna simbol parti", en: "Letter to use the party symbol" },
  },
  rebut_kamera: {
    call: { ms: "SENYUM!", en: "SMILE!" },
    hint: { ms: "Rebut tempat dalam gambar, tanpa sikut", en: "Get in the shot, no elbows" },
  },
  goreng_kueyteow: {
    call: { ms: "KACAU!", en: "STIR!" },
    hint: { ms: "Goreng kuey teow depan kamera", en: "Fry kuey teow for the cameras" },
  },
  perang_speaker: {
    call: { ms: "LAUNG!", en: "SHOUT!" },
    hint: { ms: "Ceramah lawan ceramah", en: "Rally against rally" },
  },
  turap_jalan: {
    call: { ms: "TURAP!", en: "PAVE!" },
    hint: { ms: "Jalan siap sebelum sesi bergambar", en: "Finish the road before the photo-op" },
  },
  potong_reben: {
    call: { ms: "GUNTING!", en: "SNIP!" },
    hint: { ms: "Potong reben pada ketukan ke-4", en: "Cut the ribbon on beat 4" },
  },
  baling_risalah: {
    call: { ms: "EDAR!", en: "HAND OUT!" },
    hint: { ms: "Edar risalah kempen, bukan hadiah", en: "Hand out leaflets, not gifts" },
  },
  payung_bos: {
    call: { ms: "PAYUNG!", en: "UMBRELLA!" },
    hint: { ms: "Jangan biar bos basah", en: "Keep the boss dry" },
  },
  cuci_longkang: {
    call: { ms: "SENTAL!", en: "SCRUB!" },
    hint: { ms: "Cuci longkang untuk kamera", en: "Scrub the drain for the cameras" },
  },
  pacak_bendera: {
    call: { ms: "PACAK!", en: "PLANT!" },
    hint: {
      ms: "Kempen tamat 11:59 malam sebelum hari mengundi",
      en: "Campaigning ends 11:59pm the night before polling",
    },
  },
  celup_dakwat: {
    call: { ms: "CELUP!", en: "DIP!" },
    hint: {
      ms: "Undi dulu: dakwat pada jari telunjuk kiri",
      en: "Vote first: ink on your left index finger",
    },
  },
  tapis_undi_rosak: {
    call: { ms: "BANTAH!", en: "OBJECT!" },
    hint: {
      ms: "Ketua tempat mengundi memutuskan; ejen boleh membantah",
      en: "The presiding officer decides; agents can object",
    },
  },
  borang_14: {
    call: { ms: "ASINGKAN!", en: "SORT!" },
    hint: { ms: "Borang 14: kiraan bagi satu saluran", en: "Form 14: the count for one stream" },
  },
  rundingan_gabungan: {
    call: { ms: "RUNDING!", en: "NEGOTIATE!" },
    hint: {
      ms: "Kumpul surat sokongan daripada parti lain",
      en: "Collect support letters from other parties",
    },
  },
};

export type FactId =
  "nomination" | "deposit" | "campaignEnds" | "spending" | "ink" | "majority" | "art43";

export const FACTS: Record<FactId, { text: Text; source?: Text }> = {
  nomination: {
    text: {
      ms: "Pada hari penamaan, borang penamaan calon diserahkan antara 9 dan 10 pagi.",
      en: "On nomination day, nomination papers are handed in between 9 and 10am.",
    },
  },
  deposit: {
    text: {
      ms: "Calon Parlimen membayar deposit RM10,000. Deposit itu hangus jika calon mendapat 1/8 undi atau kurang.",
      en: "A parliamentary candidate pays a RM10,000 deposit. It is lost if the candidate gets 1/8 of the votes or less.",
    },
  },
  campaignEnds: {
    text: {
      ms: "Kempen tamat 11:59 malam sebelum hari mengundi. Tiada kempen pada hari mengundi.",
      en: "Campaigning ends at 11:59pm the night before polling. There is no campaigning on polling day.",
    },
  },
  spending: {
    text: {
      ms: "Calon Parlimen boleh membelanjakan paling banyak RM200,000 untuk kempen.",
      en: "A parliamentary candidate can spend at most RM200,000 on the campaign.",
    },
    source: {
      ms: "Akta Kesalahan Pilihan Raya 1954, seksyen 19",
      en: "Election Offences Act 1954, section 19",
    },
  },
  ink: {
    text: {
      ms: "Sejak 2013, dakwat kekal disapu pada jari telunjuk kiri setiap pengundi.",
      en: "Since 2013, indelible ink goes on every voter's left index finger.",
    },
  },
  majority: {
    text: {
      ms: "Dewan Rakyat mempunyai 222 kerusi. Majoriti mudah ialah 112.",
      en: "The Dewan Rakyat has 222 seats. A simple majority is 112.",
    },
  },
  art43: {
    text: {
      ms: "Yang di-Pertuan Agong melantik sebagai Perdana Menteri seorang ahli Dewan Rakyat yang pada hemat Baginda mungkin mendapat kepercayaan majoriti ahli Dewan itu. Perdana Menteri yang hilang kepercayaan majoriti itu mesti meletak jawatan, melainkan Parlimen dibubarkan.",
      en: "The Yang di-Pertuan Agong appoints as Prime Minister a member of the Dewan Rakyat who, in His Majesty's judgment, is likely to command the confidence of the majority of its members. A Prime Minister who loses that confidence must resign unless Parliament is dissolved.",
    },
    source: {
      ms: "Perlembagaan Persekutuan, Perkara 43(2)(a) dan 43(4)",
      en: "Federal Constitution, Articles 43(2)(a) and 43(4)",
    },
  },
};

export const ACT_FACTS: Record<ActNo, readonly FactId[]> = {
  1: ["nomination", "deposit"],
  2: ["campaignEnds", "spending"],
  3: ["ink", "majority"],
};

export const ENDINGS: Record<EndingId, { stamp: Text; line: Text; fact: FactId }> = {
  victory: {
    stamp: { ms: "CUKUP JUMLAH!", en: "CUKUP JUMLAH!" },
    line: { ms: "Dilantik sebagai Perdana Menteri.", en: "Appointed Prime Minister." },
    fact: "art43",
  },
  coalition: {
    stamp: { ms: "GABUNGAN!", en: "COALITION!" },
    line: {
      ms: "Dengan sokongan parti lain, anda dilantik sebagai Perdana Menteri.",
      en: "With other parties' support, you are appointed Prime Minister.",
    },
    fact: "art43",
  },
  opposition: {
    stamp: { ms: "TARIK BALIK!", en: "TARIK BALIK!" },
    line: {
      ms: "Rundingan gagal. Anda duduk di blok pembangkang.",
      en: "Talks failed. You sit on the opposition benches.",
    },
    fact: "majority",
  },
  depositLebur: {
    stamp: { ms: "DEPOSIT LEBUR!", en: "DEPOSITS GONE!" },
    line: {
      ms: "Semua deposit anda hangus. Cuba lagi pada pilihan raya akan datang.",
      en: "All your deposits are gone. Try again next election.",
    },
    fact: "deposit",
  },
};

/** Words used inside individual microgames. */
export const GAME_TEXT = {
  borang14: {
    tapHint: { ms: "Leret ke longgokan yang betul", en: "Swipe to the right pile" },
    ballot: { ms: "Kertas undi", en: "Ballot paper" },
    yours: { ms: "Undi anda", en: "Your vote" },
    rival: { ms: "Undi lawan", en: "Rival's vote" },
    rivalName: { ms: "Calon {party}", en: "{party} candidate" },
    wrong: { ms: "Salah longgok!", en: "Wrong pile!" },
    penalty: { ms: "−1 saat", en: "−1 sec" },
    combo: { ms: "LAJU! ×{n}", en: "FAST! ×{n}" },
    left: { ms: "{n} lagi", en: "{n} left" },
    signed: {
      ms: "Borang 14 ditandatangani Ketua Tempat Mengundi",
      en: "Form 14 signed by the presiding officer",
    },
  },
  goreng: {
    howTo: { ms: "Putar jari dalam kuali", en: "Circle your finger in the wok" },
    cooked: { ms: "Masak", en: "Cooked" },
    faster: { ms: "Kacau laju!", en: "Stir faster!" },
    burning: { ms: "Hampir hangus!", en: "Burning!" },
    wokHei: { ms: "WOK HEI!", en: "WOK HEI!" },
    done: { ms: "Siap! Senyum untuk kamera", en: "Done! Smile for the cameras" },
    burnt: { ms: "HANGUS!", en: "BURNT!" },
  },
} satisfies Record<string, Record<string, Text>>;
