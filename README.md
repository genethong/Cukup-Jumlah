# Cukup Jumlah!

Satirical Malaysian political rhythm-microgame. Build your candidate, survive the fast-twitch crises of Nomination Day and the campaign trail, and race to 112 Parliament seats before losing your RM10,000 candidate cash deposit.

Play is one-thumb: groove to the 125 BPM kompang rhythm, tap on beat to screen candidate eligibility dossiers, stir photo-op char kuey teow, and shield VIPs from monsoon storms.

## Run it on your computer

You need [Node.js 22](https://nodejs.org/) (the version this project is tested with).

```bash
git clone https://github.com/genethong/Cukup-Jumlah.git
cd Cukup-Jumlah
npm install
npm run dev
```

When the terminal says the server is ready, open [http://localhost:8080](http://localhost:8080) in your browser.

Stop the server with Ctrl+C.

## Checks

These are the same commands that run on every pull request:

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

`npm test` includes a small check that the main game screen renders.

## How changes get in

`main` is the live game. Do not commit straight to it. See [CONTRIBUTING.md](CONTRIBUTING.md) for the branch and pull-request steps, including the preview link to playtest before merging.
