import { useEffect, useRef, useState } from "react";
import { Download, Share2, Check, Sparkles } from "lucide-react";
import type { CandidateProfile } from "./types";
import { PARTIES } from "./types";
import { renderPortrait } from "./puppet/PuppetAvatar";

interface ShareCardProps {
  profile: CandidateProfile;
  actNumber: number;
  actTitle: string;
  seatsWon: number;
  livesRemaining: number;
  onContinue?: () => void;
}

export function ActShareCardModal({
  profile,
  actNumber,
  actTitle,
  seatsWon,
  livesRemaining,
  onContinue,
}: ShareCardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [copied, setCopied] = useState(false);
  const [dataUrl, setDataUrl] = useState<string>("");

  const party = PARTIES[profile.party];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Dimensions: 9:16 vertical story format (540x960)
    const W = 540;
    const H = 960;
    canvas.width = W;
    canvas.height = H;

    // 1. BACKGROUND: Deep Navy/Slate texture with gold/party accents
    const gradient = ctx.createLinearGradient(0, 0, 0, H);
    gradient.addColorStop(0, "#090D16");
    gradient.addColorStop(0.5, "#0F172A");
    gradient.addColorStop(1, "#020617");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, W, H);

    // Decorative retro grid lines
    ctx.strokeStyle = "rgba(255, 255, 255, 0.03)";
    ctx.lineWidth = 1;
    for (let x = 0; x < W; x += 30) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, H);
      ctx.stroke();
    }
    for (let y = 0; y < H; y += 30) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
    }

    // 2. ORNATE OUTER BORDER (Gold Certificate Style)
    ctx.strokeStyle = "#F59E0B"; // Gold
    ctx.lineWidth = 4;
    ctx.strokeRect(20, 20, W - 40, H - 40);

    ctx.strokeStyle = "rgba(245, 158, 11, 0.4)";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(28, 28, W - 56, H - 56);

    // Corner decorative corner brackets
    const drawCorner = (cx: number, cy: number) => {
      ctx.fillStyle = "#F59E0B";
      ctx.fillRect(cx - 6, cy - 6, 12, 12);
    };
    drawCorner(28, 28);
    drawCorner(W - 28, 28);
    drawCorner(28, H - 28);
    drawCorner(W - 28, H - 28);

    // 3. HEADER BADGE & LOGO
    ctx.textAlign = "center";
    ctx.fillStyle = "#F59E0B";
    ctx.font = "bold 13px sans-serif";
    ctx.fillText("CUKUP JUMLAH! · PERMAINAN PARODI", W / 2, 65);

    ctx.fillStyle = "#FFFFFF";
    ctx.font = "900 26px sans-serif";
    ctx.fillText(
      actNumber === 1
        ? "WATIKAH KELAYAKAN CALON"
        : actNumber === 3
          ? seatsWon >= 112
            ? "WATIKAH KERAJAAN BARU"
            : "PENYATA KIRAAN UNDI"
          : "POSTER KEMPEN RASMI YB",
      W / 2,
      105
    );

    ctx.fillStyle = "#94A3B8";
    ctx.font = "600 13px sans-serif";
    ctx.fillText(
      actNumber === 1
        ? "PILIHAN RAYA UMUM KE-16 (GE16)"
        : actNumber === 3
          ? seatsWon >= 112
            ? "MAJORITI DEWAN RAKYAT · CUKUP 112 JUMLAH!"
            : "KEPUTUSAN PENGIRAAN UNDI"
          : "JUARA TURUN PADANG & PHOTO-OP GE16",
      W / 2,
      128
    );

    // 4. CERTIFICATE MAIN CARD AREA
    ctx.fillStyle = "rgba(15, 23, 42, 0.85)";
    ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(45, 150, W - 90, 520, 20);
    ctx.fill();
    ctx.stroke();

    // 5. CANDIDATE PUPPET (head drawn in below, once its layers load)
    // Avatar pedestal/shadow
    ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
    ctx.beginPath();
    ctx.ellipse(W / 2, 380, 80, 18, 0, 0, Math.PI * 2);
    ctx.fill();


    // 6. CANDIDATE NAME & DETAILS
    ctx.textAlign = "center";
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "900 24px sans-serif";
    ctx.fillText(profile.name.toUpperCase(), W / 2, 425);

    // Party pill badge
    const pColor = party.themeColor === "#F8FAFC" ? "#475569" : party.themeColor;
    ctx.fillStyle = pColor;
    ctx.beginPath();
    ctx.roundRect(W / 2 - 110, 442, 220, 32, 16);
    ctx.fill();

    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 13px sans-serif";
    ctx.fillText(
      `${party.symbolEmoji} ${party.name} - ${party.fullName}`,
      W / 2,
      463
    );

    // Stats Grid inside Certificate
    ctx.fillStyle = "rgba(2, 6, 23, 0.7)";
    ctx.beginPath();
    ctx.roundRect(65, 495, W - 130, 155, 14);
    ctx.fill();

    ctx.textAlign = "left";
    ctx.font = "12px sans-serif";
    ctx.fillStyle = "#94A3B8";

    // Row 1: Kerusi
    ctx.fillText("Kerusi Parlimen Ditandingi:", 85, 528);
    ctx.textAlign = "right";
    ctx.fillStyle = "#F59E0B";
    ctx.font = "bold 14px monospace";
    ctx.fillText(`${seatsWon} / 112 Kerusi`, W - 85, 528);

    // Row 2: Stats
    ctx.textAlign = "left";
    ctx.font = "12px sans-serif";
    ctx.fillStyle = "#94A3B8";
    ctx.fillText(
      actNumber === 1
        ? "Status Deposit SPR (RM10k):"
        : actNumber === 3
          ? "Undi Sah Pada Borang 14:"
          : "Kuey Teow Digoreng:",
      85,
      562
    );
    ctx.textAlign = "right";
    ctx.fillStyle = "#10B981";
    ctx.font = "bold 14px sans-serif";
    ctx.fillText(
      actNumber === 1
        ? livesRemaining > 0
          ? "LULUS BAYAR ✅"
          : "HANGUS ❌"
        : actNumber === 3
          ? "TEPAT 112 ✅"
          : "14 PINGGAN 🍜",
      W - 85,
      562
    );

    // Row 3: Status Perkara 47/48 vs Kempen
    ctx.textAlign = "left";
    ctx.font = "12px sans-serif";
    ctx.fillStyle = "#94A3B8";
    ctx.fillText(
      actNumber === 1
        ? "Kelayakan Perkara 47 & 48:"
        : actNumber === 3
          ? "Agen Pengiraan Undi:"
          : "Had Masa Kempen (11:59PM):",
      85,
      596
    );
    ctx.textAlign = "right";
    ctx.fillStyle = "#38BDF8";
    ctx.font = "bold 13px sans-serif";
    ctx.fillText(
      actNumber === 1
        ? "SAH & BEBAS MUFLIS 📜"
        : actNumber === 3
          ? "HADIR & SAH 🗳️"
          : "PATUH PERATURAN SPR ⏱️",
      W - 85,
      596
    );

    // Row 4: Gelaran Pencapaian
    ctx.textAlign = "left";
    ctx.font = "12px sans-serif";
    ctx.fillStyle = "#94A3B8";
    ctx.fillText("Gelaran Pencapaian:", 85, 630);
    ctx.textAlign = "right";
    ctx.fillStyle = "#E2E8F0";
    ctx.font = "bold 13px sans-serif";
    ctx.fillText(
      actNumber === 1
        ? "Calon Harapan Rakyat ⭐"
        : actNumber === 3
          ? seatsWon >= 112
            ? "Majoriti Dewan Rakyat 🏛️"
            : "Tokoh Rundingan Kerusi 🤝"
          : "Juara Photo-Op Pasar Malam 🏆",
      W - 85,
      630
    );

    // 7. BIG OFFICIAL PARODY STAMP (Rotated)
    ctx.save();
    ctx.translate(W - 130, 240);
    ctx.rotate((12 * Math.PI) / 180);

    const stampColor = actNumber === 3 && seatsWon >= 112 ? "#16A34A" : "#DC2626";
    ctx.strokeStyle = stampColor;
    ctx.lineWidth = 4;
    ctx.strokeRect(-80, -25, 160, 50);

    ctx.fillStyle = stampColor;
    ctx.textAlign = "center";
    ctx.font = "900 18px sans-serif";
    ctx.fillText(actNumber === 3 && seatsWon >= 112 ? "CUKUP JUMLAH!" : "DILULUSKAN!", 0, 2);

    ctx.font = "bold 9px sans-serif";
    ctx.fillText("PARODI · BUKAN DOKUMEN RASMI", 0, 16);
    ctx.restore();

    // 8. EDUCATIONAL CONSTITUTIONAL FOOTNOTE
    ctx.textAlign = "center";
    ctx.fillStyle = "#E2E8F0";
    ctx.font = "bold 13px sans-serif";
    ctx.fillText(
      actNumber === 3
        ? "🏛️ Celik Perlembagaan (Bab 3: Perkara 43)"
        : "🏛️ Celik Perlembagaan (Bab 1)",
      W / 2,
      705
    );

    ctx.fillStyle = "#94A3B8";
    ctx.font = "11px sans-serif";
    ctx.fillText(
      actNumber === 3
        ? "Perkara 43(2)(a): Pelantikan PM yang mendapat kepercayaan majoriti dewan."
        : "Perkara 47: Syarat calon mesti warganegara berumur 18 tahun ke atas.",
      W / 2,
      728
    );
    ctx.fillText(
      actNumber === 3
        ? "112 daripada 222 kerusi ialah majoriti mudah Dewan Rakyat."
        : "Deposit RM10,000 selamat selagi raih lebih 1/8 undi.",
      W / 2,
      746
    );

    // 9. FOOTER CALL TO ACTION
    ctx.fillStyle = "#F59E0B";
    ctx.font = "900 16px sans-serif";
    ctx.fillText("MAIN 'CUKUP JUMLAH!' SEKARANG", W / 2, 800);

    ctx.fillStyle = "#64748B";
    ctx.font = "11px sans-serif";
    ctx.fillText("Misi Kumpul 112 Kerusi Sebelum Hilang Deposit", W / 2, 822);
    ctx.fillText("https://cukupjumlah.my (Parodi & Sivik PRU16)", W / 2, 842);

    const cache = () => {
      try {
        setDataUrl(canvas.toDataURL("image/png"));
      } catch (e) {
        console.error(e);
      }
    };
    cache();

    // The puppet's head: neck pin (256, 456) of its 512 canvas lands on the pedestal.
    let cancelled = false;
    renderPortrait(profile.puppet)
      .then((head) => {
        if (cancelled) return;
        const size = 225;
        ctx.drawImage(head, W / 2 - size / 2, 375 - (456 / 512) * size, size, size);
        cache();
      })
      .catch(() => {
        // Keep the card without the head if a layer fails to load.
      });
    return () => {
      cancelled = true;
    };
  }, [profile, actNumber, actTitle, seatsWon, livesRemaining]);

  const handleDownload = () => {
    if (!dataUrl) return;
    const link = document.createElement("a");
    link.download = `Watikah-YB-${profile.name.replace(/\s+/g, "_")}.png`;
    link.href = dataUrl;
    link.click();
  };

  const handleShare = async () => {
    const text = `Aku dah sah jadi calon Parlimen mewakili ${party.fullName} (${party.name}) 🗳️! Korang jangan undi rosak ek. Jom main Cukup Jumlah!`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Watikah Kelayakan Calon YB",
          text,
          url: window.location.href,
        });
      } catch (err) {
        console.log(err);
      }
    } else {
      // Fallback copy to clipboard
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-sm w-full p-4 md:p-5 shadow-2xl space-y-4 my-auto">
        <div className="text-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-full text-xs font-bold uppercase tracking-wider mb-1.5">
            <Sparkles className="w-3.5 h-3.5" /> Pencapaian Bab {actNumber} Dibuka!
          </div>
          <h2 className="text-xl font-black text-white">Kad Pencapaian Rasmi YB</h2>
          <p className="text-xs text-slate-400">
            Simpan atau kongsikan watikah calon anda ke WhatsApp Status & IG Story!
          </p>
        </div>

        {/* Live Canvas Preview */}
        <div className="flex justify-center bg-slate-950 p-2 rounded-2xl border border-slate-800 shadow-inner">
          <canvas
            ref={canvasRef}
            className="w-full max-w-[280px] h-auto rounded-xl shadow-lg border border-slate-700/60"
          />
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            onClick={handleDownload}
            className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl border border-slate-700 flex items-center justify-center gap-1.5 transition cursor-pointer"
          >
            <Download className="w-4 h-4 text-amber-400" /> Simpan Imej
          </button>

          <button
            onClick={handleShare}
            className="py-2.5 px-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-md flex items-center justify-center gap-1.5 transition cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-slate-950" /> Disalin!
              </>
            ) : (
              <>
                <Share2 className="w-4 h-4" /> Kongsi Status
              </>
            )}
          </button>
        </div>

        {onContinue && (
          <button
            onClick={onContinue}
            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition cursor-pointer"
          >
            Teruskan Ke Bab 2 (Kempen) ➔
          </button>
        )}
      </div>
    </div>
  );
}
