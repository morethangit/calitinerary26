# Deployment notes (read this before saying "done")

**Vercel deploys from `main`.** This repo is a plain static site with no build
step, and Claude Code sessions develop on feature branches per the harness's
instructions. A fix isn't live — on Chrome *or* iOS — until it's actually
merged into `main` and Vercel redeploys. Pushing a feature branch alone changes
nothing on the production URL. If a session ends with changes only on a
feature branch, say so explicitly and merge to `main` (or ask first) before
calling a bug "fixed."

**Bump the service worker's cache version on every deploy that touches a
cached file.** `sw.js`'s `CORE` array precaches `index.html`, `app.js`,
`styles.css`, `data.enc.js`, `config.js`, `weather.js`, `manifest.webmanifest`,
the Disney Quest files, etc. The `install`/`activate` handlers only purge old
caches and fetch fresh copies when `sw.js` itself changes bytes (browsers skip
the update check otherwise). So: whenever you edit any file in `CORE`, also
bump the `CACHE` version string in `sw.js` (e.g. `"parkday-v7"` ->
`"parkday-v8"`) in the same change, or already-installed clients will keep
serving stale cached assets indefinitely (`fetch` handler is cache-first with
background revalidation — `hit || net` — so a stale hit wins the race every
time until the cache entry itself is replaced).

**iOS Home Screen ("Add to Home Screen") apps are extra sticky about this.**
They run in an isolated storage/cache/service-worker container separate from
Safari tabs, so they lag behind real Safari and are slower to pick up new
deploys and cache-version bumps. If someone reports "it works in the browser
but not as the iOS home screen app," check (in this order): (1) is the fix
actually merged to `main` and deployed, (2) was the SW cache version bumped,
(3) has the home screen icon been reopened at least once since the deploy
(the first reopen after a bump is what triggers the refetch).
