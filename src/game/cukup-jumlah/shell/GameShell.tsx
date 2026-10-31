import { useCallback, useEffect, useReducer, useRef, useState, type ReactNode } from "react";
import { BeatClock } from "../beat/beatClock";
import { loadOffsetMs } from "../beat/calibrationStore";
import type { Grade } from "../beat/timing";
import { Backstage } from "../creator/Backstage";
import { PARTIES, loadCandidate, type Candidate } from "../creator/candidate";
import type { ExpressionId } from "../puppet/loadRig";
import type { PuppetAnim } from "../puppet/motion";
import { PuppetAvatar } from "../puppet/PuppetAvatar";
import { Gunungan } from "../stage/Gunungan";
import { BallotBox, DepositEnvelope } from "../stage/Hud";
import { BeatPins, CutStamp, DalangBanner, Kelir, StageBox } from "../stage/Panggung";
import {
  SEAT_GOAL,
  TOTAL_SEATS,
  currentRound,
  gameReducer,
  practiceState,
  roundBars,
  type ActNo,
  type EndingId,
  type GameState,
  type RoundId,
} from "./flow";
import {
  ACT_FACTS,
  ACT_TITLES,
  ENDINGS,
  FACTS,
  ROUNDS,
  UI,
  fill,
  loadLang,
  saveLang,
  type FactId,
  type Lang,
} from "./strings";
import { microgameFor } from "./microgames";

// The new game shell (docs/GAME_PLAN.md §6, step 3): title → backstage → three acts →
// coalition talks if short → ending, all on the 9:16 kelir. Every round runs the
// tap-on-beat-4 stand-in until its real microgame is in microgames.ts.

const STAMP_MS = 1300;
const SWEEP_SWAP_MS = 650;
const SWEEP_MS = 1300;

const ENDING_FACE: Record<EndingId, ExpressionId> = {
  victory: "big_laugh",
  coalition: "smug_grin",
  opposition: "angry_shout",
  depositLebur: "crying_pout",
};

/** `practice` (dev only) skips straight to one round and replays it. */
export function GameShell({ practice = null }: { practice?: RoundId | null } = {}) {
  const [state, dispatch] = useReducer(gameReducer, practice, practiceState);
  const [lang, setLang] = useState<Lang>("ms");
  const [saved, setSaved] = useState<Candidate | null>(null);
  const [offsetMs, setOffsetMs] = useState(0);
  const [noAudio, setNoAudio] = useState(false);
  const clockRef = useRef<BeatClock | null>(null);

  // Storage is read after mount so the server render and first client render match.
  useEffect(() => {
    setLang(loadLang());
    setSaved(loadCandidate());
    setOffsetMs(loadOffsetMs());
  }, []);

  useEffect(() => () => void clockRef.current?.close(), []);

  /** Creates the audio clock; must run inside a tap so phones allow sound. */
  const ensureClock = useCallback(() => {
    if (clockRef.current) return true;
    const clock = BeatClock.create();
    if (!clock) {
      setNoAudio(true);
      return false;
    }
    clockRef.current = clock;
    return true;
  }, []);

  const switchLang = () => {
    const next = lang === "ms" ? "en" : "ms";
    setLang(next);
    saveLang(next);
  };

  const { phase } = state;

  if (phase.kind === "backstage") {
    return (
      <Backstage
        onStart={(candidate) => {
          setSaved(candidate);
          dispatch({ type: "cast", candidate });
        }}
      />
    );
  }

  return (
    <div className="panggung flex h-dvh flex-col items-center overflow-y-auto bg-[#1a0f08] px-4 py-3 text-[var(--cream)]">
      <header className="flex w-full max-w-[440px] items-center justify-between gap-2 pb-2">
        {phase.kind === "title" ? (
          <span />
        ) : (
          <button
            type="button"
            onClick={() => dispatch({ type: "toTitle" })}
            className="min-h-11 text-sm font-bold underline"
          >
            {UI.toTitle[lang]}
          </button>
        )}
        <button type="button" onClick={switchLang} className="min-h-11 text-sm font-bold underline">
          {UI.otherLang[lang]}
        </button>
      </header>

      <StageBox>
        <Kelir>
          {phase.kind === "title" && (
            <TitleScreen
              lang={lang}
              saved={saved}
              noAudio={noAudio}
              onPlay={() => ensureClock() && dispatch({ type: "play" })}
              onContinue={(candidate) => ensureClock() && dispatch({ type: "cast", candidate })}
            />
          )}
          {phase.kind === "actIntro" && (
            <ActIntro
              act={phase.act}
              lang={lang}
              noAudio={noAudio}
              onBegin={() => ensureClock() && dispatch({ type: "beginAct" })}
            />
          )}
          {(phase.kind === "round" || phase.kind === "coalition") &&
            state.candidate &&
            clockRef.current && (
              <RoundStage
                state={state}
                candidate={state.candidate}
                clock={clockRef.current}
                lang={lang}
                offsetMs={offsetMs}
                onDone={(success) => dispatch({ type: "roundDone", success })}
                onNext={() => dispatch({ type: "next" })}
              />
            )}
          {phase.kind === "ending" && state.candidate && (
            <EndingScreen
              ending={phase.ending}
              state={state}
              candidate={state.candidate}
              lang={lang}
              onAgain={() =>
                ensureClock() && dispatch({ type: "cast", candidate: state.candidate! })
              }
            />
          )}
        </Kelir>
      </StageBox>
    </div>
  );
}

