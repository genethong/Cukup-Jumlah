import { useEffect, useRef, useState } from "react";

interface Borang14Props {
  onComplete: (success: boolean) => void;
  currentBeat: number;
}

const TARGET_VOTES = 112;

const BALLOT_STACKS = [
  { amount: 16, label: "IKAT KECIL", className: "bg-blue-500 hover:bg-blue-400" },
  { amount: 32, label: "IKAT SEDANG", className: "bg-purple-400 hover:bg-purple-300" },
  { amount: 64, label: "IKAT BESAR", className: "bg-emerald-400 hover:bg-emerald-300" },
] as const;

function CountingClerk({ sweating }: { sweating: boolean }) {
  return (
    <svg viewBox="0 0 72 78" className="w-14 h-16 shrink-0" aria-hidden="true">
      <ellipse cx="36" cy="74" rx="18" ry="3" fill="rgba(15,23,42,0.18)" />
      <path
        d="M22 46 L50 46 L54 70 L18 70 Z"
        fill="#1d4ed8"
        stroke="#0f172a"
        strokeWidth="3.5"
        strokeLinejoin="round"
      />
      <path d="M24 46 L36 58 L48 46" fill="#f8fafc" stroke="#0f172a" strokeWidth="3" />
      <circle cx="36" cy="28" r="16" fill="#f6d7b0" stroke="#0f172a" strokeWidth="3.5" />
      <path d="M20 24 Q36 10 52 24 L48 18 Q36 8 24 18 Z" fill="#0f172a" stroke="#0f172a" strokeWidth="3" />
      <ellipse cx="29" cy="28" rx="4.2" ry="5" fill="#fff" stroke="#0f172a" strokeWidth="2.5" />
      <ellipse cx="43" cy="28" rx="4.2" ry="5" fill="#fff" stroke="#0f172a" strokeWidth="2.5" />
      <circle cx="30" cy="29" r="2" fill="#0f172a" />
      <circle cx="44" cy="29" r="2" fill="#0f172a" />
      <ellipse cx="36" cy="35" rx="5" ry="3.4" fill="#e8b48a" stroke="#0f172a" strokeWidth="3" />
      <path d="M30 41 Q36 45 42 41" fill="none" stroke="#0f172a" strokeWidth="2.5" strokeLinecap="round" />
      {sweating && (
        <g>
          <ellipse cx="14" cy="22" rx="3" ry="4.5" fill="#7dd3fc" stroke="#0f172a" strokeWidth="2" transform="rotate(-20 14 22)" />
          <ellipse cx="58" cy="20" rx="2.4" ry="3.6" fill="#7dd3fc" stroke="#0f172a" strokeWidth="2" transform="rotate(18 58 20)" />
        </g>
      )}
    </svg>
  );
}

