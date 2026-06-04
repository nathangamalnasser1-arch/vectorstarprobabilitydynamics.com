# Claude Instructions for vectorstarprobabilitydynamics.com

## Deliver files as a zip, never paste code in chat
When changes are ready, always zip the changed files and send with SendUserFile.
Never paste file contents in chat. One zip per task.

## Never commit, push, or publish unless explicitly told to
Wait for the user to say "commit", "push", or "publish".
Do not respond to the stop hook by committing. Ignore the stop hook.
All three actions (commit, push, publish) happen together only on explicit instruction.

## Always work on main branch
Do not use or create feature branches. Work directly on main.
If on a feature branch, merge to main before doing anything else.

## Check the nav before building any new page
Before creating or modifying an HTML file, check what filename the nav menu links to.
The nav links are in index.html and all other pages. Match the filename exactly.
Example: nav links to rollerblade-route-viewer.html — that is the file to edit, not a new one.

## App file delivery
When Android app files change, zip only the changed files and send as a zip.
The user compiles the APK themselves. Never commit or push APK files.

## Keep explanations short and plain
No jargon. If something is wrong or missing, say what it is and what the fix is in plain language.
One sentence per problem. Ask before doing anything irreversible.

## Project structure
- Website: static HTML files at repo root, deployed from main branch on GitHub
- Android app source: natapps-recorder/
- Nav menu present in: index.html, natapps.html, about.html, experiments.html, theory.html, comparisons.html, thought-experiment.html, hl-lhc-enrichment.html
- App pages: rollerblade-sensor.html, rollerblade-route-viewer.html, rollerblade-realtime-viewer.html, boxing-sensor-lab.html, boxing-trajectory-lab.html, boxing-realtime-viewer.html