function PaperButton({
  children,
  onClick,
  tone = "red",
}: {
  children: ReactNode;
  onClick: () => void;
  tone?: "red" | "cream";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-h-11 rounded-full px-[6cqw] py-[2.4cqw] font-display text-[5cqw] font-bold italic shadow-[0_4px_0_rgba(40,14,6,0.45)] active:translate-y-px ${
        tone === "red"
          ? "bg-[var(--sambal)] text-[var(--cream)]"
          : "bg-[var(--cream)] text-[var(--ink)] ring-2 ring-[var(--brass)]"
      }`}
    >
      {children}
    </button>
  );
}

function FactCard({ id, lang }: { id: FactId; lang: Lang }) {
  const fact = FACTS[id];
  return (
    <aside className="relative w-full rounded-sm bg-[#fbf3e4]/95 px-[4cqw] pt-[3.2cqw] pb-[3cqw] text-[var(--ink)] shadow-[0_6px_10px_rgba(40,14,6,0.3)]">
      <span
        className="beat-pin absolute top-[1cqw] left-1/2 h-[2.4cqw] w-[2.4cqw] -translate-x-1/2 rounded-full"
        aria-hidden="true"
      />
      <p className="font-tally text-[2.8cqw] tracking-[0.16em] text-[var(--sambal)] uppercase">
        {UI.fact[lang]}
      </p>
      <p className="copy-pretty mt-[0.6cqw] text-[3.8cqw] leading-snug font-semibold">
        {fact.text[lang]}
      </p>
      {fact.source && <p className="mt-[1cqw] text-[2.8cqw] text-[#6a4a32]">{fact.source[lang]}</p>}
    </aside>
  );
}

function NoAudio({ lang }: { lang: Lang }) {
  return (
    <p className="rounded-sm bg-[#fbf3e4]/90 px-[3cqw] py-[1.5cqw] text-center text-[3.4cqw] text-[var(--sambal)]">
      {UI.noAudio[lang]}
    </p>
  );
}

function TitleScreen({
  lang,
  saved,
  noAudio,
  onPlay,
  onContinue,
}: {
  lang: Lang;
  saved: Candidate | null;
  noAudio: boolean;
  onPlay: () => void;
  onContinue: (candidate: Candidate) => void;
}) {
  return (
    <div className="absolute inset-0 z-10 flex flex-col items-center px-[6%] pt-[12%] pb-[5%] text-center text-[var(--ink)]">
      <Gunungan className="pointer-events-none absolute top-[17%] left-1/2 h-[50%] w-auto -translate-x-1/2 opacity-25" />
      <h1 className="relative font-display text-[13cqw] leading-none font-bold italic tracking-tight text-[var(--sambal)] drop-shadow-[0_3px_0_rgba(251,243,228,0.9)]">
        {UI.title[lang]}
      </h1>
      <p className="relative mt-[2cqw] text-[3.8cqw] font-semibold">{UI.tagline[lang]}</p>

      {saved && (
        <div className="relative mt-[3cqw] h-[34%] w-[42%]">
          <PuppetAvatar config={saved.puppet} label={saved.name} />
        </div>
      )}

      <div className="relative mt-auto flex w-full flex-col items-center gap-[2.4cqw]">
        {noAudio && <NoAudio lang={lang} />}
        {saved ? (
          <>
            <PaperButton onClick={() => onContinue(saved)}>
              {fill(UI.continueAs[lang], { name: saved.name })}
            </PaperButton>
            <PaperButton onClick={onPlay} tone="cream">
              {UI.changeCandidate[lang]}
            </PaperButton>
          </>
        ) : (
          <PaperButton onClick={onPlay}>{UI.play[lang]}</PaperButton>
        )}
        <p className="copy-pretty mt-[1cqw] text-[2.7cqw] leading-snug text-[#5a3a1c]">
          {UI.disclaimer[lang]}
        </p>
      </div>
    </div>
  );
}

function ActIntro({
  act,
  lang,
  noAudio,
  onBegin,
}: {
  act: ActNo;
  lang: Lang;
  noAudio: boolean;
  onBegin: () => void;
}) {
  return (
    <div className="absolute inset-0 z-10 flex flex-col items-center gap-[3cqw] px-[7%] pt-[12%] pb-[6%] text-center">
      <DalangBanner call={fill(UI.act[lang], { n: act })} />
      <h2 className="font-display text-[8cqw] leading-tight font-bold text-[var(--ink)]">
        {ACT_TITLES[act][lang]}
      </h2>
      <div className="flex w-full flex-col gap-[3cqw]">
        {ACT_FACTS[act].map((id) => (
          <FactCard key={id} id={id} lang={lang} />
        ))}
      </div>
      <div className="mt-auto flex flex-col items-center gap-[2cqw]">
        {noAudio && <NoAudio lang={lang} />}
        <PaperButton onClick={onBegin}>{UI.startAct[lang]}</PaperButton>
      </div>
    </div>
  );
}

function Hud({ state, lang }: { state: GameState; lang: Lang }) {
  return (
    <>
      <div
        className="absolute top-[2.5%] left-[4%] z-20 flex gap-[1.2cqw]"
        role="img"
        aria-label={fill(UI.depositsLabel[lang], { n: state.deposits })}
      >
        {Array.from({ length: state.maxDeposits }, (_, i) => (
          <DepositEnvelope key={i} lost={i >= state.deposits} />
        ))}
      </div>
      <div
        className="absolute top-[2.5%] right-[4%] z-20"
        role="img"
        aria-label={fill(UI.seatsLabel[lang], { seats: state.seats, goal: SEAT_GOAL })}
      >
        <BallotBox seats={state.seats} goal={SEAT_GOAL} label={UI.seats[lang]} />
      </div>
    </>
  );
}

type Moment = { token: number; success: boolean; seatsGained: number };

function RoundStage({
  state,
  candidate,
  clock,
  lang,
  offsetMs,
  onDone,
  onNext,
}: {
  state: GameState;
  candidate: Candidate;
  clock: BeatClock;
  lang: Lang;
  offsetMs: number;
  onDone: (success: boolean) => void;
  onNext: () => void;
}) {
  const round = currentRound(state.phase)!;
  // Prefixed keys: these share one parent, and bare numbers from two counters can collide.
  const roundKey = `round-${state.attempt}`;
  const [beat, setBeat] = useState(0);
  const [anim, setAnim] = useState<PuppetAnim>("idle");
  const [face, setFace] = useState<ExpressionId | null>(null);
  const [moment, setMoment] = useState<Moment | null>(null);
  const [sweep, setSweep] = useState(0);
  const [timeLeft, setTimeLeft] = useState<{ share: number; seconds: number } | null>(null);
  const timers = useRef<number[]>([]);
  const later = (fn: () => void, ms: number) => timers.current.push(window.setTimeout(fn, ms));

  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), []);

  // A fresh round: calm face, no stamp.
  useEffect(() => {
    setFace(null);
    setMoment(null);
    setAnim("idle");
    setTimeLeft(null);
  }, [roundKey]);

  // When the reducer records the result, stamp it, then sweep the gunungan into the next round.
  const result = state.lastResult;
  useEffect(() => {
    if (!result) return;
    const token = performance.now();
    setMoment({ token, ...result });
    setFace(result.success ? "big_laugh" : "shocked_o");
    setAnim(result.success ? "hop" : "rod-wiggle");
    later(() => setSweep((n) => n + 1), STAMP_MS);
    later(onNext, STAMP_MS + SWEEP_SWAP_MS);
    // onNext is stable enough: it only dispatches.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result]);

  const onJudge = (grade: Grade) => {
    setAnim(grade === "miss" ? "rod-wiggle" : "hop");
    later(() => setAnim("idle"), 600);
  };

  const words = ROUNDS[round];
  const { Game, layout, howTo, beatPins } = microgameFor(round);
  // A full-stage game takes the puppet off until the result is in.
  const showPuppet = layout !== "full" || moment !== null;
  const party = PARTIES.find((p) => p.id === candidate.party);

  return (
    <>
      <Hud state={state} lang={lang} />

      <div className="absolute top-[15%] left-1/2 z-20 flex w-[90%] -translate-x-1/2 flex-col items-center gap-[1.6cqw]">
        <DalangBanner call={words.call[lang]} hint={words.hint[lang]} />
        {beatPins && <BeatPins beat={beat} />}
        {timeLeft !== null && !moment && <Fuse share={timeLeft.share} seconds={timeLeft.seconds} />}
        <span className="font-tally text-[3.2cqw] tracking-[0.12em] text-[var(--ink)] uppercase">
          {beat === 0 && !moment ? UI.ready[lang] : howTo[lang]}
        </span>
      </div>

      <div
        hidden={!showPuppet}
        className={`pointer-events-none absolute inset-x-0 bottom-0 flex h-[58%] items-end ${
          layout === "side" ? "justify-start pl-[1%]" : "justify-center"
        }`}
      >
        <div className={layout === "side" ? "relative h-[66%] w-[42%]" : "relative h-full w-[60%]"}>
          <PuppetAvatar
            config={face ? { ...candidate.puppet, expression: face } : candidate.puppet}
            anim={anim}
            label={candidate.name}
          />
        </div>
        {party && (
          <span
            className="absolute bottom-[3%] left-[4%] px-[2cqw] py-[0.6cqw] text-[3cqw] font-bold text-[var(--cream)]"
            style={{ backgroundColor: party.colour }}
          >
            {candidate.name}
          </span>
        )}
      </div>

      {/* Stays up under the result stamp so its final state (e.g. a signed form) shows. */}
      <Game
        key={roundKey}
        round={round}
        clock={clock}
        candidate={candidate}
        lang={lang}
        talent={candidate.talent}
        bars={roundBars(candidate.talent)}
        offsetMs={offsetMs}
        onBeat={setBeat}
        onTimeLeft={(share, seconds) => setTimeLeft({ share, seconds })}
        onJudge={onJudge}
        onFinish={onDone}
      />

      {moment && (
        <CutStamp
          key={`stamp-${moment.token}`}
          lines={
            moment.success
              ? moment.seatsGained > 0
                ? [UI.stampWin[lang], fill(UI.seatsGained[lang], { n: moment.seatsGained })]
                : [UI.stampWin[lang]]
              : [UI.stampLose1[lang], UI.stampLose2[lang]]
          }
          tone={moment.success ? "gold" : "red"}
          className="top-[50%] w-[70%]"
        />
      )}
      {sweep > 0 && (
        <div
          key={`sweep-${sweep}`}
          className="gunungan-sweep pointer-events-none absolute top-1/2 left-1/2 z-30 h-[96%] drop-shadow-[0_18px_18px_rgba(30,12,4,0.55)]"
          style={{ animationDuration: `${SWEEP_MS}ms` }}
        >
          <Gunungan className="h-full w-auto" />
        </div>
      )}
    </>
  );
}

/** A burning fuse running down to a firecracker: the time left in the round. */
function Fuse({ share, seconds }: { share: number; seconds: number }) {
  const pct = Math.max(0, Math.min(1, share)) * 100;
  const hot = share < 0.3;
  return (
    <div
      className="flex w-[84%] items-center gap-[2cqw]"
      role="timer"
      aria-label={`${seconds.toFixed(1)} s`}
    >
      <span className="text-[7cqw] leading-none" aria-hidden="true">
        🧨
      </span>
      <div className="relative h-[3cqw] flex-1 rounded-full bg-[#5a3a1c]/25" aria-hidden="true">
        <div
          className={`absolute inset-y-0 left-0 rounded-full ${
            hot ? "fuse-hot bg-[var(--sambal)]" : "bg-[linear-gradient(90deg,#8a5a2b,#c9963f)]"
          }`}
          style={{ width: `${pct}%` }}
        />
        <span
          className="pelita-flame absolute top-1/2 h-[6cqw] w-[4cqw] -translate-x-1/2 -translate-y-[75%] rounded-[50%_50%_45%_45%] bg-[radial-gradient(circle_at_50%_70%,#fff1c4,#ffb347_55%,#e4572e)]"
          style={{ left: `${pct}%` }}
        />
      </div>
      <span
        className={`w-[11cqw] text-right font-tally text-[5.4cqw] leading-none tabular-nums ${
          hot ? "text-[var(--sambal)]" : "text-[var(--ink)]"
        }`}
      >
        {seconds.toFixed(1)}
      </span>
    </div>
  );
}

function EndingScreen({
  ending,
  state,
  candidate,
  lang,
  onAgain,
}: {
  ending: EndingId;
  state: GameState;
  candidate: Candidate;
  lang: Lang;
  onAgain: () => void;
}) {
  const words = ENDINGS[ending];
  const won = ending === "victory" || ending === "coalition";
  return (
    <div className="absolute inset-0 z-10 flex flex-col items-center px-[6%] pt-[6%] pb-[5%] text-center text-[var(--ink)]">
      <CutStamp
        lines={[words.stamp[lang]]}
        tone={won ? "gold" : "red"}
        className="top-[13%] w-[74%]"
        stay
      />
      <div className="mt-[26%] h-[34%] w-[44%] shrink-0">
        <PuppetAvatar
          config={{ ...candidate.puppet, expression: ENDING_FACE[ending] }}
          anim={won ? "hop" : "idle"}
          label={candidate.name}
        />
      </div>
      <p className="mt-[2cqw] font-display text-[6cqw] leading-tight font-bold">{candidate.name}</p>
      <p className="copy-pretty text-[3.8cqw] font-semibold">{words.line[lang]}</p>
      <p className="mt-[1cqw] font-tally text-[3.4cqw] tracking-[0.08em]">
        {fill(UI.finalSeats[lang], { seats: state.seats, total: TOTAL_SEATS })}
      </p>
      <div className="mt-[3cqw] w-full">
        <FactCard id={words.fact} lang={lang} />
      </div>
      <div className="mt-auto pt-[3cqw]">
        <PaperButton onClick={onAgain}>{UI.playAgain[lang]}</PaperButton>
      </div>
    </div>
  );
}
