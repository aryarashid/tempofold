# Architecture and deployment

TempoFold is a static HTML, CSS and JavaScript app. It has no build step, runtime package dependency or backend. `src/core.js` contains pure agenda validation, timestamp-based timer transitions, projected finish and deterministic recovery. `src/app.js` connects that logic to labeled browser controls, native dialogs, local storage, JSON files and the print sheet.

The agenda schema stores integer seconds, explicit minimums, protected flags, categories and notes. Imports validate the whole document before replacement. Text renders through text nodes. The live timer stores an elapsed-time accumulator and a running timestamp. Paused time does not advance that block's timer, but the finish target stays fixed. Next is always an explicit action. Recovery considers future flexible blocks in agenda order and never crosses their minimums. One undo snapshot is retained until the next block or another agenda change.

`sw.js` installs a versioned cache containing the complete app, its logo and its self-hosted font. New versions wait for existing tabs to close. Brand and marketplace galleries are optional presentation assets and are not required for offline timing. They do not upload or track workshop content.

Use Node.js 22 or later and run `npm ci`, `npm run check`, then `npm start`. The development server binds to 127.0.0.1. For deployment, serve the repository's static files over HTTPS. GitHub Pages publishes this repository's main branch. Relative asset URLs support the `/tempofold/` project path. The absolute social preview URL points to the public demo's gallery cover.

To deploy a new version, run the checks, review the complete diff, increment the package and cache versions when app files change, and publish the reviewed commit. Verify the rendered app at the deployed URL. Keep the previous tag for rollback. Existing browser tabs keep their cached version until closed. Do not erase user local storage during an update.
