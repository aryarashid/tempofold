# TempoFold design

TempoFold helps a facilitator decide what can change when a workshop runs late. The agenda is the main workspace. A timer beside it shows the present block, the fixed ending and the projected ending. A recovery preview makes every proposed duration change visible before application.

The palette uses paper white #FFFFFF, navy #182C47, ocean #126478, lavender #EAE4F6, coral #BE3C27 and pale lime #DCECC0. Hanken Grotesk is bundled locally under the SIL Open Font License, with system sans-serif fallbacks. Tabular timer numerals carry the visual emphasis. Layout is left aligned, with a broad agenda and a narrower sticky timer. Mobile puts the timer before the agenda. Each block has a small duration rail, a title and explicit Protected or Flexible wording. Status never relies on color alone.

The mark uses three timeline bands. Two folded ends suggest flexible time; the final straight band represents the protected ending. The wordmark uses outlined Hanken Grotesk lettering for portable rendering. The product remains the first screen. Controls have visible keyboard focus, labeled inputs, descriptive names and at least 44 pixel touch targets. See the [brand guide](../brand/README.md) for usage and attribution.

The plan was checked against the brief. A landing-page hero would delay zero-setup use, so the first view is the actual planner with a synthetic agenda. Recovery opens as a semantic dialog with a before-and-after table. It cuts only future flexible blocks, in agenda order, never the current or completed block. The ending remains fixed during pauses, making delay visible instead of hiding it.
