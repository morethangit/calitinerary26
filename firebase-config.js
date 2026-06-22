/* ============================================================================
   firebase-config.js — public web config for cross-device quest sync
   ----------------------------------------------------------------------------
   This is the ONLY setup step that needs your hands. ~10 minutes, free, no card.

   1. Go to  https://console.firebase.google.com  → "Add project".
      Name it anything (e.g. "disney-quest"). You can skip Google Analytics.

   2. In the project, click the web icon  </>  ("Add app").
      Register the app (nickname "disney"). Firebase shows you a config object
      that looks EXACTLY like the one below — copy your real values over the
      placeholders here.

   3. Left sidebar → Build → "Realtime Database" → "Create Database".
      Pick a location, start in "locked mode", then open the "Rules" tab and
      paste this, then Publish:

        {
          "rules": {
            "disney2026":      { ".read": true, ".write": true },
            "disney2026_test": { ".read": true, ".write": true }
          }
        }

      (These two paths are non-sensitive ride checkmarks. If you'd rather lock
       it down, enable Anonymous Auth under Build → Authentication and change
       each ".read"/".write" to  "auth != null".)

   4. Make sure  databaseURL  below is filled in (Firebase shows it on the
      Realtime Database page — it ends in  .firebasedatabase.app  or
      .firebaseio.com). Save this file, commit, deploy. Sync now works.

   These keys are SAFE to commit publicly — Firebase web config is not a secret;
   access is governed entirely by the rules above. If you leave the placeholders
   as-is, the guide simply runs in solo mode (localStorage) with no sync.
   ========================================================================== */

window.FIREBASE_CONFIG = {
  apiKey: "AIzaSyDlSEQohSnrsS2q7c-URzNhtecjbPY0Uao",
  authDomain: "disney-quest.firebaseapp.com",
  databaseURL: "https://disney-quest-default-rtdb.firebaseio.com",
  projectId: "disney-quest",
  appId: "1:130325549360:web:2a474b0d9a0598d25178f5",
};
