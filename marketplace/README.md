# TempoFold promotional and listing kit

The five primary images show the product through large, cropped views of the actual app. A sixth panel explains protected time. Three additional graphics fit square, landscape and portrait placements. All app content is synthetic. The numbers in the recovery example describe that example, not a customer result or benchmark.

[View the product gallery](https://aryarashid.github.io/tempofold/marketplace/) or [open the contact sheet](https://aryarashid.github.io/tempofold/marketplace/contact-sheet.jpg). [Download the complete promotional kit](https://github.com/aryarashid/tempofold/releases/download/marketing-kit-v1/tempofold-promotional-kit-v1.zip).

## Five primary listing images

Each JPEG is exactly 1600 × 900 and below 5 MB. Upload these five files for the stated Z2H image format. The protected-time image below is an additional promotional option, not a sixth marketplace slot.

| File | What it shows |
| --- | --- |
| images/01-cover.jpg | Actual agenda and prominent overtime timer; primary workshop-planning benefit |
| images/02-recovery.jpg | Actual recovery table, with five minutes plus two minutes reclaimed |
| images/03-planning.jpg | Actual duration, minimum, protection and facilitator-note controls |
| images/04-timer.jpg | Actual overtime, manual advance, target and projected finish |
| images/05-run-sheet.jpg | Actual printable run-sheet detail with notes and minimums |

The JPEG paths remain stable. These are revised compositions, not renamed copies of the previous images. The published v1.1.0 GitHub release retains the previous package for comparison.

## Additional promotional formats

| File | Size |
| --- | --- |
| promo/06-protected.jpg | 1600 × 900 |
| social/tempofold-square-1080.jpg | 1080 × 1080 |
| social/tempofold-landscape-1200x630.jpg | 1200 × 630 |
| social/tempofold-portrait-1080x1350.jpg | 1080 × 1350 |
| contact-sheet.jpg | 1800 × 1710 overview of all nine images |

Do not crop the primary images for social placements. Use the corresponding social file so its headline, product detail and destination remain in frame. Suggested factual copy is in [source/captions.md](./source/captions.md).

## Editable source and reproduction

`source/*.svg` contains portable vector compositions with embedded actual screenshots and outlined Hanken Grotesk lettering. No remote font or image request is required to render an SVG. `source-captures` contains the original product screens. Crops and magnified details do not replace controls, text or values in the source screenshots.

`source/generate.py` contains editable text, layout, colors and crop settings. `source/panels.json` records outputs, sizes and accessible descriptions. `source/contact-sheet.py` assembles an overview from the finished JPEGs. `gallery.html?slide=cover`, `planning`, `recovery`, `timer`, `print`, `protected`, `square`, `landscape` or `portrait` displays the corresponding SVG.

Optional authoring tools are separate from the app. The tested tool versions were FontTools 4.67.0 and Sharp 0.35.5. Install them in a temporary or dedicated tools environment. With a Python interpreter that has FontTools and a tools directory containing `node_modules/sharp`, run from the repository root:

```sh
python marketplace/source/generate.py
node marketplace/source/render.mjs /absolute/path/to/tools
python marketplace/source/contact-sheet.py
node marketplace/source/render.mjs /absolute/path/to/tools --contact-only
```

The final command renders the contact sheet from the finished JPEGs. The app itself still has zero npm runtime dependencies and does not load the authoring scripts. Original software and artwork use MIT. Hanken Grotesk and outlined lettering retain SIL OFL 1.1; keep the notices in the package. The optional FontTools and Sharp tools are not redistributed in the kit.

## Listing copy and publication status

`listing-fields.json` contains the complete field package and nine FAQs. `description.md` is the formatted long description. The [TempoFold listing](https://zerotohundred.ai/listings/tempofold-sbp9lh) was verified live on October 21, 2026 with five images and an intentional $10 asking price. The source and hosted planner remain independently available free under MIT; a marketplace purchase is not required to access them.

The listing and these prepared packages are separate surfaces. A prepared image or archive is not proof of a new upload, and the marketplace's stored source bundle is not claimed to match the latest main commit. The published v1.1.0 release preserves the application and earlier brand/listing package; `marketing-kit-v1` preserves the current nine-image promotional kit.

The paid marketplace offer has separate transaction terms. This kit does not accept agreements, make ownership attestations or alter the price. No paid support, maintenance commitment or response-time promise is included. Original source and artwork retain MIT; the font and outlined lettering retain OFL 1.1 and their notices.