export function Borang14Game({ onComplete, currentBeat }: Borang14Props) {
  const [counted, setCounted] = useState(0);
  const [offBeat, setOffBeat] = useState(false);
  const settled = useRef(false);
  const finishTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (finishTimer.current) clearTimeout(finishTimer.current);
    };
  }, []);

  const onBeat = currentBeat === 4;
  const over = counted > TARGET_VOTES;
  const exact = counted === TARGET_VOTES;
  const progressPercent = Math.min(100, (counted / TARGET_VOTES) * 100);

  const finish = (success: boolean) => {
    if (settled.current) return;
    settled.current = true;
    finishTimer.current = setTimeout(() => onComplete(success), 350);
  };

  const handleAddBallots = (amount: number) => {
    if (settled.current) return;
    if (!onBeat) {
      setOffBeat(true);
      return;
    }

    setOffBeat(false);
    const next = counted + amount;
    setCounted(next);
    if (next === TARGET_VOTES) finish(true);
    else if (next > TARGET_VOTES) finish(false);
  };

  const handleReset = () => {
    if (settled.current) return;
    setCounted(0);
    setOffBeat(false);
  };

  return (
    <div className="flex flex-col items-center justify-between p-2 text-center w-full relative">
      <div className="w-full bg-amber-200 border-4 border-slate-900 rounded-xl px-3 py-1.5 mb-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-left flex items-center justify-between gap-2">
        <div>
          <span className="text-[9px] font-mono font-bold text-slate-700 uppercase block">
            AGEN PENGIRAAN UNDI (PACA):
          </span>
          <span className="text-xs font-black text-slate-950">
            &quot;Catat pada beat ke-4! Borang 14 mesti tepat 112 undi sah.&quot;
          </span>
        </div>
        <CountingClerk sweating={offBeat || over} />
      </div>

      <div className="w-full bg-[#fdf8ee] p-4 rounded-2xl border-4 border-slate-900 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] mb-3 relative text-center overflow-hidden">
        {over && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/10 pointer-events-none">
            <div className="border-4 border-red-800 bg-red-600 text-white px-3 py-1.5 rounded-xl font-black text-sm uppercase tracking-wider rotate-[-12deg] shadow-[4px_4px_0px_0px_rgba(127,29,29,1)]">
              HILANG RM10,000 DEPOSIT! 💸
            </div>
          </div>
        )}

        <div className="flex items-center justify-between border-b-4 border-slate-900 pb-1 mb-2">
          <span className="text-[9px] font-mono font-bold text-red-700 uppercase">
            Penyata Pengundian
          </span>
          <span className="text-[9px] font-black bg-red-600 text-white px-1.5 py-0.5 rounded border-2 border-slate-900">
            BORANG 14
          </span>
        </div>

        <div className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider mb-1">
          Undi sah calon pada borang
        </div>

        <div className="text-3xl md:text-4xl font-mono font-black tracking-tight text-slate-950 mb-2">
          {counted.toLocaleString()}
          <span className="text-xs font-bold text-slate-500 font-sans ml-2">/ {TARGET_VOTES} undi</span>
        </div>

        <div className="w-full bg-slate-300 rounded-full h-3.5 overflow-hidden border-4 border-slate-900 mb-2">
          <div
            className={`h-full transition-all duration-150 ${
              over ? "bg-red-600" : exact ? "bg-emerald-500" : "bg-amber-400"
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {offBeat && !over && !exact && (
          <div className="bg-sky-100 border-4 border-slate-900 text-slate-950 text-[10px] font-black rounded-lg py-1 px-2 uppercase">
            Peluh! Luar beat. Tunggu beat 4.
          </div>
        )}

        {exact && (
          <div className="bg-emerald-100 border-4 border-emerald-700 text-emerald-900 text-[10px] font-black rounded-lg py-1 px-2 uppercase">
            Tepat 112! Borang 14 disahkan.
          </div>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2 w-full">
        {BALLOT_STACKS.map((stack) => (
          <button
            key={stack.amount}
            type="button"
            onClick={() => handleAddBallots(stack.amount)}
            disabled={settled.current || exact}
            className={`p-3 ${stack.className} active:translate-x-0.5 active:translate-y-0.5 active:shadow-none rounded-xl border-4 border-slate-900 text-slate-950 font-black text-xs shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition cursor-pointer flex flex-col items-center disabled:opacity-50 ${
              onBeat ? "ring-4 ring-amber-300 scale-[1.03]" : ""
            }`}
          >
            <span className="text-lg">🗳️</span>
            <span className="text-[9px] font-mono font-bold uppercase">{stack.label}</span>
            <span className="text-xs font-black">+{stack.amount} undi</span>
          </button>
        ))}
      </div>

      <p className="mt-2 text-[10px] font-black uppercase tracking-wide text-slate-800">
        {onBeat ? "Beat 4 — catat sekarang!" : `Beat ${currentBeat} — tunggu hit.`}
      </p>

      {counted > 0 && !exact && !over && (
        <button
          type="button"
          onClick={handleReset}
          className="mt-1 text-[10px] text-slate-600 hover:text-slate-900 underline font-bold cursor-pointer"
        >
          ↺ Reset kiraan semula
        </button>
      )}
    </div>
  );
}
