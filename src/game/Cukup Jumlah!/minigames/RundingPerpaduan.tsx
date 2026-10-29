import { useEffect, useRef, useState } from "react";
import type { PartyId } from "../types";
import { PARTIES } from "../types";
import { rhythmAudio } from "../rhythm";
import { useLanguage } from "../languageContext";

interface RundingPerpaduanProps {
  playerParty: PartyId;
  currentSeats: number;
  isMesraRakyat?: boolean;
  onComplete: (success: boolean, bonusSeatsWon: number) => void;
}

type OfferType = "manifesto" | "kabinet" | "mou";

interface KingmakerState {
  partyId: PartyId;
  seatsHeld: number;
  confidence: number; // 0 to 100
  wantedOffer: OfferType;
  locked: boolean;
}

const OFFER_KEYS: OfferType[] = ["manifesto", "kabinet", "mou"];

export function RundingPerpaduanGame({
  playerParty,
  currentSeats,
  isMesraRakyat = false,
  onComplete,
}: RundingPerpaduanProps) {
  const { t } = useLanguage();
  const otherParties = (Object.keys(PARTIES) as PartyId[]).filter((p) => p !== playerParty);

  const OFFER_META: Record<OfferType, { icon: string; label: string; short: string }> = {
    manifesto: {
      icon: "📜",
      label: t("Janji Manifesto Rakyat", "People's Manifesto Pledges"),
      short: t("Tuntut Manifesto 📜", "Demands Manifesto 📜"),
    },
    kabinet: {
      icon: "🏛️",
      label: t("Agihan Kuota Kabinet", "Cabinet Quota Allocation"),
      short: t("Tuntut Kabinet 🏛️", "Demands Cabinet 🏛️"),
    },
    mou: {
      icon: "🤝",
      label: t("Meterai Perjanjian MoU", "Sign Stability MoU"),
      short: t("Tuntut MoU 🤝", "Demands MoU 🤝"),
    },
  };

  const [kingmakers, setKingmakers] = useState<KingmakerState[]>(() =>
    otherParties.map((pid, idx) => ({
      partyId: pid,
      seatsHeld: 16,
      confidence: 35,
      wantedOffer: OFFER_KEYS[idx % 3],
      locked: false,
    }))
  );
  const [selectedIdx, setSelectedIdx] = useState<number>(0);
  const [statusMessage, setStatusMessage] = useState<string>(() =>
    t(
      "Pilih parti & tekan tawaran yang sepadan dengan tuntutan mereka!",
      "Select a party & match their coalition demand to gain confidence!"
    )
  );

  const kingmakersRef = useRef<KingmakerState[]>(
    otherParties.map((pid, idx) => ({
      partyId: pid,
      seatsHeld: 16,
      confidence: 35,
      wantedOffer: OFFER_KEYS[idx % 3],
      locked: false,
    }))
  );
  const finishedRef = useRef(false);

  // Rival coalition constantly tries to pull unlocked kingmakers' confidence down & rotate demands
  useEffect(() => {
    const interval = setInterval(() => {
      if (finishedRef.current) return;

      const nextList = kingmakersRef.current.map((km) => {
        if (km.locked) return km;

        // Rival pulls confidence down slightly
        const rivalPull = isMesraRakyat ? 0.55 : 0.8;
        const nextConf = Math.max(5, km.confidence - rivalPull);

        // Occasionally switch demand if unlocked
        const nextOffer =
          Math.random() < 0.04
            ? OFFER_KEYS[Math.floor(Math.random() * OFFER_KEYS.length)]
            : km.wantedOffer;

        return {
          ...km,
          confidence: nextConf,
          wantedOffer: nextOffer,
        };
      });

      kingmakersRef.current = nextList;
      setKingmakers(nextList);
    }, 80);

    return () => clearInterval(interval);
  }, [isMesraRakyat]);

  const handleDeliverOffer = (offer: OfferType) => {
    if (finishedRef.current) return;

    const currentList = [...kingmakersRef.current];
    // Find either the currently selected kingmaker (if unlocked) or any unlocked kingmaker wanting this offer
    let targetIdx = selectedIdx;
    if (currentList[targetIdx]?.locked) {
      const firstUnlocked = currentList.findIndex((k) => !k.locked);
      if (firstUnlocked !== -1) targetIdx = firstUnlocked;
    }

    const target = currentList[targetIdx];
    if (!target || target.locked) return;

    if (target.wantedOffer === offer) {
      // Matched the exact coalition demand!
      rhythmAudio.playStampSlam();
      const boost = isMesraRakyat ? 38 : 34;
      const nextConf = Math.min(100, target.confidence + boost);
      const isNowLocked = nextConf >= 100;

      // Rotate next demand if not yet 100%
      const otherOffers = OFFER_KEYS.filter((k) => k !== offer);
      const nextWanted = otherOffers[Math.floor(Math.random() * otherOffers.length)];

      currentList[targetIdx] = {
        ...target,
        confidence: nextConf,
        locked: isNowLocked,
        wantedOffer: nextWanted,
      };

      kingmakersRef.current = currentList;
      setKingmakers(currentList);

      const pInfo = PARTIES[target.partyId];
      if (isNowLocked) {
        rhythmAudio.playPaduSuccess();
        setStatusMessage(
          t(
            `✅ ${pInfo.name} (${pInfo.symbolEmoji}) TANDATANGAN MoU PERPADUAN! (+${target.seatsHeld} Kerusi)`,
            `✅ ${pInfo.name} (${pInfo.symbolEmoji}) SIGNED UNITY MoU! (+${target.seatsHeld} Seats)`
          )
        );
        // Auto-select next unlocked party
        const nextUnlockedIdx = currentList.findIndex((k) => !k.locked);
        if (nextUnlockedIdx !== -1) {
          setSelectedIdx(nextUnlockedIdx);
        }
      } else {
        setStatusMessage(
          t(
            `🤝 Kepercayaan ${pInfo.name} meningkat ke ${Math.round(nextConf)}%!`,
            `🤝 Confidence of ${pInfo.name} rose to ${Math.round(nextConf)}%!`
          )
        );
      }

      // Check if we now have enough locked coalition seats (at least 2 parties locked OR total seats >= 112)
      const lockedParties = currentList.filter((k) => k.locked);
      const bonusSeats = lockedParties.reduce((sum, k) => sum + k.seatsHeld, 0);
      if (
        (lockedParties.length >= 2 && currentSeats + bonusSeats >= 112) ||
        lockedParties.length === 3
      ) {
        finishedRef.current = true;
        const finalBonus = Math.max(bonusSeats, 114 - currentSeats);
        rhythmAudio.playPaduSuccess();
        setTimeout(() => onComplete(true, finalBonus), 450);
      }
    } else {
      // Wrong offer for this party!
      rhythmAudio.playSkrrtMiss();
      currentList[targetIdx] = {
        ...target,
        confidence: Math.max(0, target.confidence - 10),
      };
      kingmakersRef.current = currentList;
      setKingmakers(currentList);
      setStatusMessage(
        t(
          `❌ ${PARTIES[target.partyId].name} mahu ${OFFER_META[target.wantedOffer].icon} sekarang!`,
          `❌ ${PARTIES[target.partyId].name} wants ${OFFER_META[target.wantedOffer].icon} instead!`
        )
      );
    }
  };

  const lockedBonusSeats = kingmakers
    .filter((k) => k.locked)
    .reduce((sum, k) => sum + k.seatsHeld, 0);
  const projectedSeats = currentSeats + lockedBonusSeats;

  return (
    <div className="space-y-2.5 select-none">
      {/* Top Coalition Seat Counter */}
      <div className="flex items-center justify-between bg-slate-900 text-white px-3 py-1.5 rounded-xl border-2 border-slate-950 text-xs font-mono comic-shadow-sm">
        <div className="flex items-center gap-1.5">
          <span>🤝</span>
          <span className="font-black text-amber-400">
            {t("RUNDINGAN KERAJAAN PERPADUAN", "UNITY COALITION TALKS")}
          </span>
        </div>
        <div
          className={`font-black ${
            projectedSeats >= 112 ? "text-emerald-400" : "text-amber-300"
          }`}
        >
          {t(`KERUSI GABUNGAN: ${projectedSeats} / 112`, `COALITION SEATS: ${projectedSeats} / 112`)}
        </div>
      </div>

      {/* 3 Kingmaker Party Cards */}
      <div className="grid grid-cols-3 gap-2">
        {kingmakers.map((km, idx) => {
          const pInfo = PARTIES[km.partyId];
          const isSelected = idx === selectedIdx && !km.locked;
          const demand = OFFER_META[km.wantedOffer];

          return (
            <button
              key={km.partyId}
              type="button"
              onClick={() => {
                if (!km.locked) setSelectedIdx(idx);
              }}
              className={`p-2.5 rounded-2xl border-3 transition text-left flex flex-col justify-between cursor-pointer relative comic-shadow-sm ${
                km.locked
                  ? "bg-emerald-950 border-emerald-400 text-white"
                  : isSelected
                    ? "bg-slate-900 border-amber-400 text-white shadow-[0_0_15px_rgba(251,191,36,0.35)] scale-[1.02]"
                    : "bg-slate-800 border-slate-700 text-slate-200 hover:border-slate-500"
              }`}
            >
              {/* Party Header */}
              <div className="flex items-center justify-between">
                <span className="text-xl">{pInfo.symbolEmoji}</span>
                <span className="text-[9px] font-mono font-black px-1.5 py-0.5 rounded bg-slate-950 text-amber-300">
                  {t(`+${km.seatsHeld} Kerusi`, `+${km.seatsHeld} Seats`)}
                </span>
              </div>

              <div className="mt-1">
                <div className="text-xs font-black truncate">{pInfo.name}</div>
                <div className="text-[9px] text-slate-400 truncate">{pInfo.fullName}</div>
              </div>

              {/* Wanted Offer Bubble */}
              <div
                className={`mt-2 px-1.5 py-1 rounded-xl border text-center font-mono font-black text-[9px] ${
                  km.locked
                    ? "bg-emerald-500 text-slate-950 border-slate-950"
                    : "bg-amber-400 text-slate-950 border-slate-950 animate-pulse"
                }`}
              >
                {km.locked ? t("✅ MoU DIMETERAI!", "✅ MoU SIGNED!") : demand.short}
              </div>

              {/* Confidence Bar */}
              <div className="mt-2">
                <div className="flex justify-between text-[8px] font-mono font-bold mb-0.5">
                  <span>{t("Keyakinan:", "Confidence:")}</span>
                  <span>{Math.round(km.confidence)}%</span>
                </div>
                <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-75 ${
                      km.locked ? "bg-emerald-400" : "bg-amber-400"
                    }`}
                    style={{ width: `${km.confidence}%` }}
                  />
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Live Status Banner */}
      <div className="bg-slate-900 text-amber-300 text-center text-[11px] font-mono font-bold py-1.5 px-3 rounded-xl border border-slate-800 comic-shadow-sm">
        {statusMessage}
      </div>

      {/* 3 Action Buttons to Deliver Matching Offer to Selected Party */}
      <div className="grid grid-cols-3 gap-2">
        {OFFER_KEYS.map((offerKey) => {
          const meta = OFFER_META[offerKey];
          const activeTarget = kingmakers[selectedIdx];
          const isMatching = activeTarget && !activeTarget.locked && activeTarget.wantedOffer === offerKey;

          return (
            <button
              key={offerKey}
              type="button"
              onClick={() => handleDeliverOffer(offerKey)}
              className={`py-3 px-2 rounded-2xl border-3 border-slate-950 font-black text-xs transition cursor-pointer flex flex-col items-center justify-center gap-0.5 comic-shadow active:translate-y-0.5 ${
                isMatching
                  ? "bg-emerald-400 hover:bg-emerald-300 text-slate-950 ring-2 ring-amber-300"
                  : "bg-amber-400 hover:bg-amber-300 text-slate-950"
              }`}
            >
              <span className="text-xl">{meta.icon}</span>
              <span className="text-[10px] uppercase tracking-tight leading-tight text-center">
                {meta.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
