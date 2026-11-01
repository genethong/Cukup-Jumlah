import { useRef, useState } from "react";
import { gendangHit, gendangMiss, paperSlap } from "../../beat/wayangSounds";
import type { MicrogameProps } from "../microgame";
import { GAME_TEXT, type Lang } from "../strings";
import { useRound } from "../useRound";
import {
  FIELDS,
  FORMS_NEEDED,
  check,
  dealForms,
  deskVerdict,
  mistakesAllowed,
  type Desk,
  type FieldId,
  type Form,
} from "./semakRules";

const T = GAME_TEXT.semak;

export function SemakBorang(props: MicrogameProps) {
  const { clock, candidate, lang, talent, onJudge } = props;
  const allowed = mistakesAllowed(talent === "mesra_rakyat");

  const [forms] = useState(() => dealForms());
  const [desk, setDesk] = useState<Desk>({ checked: 0, mistakes: 0 });
  const [mark, setMark] = useState<{ field: FieldId; right: boolean; n: number } | null>(null);
  const deskRef = useRef(desk);

  const { live, outcome, playing, end, later } = useRound(props, ({ t, leftS }) => {
    const v = deskVerdict(deskRef.current, allowed, leftS <= 0);
    if (v === "lost") {
      gendangMiss(clock.ctx, clock.out, t);
      end(false);
    }
  });

  const tapField = (field: FieldId) => {
    if (!playing() || mark?.right) return;
    const form = forms[deskRef.current.checked]!;
    const { desk: next, right } = check(deskRef.current, form, field);
    const t = clock.ctx.currentTime;
    setMark({ field, right, n: Date.now() });
    if (right) {
      gendangHit(clock.ctx, clock.out, t, true);
      onJudge("perfect");
      // Show the fix for a moment, then the next form slides in.
      later(() => {
        deskRef.current = next;
        setDesk(next);
        setMark(null);
        paperSlap(clock.ctx, clock.out, clock.ctx.currentTime);
        if (deskVerdict(next, allowed, false) === "won") end(true);
      }, 420);
      return;
    }
    deskRef.current = next;
    setDesk(next);
    gendangMiss(clock.ctx, clock.out, t);
    onJudge("miss");
    if (deskVerdict(next, allowed, false) === "lost") end(false);
  };

  const form = forms[Math.min(desk.checked, forms.length - 1)]!;

  return (
    <div className="absolute inset-0 z-10 select-none">
      <div className="pointer-events-none absolute top-[40%] left-[4%] rounded-sm bg-[#2b2522]/85 px-[2cqw] py-[0.5cqw] font-tally text-[3.4cqw] tracking-[0.06em] whitespace-nowrap text-[var(--cream)] uppercase">
        {T.count[lang]} {desk.checked}/{FORMS_NEEDED}
      </div>

      {/* The forms still to check, peeking out under the one on top. */}
      {Array.from({ length: Math.max(0, FORMS_NEEDED - desk.checked - 1) }, (_, i) => (
        <div
          key={`under-${i}`}
          className="absolute top-[46%] right-[6%] bottom-[3%] left-[6%] rounded-[1cqw] bg-[#efe6d2] shadow-[0_1cqw_1.4cqw_rgba(40,14,6,0.3)]"
          style={{
            transform: `translate(${(i + 1) * 1.2}cqw, ${(i + 1) * 1.2}cqw) rotate(${(i + 1) * 1.2}deg)`,
          }}
        />
      ))}

      {live && desk.checked < FORMS_NEEDED && (
        <FormCard
          key={`form-${desk.checked}`}
          form={form}
          name={candidate.name}
          lang={lang}
          mark={mark}
          onTap={tapField}
        />
      )}

      {outcome && (
        <div className="combo-pop pointer-events-none absolute top-[55%] left-1/2 z-30 w-[80%] -translate-x-1/2 rounded-sm bg-[#efe1c3] px-[3cqw] py-[1.4cqw] text-center text-[var(--ink)] shadow-[0_6px_12px_rgba(40,14,6,0.4)]">
          <p className="font-display text-[5.4cqw] font-bold italic">
            {outcome === "won" ? T.won[lang] : T.lost[lang]}
          </p>
          <p className="mt-[0.6cqw] text-[3.2cqw] leading-tight">{T.fact[lang]}</p>
        </div>
      )}
    </div>
  );
}

/** A nomination form with one field wrong. Each field is a tap target. */
function FormCard({
  form,
  name,
  lang,
  mark,
  onTap,
}: {
  form: Form;
  name: string;
  lang: Lang;
  mark: { field: FieldId; right: boolean; n: number } | null;
  onTap: (f: FieldId) => void;
}) {
  const value = (f: FieldId): { text: string; blank?: boolean } => {
    const bad = form.wrong === f;
    switch (f) {
      case "name":
        return { text: name };
      case "age":
        return { text: String(form.age) };
      case "citizen":
        return { text: bad ? T.no[lang] : T.yes[lang] };
      case "seat":
        return { text: T.seatName[lang] };
      case "signature":
        return bad ? { text: "", blank: true } : { text: "✍️" };
      case "receipt":
        return bad ? { text: "—" } : { text: "No. 004512" };
    }
  };
  return (
    <div className="press-in absolute top-[46%] right-[6%] bottom-[3%] left-[6%] flex flex-col rounded-[1cqw] bg-[#fbf6ea] px-[3cqw] py-[2cqw] text-[var(--ink)] shadow-[0_1.4cqw_2cqw_rgba(40,14,6,0.4)]">
      <p className="border-b-[0.5cqw] border-[var(--ink)] pb-[0.8cqw] text-center font-display text-[4.4cqw] font-bold">
        {T.title[lang]}
      </p>
      <div className="mt-[1cqw] flex flex-1 flex-col justify-around">
        {FIELDS.map((f) => {
          const v = value(f);
          const marked = mark?.field === f;
          return (
            <button
              key={f}
              type="button"
              onPointerDown={(e) => {
                e.preventDefault();
                onTap(f);
              }}
              className={`relative flex items-center justify-between rounded-[0.8cqw] border-b-[0.3cqw] border-dashed border-[#cdbd9f] px-[1.4cqw] py-[1cqw] text-left ${
                marked && !mark.right ? "ears-shake bg-[#e4572e]/15" : ""
              }`}
              style={{ touchAction: "manipulation" }}
            >
              <span className="font-tally text-[3.2cqw] tracking-[0.04em] text-[#6b6965] uppercase">
                {T[f][lang]}
              </span>
              {v.blank ? (
                <span className="h-[5cqw] w-[24cqw] rounded-[0.6cqw] border-[0.4cqw] border-dashed border-[#a8a29a]" />
              ) : (
                <span className="max-w-[60%] truncate font-display text-[4cqw] font-bold">
                  {v.text}
                </span>
              )}
              {marked && (
                <span
                  key={`m-${mark.n}`}
                  className={`combo-pop absolute -top-[1cqw] right-[1cqw] rounded-sm px-[1.2cqw] font-display text-[3.2cqw] font-bold italic ${
                    mark.right
                      ? "bg-[#3f8f4f] text-[#fbf6ea]"
                      : "bg-[var(--sambal)] text-[var(--cream)]"
                  }`}
                >
                  {mark.right ? T.fixed[lang] : T.fine[lang]}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
