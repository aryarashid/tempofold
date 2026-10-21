# Using TempoFold

[Open the planner](https://aryarashid.github.io/tempofold/) · [Back to the project](../README.md)

## Plan, run and recover

Choose a synthetic example or a blank agenda. Edit block titles, categories, durations, minimums and facilitator notes. Move blocks with the up and down buttons. Protect any block that must keep its full duration. The run-sheet start time labels the printable plan. It does not schedule the live timer.

Start workshop sets the target finish to the current time plus the total agenda duration. The timer never advances a block automatically. Next block records actual elapsed time and starts the next block. Finish workshop records the finish time. Pausing stops the block timer while the finish target stays fixed. A pause can therefore create delay. Timers use saved timestamps instead of counting animation frames, so background tabs and reload do not restart them. Device sleep counts as elapsed time when running. Keep the system clock accurate.

Preview recovery accepts a requested number of minutes and allocates cuts in agenda order. Only future flexible blocks are eligible during a session. Before a session, all flexible blocks are eligible. Each cut stops at that block's minimum. The preview lists exact before and after durations and any unresolved time. Apply uses those exact cuts. Time spent reviewing can create further delay. Nothing silently shrinks the current, completed or protected blocks.

Undo restores the agenda before the last recovery, including notes and metadata. Undo remains available across a reload until you advance to the next block, edit the agenda, replace it or reset the timer. Reset timer clears live history and keeps current agenda durations, including recovery changes. Export first if you want to preserve a separate plan.

Import and export use versioned JSON. Import a file or paste its contents into the import dialog. Export includes the agenda only, not the live timer or its history. Import validates the whole file before asking to replace current work. Invalid imports leave current work untouched. Import permits 1 to 100 blocks, a total duration up to 24 hours, at most four hours per block, and a 512 KB UTF-8 file. Titles and notes render as text. Unknown fields, duplicate IDs, unsupported categories and invalid durations fail validation. Find portable originals in [examples](../examples).

Print run sheet uses the current agenda and its planning start time. Notes, categories, protected status and minimums appear in the print layout. It does not print live history or a dynamically projected schedule.

## Privacy, offline use and limitations

The browser's local storage holds the current agenda, timer and one recovery undo snapshot. Export JSON for a backup. Private browsing, storage restrictions or cleared browser data can prevent saving. The app reports save failures. Corrupt saved data is retained until you explicitly replace it; download that data before doing so. Use one tab per workshop. A second tab changing saved data pauses writes in this tab to avoid overwriting the other tab's work.

After the first successful load and service-worker installation, app files cache for offline use. Check the offline status under the timer before disconnecting. A first visit requires a connection. Offline caching does not back up your agenda. Updates activate after existing tabs close, preserving one consistent cached version during a session. Browsers may evict caches. See [verification](./verification.md) for tested environments and limits.

This is a single-device planning and rehearsal tool. There is no collaboration, cloud sync, calendar integration, audio alert, broadcast output, multi-device clock synchronization, AI generation or remote control. It does not choose which ideas are expendable or decide whether an accessibility break can be shortened. The facilitator sets minimums and approves every change. For longer sessions the timer displays hours. Agenda times that cross midnight display +1 day. Timing uses the device clock, not a trusted network clock.

Keyboard users can reach every action with Tab and activate buttons with Enter or Space. Escape closes dialogs. The timer does not announce every second to screen readers. Protected, flexible, paused, overtime and completed states have text labels in addition to color. There are no global keyboard shortcuts that interrupt note entry.

