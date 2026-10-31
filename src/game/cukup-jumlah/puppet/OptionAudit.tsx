import { PuppetAvatar } from "./PuppetAvatar";
import type { PuppetConfig } from "./loadRig";
import {
  BROWS_F,
  CREATOR_EXPRESSIONS,
  EXPRESSIONS,
  EXTRAS,
  EYES,
  FACIAL_HAIR,
  FOOTWEAR,
  HAIR_F,
  HAIR_M,
  LOWERS,
  NOSES,
  SHAPES_F,
  SHAPES_M,
  TONES,
  hatsFor,
  outfitsFor,
  type Option,
} from "./options";

// QA sheet (/dev?lab=audit): every picker option side by side, at roughly the size the
// creator shows it on a phone, to catch options that look alike.

const M: PuppetConfig = {
  gender: "m",
  tone: "tone_4",
  faceShape: "oval",
  hair: "sidepart",
  headwear: null,
  outfit: "baju_melayu",
  lower: "songket_samping",
};
const F: PuppetConfig = { ...M, gender: "f", hair: "bun", outfit: "baju_kurung", lower: "sarong" };

function Row<T>({
  title,
  base,
  options,
  field,
}: {
  title: string;
  base: PuppetConfig;
  options: readonly Option<T>[];
  field: keyof PuppetConfig;
}) {
  return (
    <section className="mb-4" data-row={title}>
      <h2 className="mb-1 text-sm font-bold">{title}</h2>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <figure key={o.label} className="w-[120px] rounded bg-[#fbf3e4] p-1 text-center">
            <div className="relative h-[230px] w-full">
              <PuppetAvatar config={{ ...base, [field]: o.id }} label={o.label} />
            </div>
            <figcaption className="text-xs">{o.label}</figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}

export function OptionAudit() {
  return (
    <div className="min-h-dvh bg-[#e6d3ae] p-4 text-[#24170f]">
      <Row title="Mata (L)" base={M} options={EYES} field="eyes" />
      <Row title="Mata (P)" base={F} options={EYES} field="eyes" />
      <Row title="Kening (P)" base={F} options={BROWS_F} field="brows" />
      <Row title="Hidung (L)" base={M} options={NOSES} field="nose" />
      <Row title="Hidung (P)" base={F} options={NOSES} field="nose" />
      <Row title="Bentuk muka (L)" base={M} options={SHAPES_M} field="faceShape" />
      <Row title="Bentuk muka (P)" base={F} options={SHAPES_F} field="faceShape" />
      <Row title="Ekspresi (L)" base={M} options={EXPRESSIONS} field="expression" />
      <Row
        title="Ekspresi pencipta (P)"
        base={F}
        options={CREATOR_EXPRESSIONS}
        field="expression"
      />
      <Row title="Rambut (L)" base={M} options={HAIR_M} field="hair" />
      <Row title="Rambut (P)" base={F} options={HAIR_F} field="hair" />
      <Row title="Misai (L)" base={M} options={FACIAL_HAIR} field="facialHair" />
      <Row title="Aksesori (L)" base={M} options={EXTRAS} field="extra" />
      <Row
        title="Aksesori, kulit gelap (L)"
        base={{ ...M, tone: "tone_8" }}
        options={EXTRAS}
        field="extra"
      />
      <Row title="Hiasan kepala (L)" base={M} options={hatsFor("m")} field="headwear" />
      <Row title="Hiasan kepala (P)" base={F} options={hatsFor("f")} field="headwear" />
      <Row title="Baju (L)" base={M} options={outfitsFor("m")} field="outfit" />
      <Row title="Baju (P)" base={F} options={outfitsFor("f")} field="outfit" />
      <Row title="Seluar / kain (L)" base={M} options={LOWERS} field="lower" />
      <Row title="Kasut (L)" base={M} options={FOOTWEAR} field="footwear" />
      <Row title="Warna kulit (L)" base={M} options={TONES} field="tone" />
    </div>
  );
}
