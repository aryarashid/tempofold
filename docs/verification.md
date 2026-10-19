# Verification

This record is completed as release checks run. A successful syntax check alone does not establish browser behavior.

The automated suite checks example durations, Unicode JSON round trips, import limits, invalid input preservation, recovery eligibility and minimums, exact unresolved time, immutable plans, stale previews, full undo snapshots and timestamp-based timer behavior through pause, reload, background time and finish.

On 19 October 2026, `npm run check` passed all 16 tests under Node.js 26.9.0. A fresh reviewer approved the complete original implementation with no blockers. Three small fixes clarified failed-save wording, retained corrupt-storage recovery controls and named dialogs for assistive technology.

Chrome browser behavior checks passed for a delayed rehearsal, pause and paused refresh, exact 7-minute recovery, Apply from 60 to 53 minutes, Undo back to 60, and an impossible 20-minute recovery reporting 8 minutes unresolved. The real browser export matched the complete product-demo source agenda byte-for-field after parsing. Invalid pasted JSON preserved the current workshop. Imported HTML-looking titles and notes remained text with zero injected image or script elements.

File-chooser automation was blocked by the existing browser extension's file-access permission. No permission was changed. The tested paste import uses the same parser and replacement flow as file import. File size enforcement and UTF-8 limits were checked in the automated suite. Native file selection has not been tested by this automation.

Responsive checks found document widths exactly matching the 320- and 390-pixel viewports, with no page overflow. Enter opened the help dialog and Escape closed it. Visible labels identify protected, flexible, current, completed, paused and overtime states. This is a code and browser accessibility check, not an independent assistive-technology audit.

The print stylesheet and an actual browser-generated PDF were visually inspected. All six workshop blocks, notes, minimums and ending time fit without clipping on the first page. Screenshots are in [screenshots](./screenshots).

Cached offline reload was tested by stopping this project's local server and verifying that HTTP requests to it failed. Reload still rendered the current product-demo agenda and restored its running timer at the expected elapsed time. Pausing still worked. This verifies reloadable offline use after cache installation in the tested Chrome profile. It does not prove first-visit offline access or immunity to browser cache eviction.
