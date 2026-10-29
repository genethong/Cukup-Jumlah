# Contributing to Cukup Jumlah!

This is the only way changes get into the game. `main` is protected. Nobody commits straight to it, including the owner.

Every change lives on its own branch, goes through a pull request, and gets a preview website. The owner plays that preview, then merges.

## Before you start

Get the latest game first. If you skip this, your branch is built on an old copy and the pull request will be messy.

```bash
git checkout main
git pull origin main
```

## Make a branch

Pick a short name that says what you are changing. Use a new branch every time. Do not reuse an old one, and do not use `main`.

```bash
git checkout -b my-change-name
```

Example: `git checkout -b fix-deposit-timer`

## Save your work and upload the branch

After you have changed the files:

```bash
git add .
git commit -m "Say what you changed, in one sentence"
git push -u origin my-change-name
```

Replace `my-change-name` with the branch you created.

Push the branch. Never run `git push origin main`.

## Open a pull request

On GitHub, open a pull request from your branch into `main`. One change, one pull request.

GitHub Actions will install dependencies, then run the type check, the linter, the tests, and a production build. Wait until those checks are green.

## Play the preview, then merge

This repo already has a `vercel.json`. Once the GitHub repo is connected to Vercel, each pull request gets its own preview website. The link shows up on the pull request (a comment from Vercel, or a check named something like "Vercel").

The owner opens that preview, plays the game, and only then clicks **Merge**.

If the pull request has no preview link, Vercel is not connected yet. The owner does this once:

1. Sign in at [vercel.com](https://vercel.com).
2. Click **Add New… → Project**.
3. Import the GitHub repo `genethong/Cukup-Jumlah`.
4. Leave the settings as they are (`vercel.json` already sets the install command) and deploy.

After that, new pull requests get a preview automatically. The owner does not need to deploy by hand.

## Leave these out

The game does not have accounts, a database, or multiplayer. Those starter pieces were removed on purpose. Do not add them back unless the owner asks.

## Starting the next change

Always begin from a fresh `main`. Do not stack new work on a branch that was already merged.

```bash
git checkout main
git pull origin main
git checkout -b the-next-change
```
