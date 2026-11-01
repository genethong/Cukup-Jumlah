# Game-dev skills: how they map onto Cukup Jumlah!

Skills from [awesome-gamedev-agent-skills](https://github.com/gamedev-skills/awesome-gamedev-agent-skills)
(Apache-2.0, commit `19d93f9`) live in `.claude/skills/`. Installed: `router`, all 15
discipline skills, and the `prototype-fast` and `game-jam` workflows. The engine and genre
skills were left out: none of them matches this stack.

## Engine detection result

No catalog engine. There's no Phaser, PixiJS or three.js dependency. The game is a custom
React 19 + DOM/SVG + Web Audio engine on TanStack Start, so the router takes its
**custom-engine path** (`router/references/custom-engines.md`): keep this engine, and treat the
Godot/Unity code samples in the skills as concepts to rebuild on the APIs below. Never port to,
scaffold or install another engine.

## Engine contract

| Contract | Where it lives |
|----------|----------------|
| Build and run | `npm run dev` (port 8080), `npm run build`, `npm run typecheck`, `npm test` (node test + vitest) |
| Lifecycle | `shell/GameShell.tsx` owns the stage; each microgame is a component taking `MicrogameProps` (`shell/microgame.ts`) and calls `onFinish(success)` once. Registry: `shell/microgames.ts`. Run flow: `shell/flow.ts` (`gameReducer`) |
| Time | `beat/beatClock.ts`: an AudioContext clock with lookahead scheduling at 125 BPM (`beat/timing.ts`). Visuals and judging read this clock, never `Date.now()`. Bar 0 is the lead-in (`shell/leadIn.ts`) |
| Input | Pointer and key handlers inside each microgame. Taps are mapped to audio time with `eventToAudioTime` and graded with `judgeTap` / `hitWindows`. The player's latency offset is `beat/calibrationStore.ts` |
| Audio | Synthesised Web Audio voices in `beat/wayangSounds.ts`, the groove in `shell/music.ts`, routed through `clock.out` |
| UI / HUD | `stage/Hud.tsx`, `stage/Panggung.tsx`, `stage/stage.css`. Strings live in `shell/strings.ts` (BM/EN) |
| Art | Puppet rig in `puppet/` (`rig.json`, `loadRig.ts`) and webp parts in `public/puppet/`. Art direction: `docs/art/ART_BIBLE_PUPPET.md` |

## Which skill to load for which task

| Task here | Skill(s) |
|-----------|----------|
| New microgame or a vertical slice | `prototype-fast` (+ `game-feel`) |
| Juice: stamps, shake, hit-stop, puppet reactions | `game-feel` |
| Tap timing, hit windows, calibration, touch vs keys | `input-systems` |
| Gamelan groove, SFX mix, ducking, rival PA shouts | `audio-design` |
| HUD, menus, level select, mobile safe areas | `game-ui-ux` |
| Act pacing and difficulty curve across rounds | `level-design` |
| Puppet parts, party icons, a consistent wayang art set | `create-game-assets` (follow the art bible) |
| Rival or NPC behaviour (e.g. Perang Speaker's rival) | `game-ai` |
| Jank on low-end phones | `performance-optimization` |

The project pillars still win over any skill: legally factual, no 3R content, wayang look, and
each microgame keeps its own mechanic.
