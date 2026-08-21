# Site Redesign + "Send a Case" Wizard

Scope: `html/new/` only (all pages except `index.html` / Home for the redesign; `prescription-form/` for the wizard).

## Problem

The inner pages (About Us, Services, Materials & Brands, Gallery, Contact Us, Prescription Form) read as text-heavy and sparse: body copy is small (~15.5px), prose blocks run long, and sections around them feel empty. Separately, dentists currently must download a PDF prescription and email it manually — there is no way to submit a case directly on the site.

## A. Typography, content, and layout pass

Applies to every page under `html/new/` except `index.html`.

**Typography (in `css/style.css`, shared classes so the change is site-wide):**
- Body copy classes (`.td-prose p`, `.td-info-card p`, `.td-material-card p`, `.td-service-body p`, `.td-page-hero p`, `.td-section-head p.td-lead`, `.td-steps p`, `.td-download-body p`): raise from ~13.5–15.5px to ~16.5–17px, keep line-height ≈1.7.
- `.td-page-hero h1`: 44px → 48–52px.
- Keep the existing Playfair/Inter pairing and color tokens — no new type system.

**Content:**
- Rewrite prose blocks to 1–2 short sentences per block instead of 3–5 sentence paragraphs. About Us's three long paragraphs are the clearest case, but the same edit applies wherever a page has dense paragraph text (Services intro, Materials & Brands intro, Contact Us copy, etc.).
- Preserve factual content (what Trident does, why it exists, contact details) — cut filler, not facts.

**Layout (reduce empty feeling, increase image weight):**
- `.td-split` sections: give the image column more visual weight (larger image area / adjusted fr ratio) instead of a small photo next to a wall of text.
- Card grids (`.td-info-card`, `.td-material-card`): increase padding and icon size so cards read as full rather than mostly whitespace with two lines of text.
- Where text reduction leaves a section visually thin (About Us "Why We Started" being the main case), add a short stat/highlight row or lean on a larger image rather than re-padding empty space.
- All changes go through the existing shared classes in `css/style.css` — no per-page CSS overrides.

**Per-page work:** About Us is already fully read. Services, Materials & Brands, Gallery, and Contact Us need to be read before rewriting their copy — content edits will follow the same "short sentences, larger type, fuller layout" rules once reviewed.

## B. "Send a Case" online wizard

**Location:** New section on `prescription-form/index.html`, inserted after the page hero and before the existing PDF download card. A prominent **START NEW CASE** button reveals the wizard in place (no page navigation). The existing "download PDF and email it" flow stays below, framed as the alternative path.

**Structure:** 3 steps with a numbered progress indicator (01 / 02 / 03).

1. **Create Case**
   - Dentist details: name, practice, email, phone
   - Patient details: name, optional record/reference ID
   - Select restoration: Crown, Bridge, Veneer, Denture, Implant, Night Guard, Other
   - Select teeth: clickable tooth-number grid (Universal 1–32), toggles selection
   - Material: options depend on restoration type
   - Shade: VITA Classic shade list (A1–D4 etc.)
   - Design instructions: free-text notes to technician

2. **Upload Files**
   - STL / PLY / OBJ file picker with drag-and-drop styling; lists selected filenames client-side (no actual upload — there is no backend)
   - Upload photos (optional)
   - Due date picker

3. **Review & Submit**
   - Read-only summary of everything entered in steps 1–2
   - **SUBMIT CASE** button

**Submit behavior (placeholder, no backend):** On submit, required fields are validated client-side, then a confirmation screen shows a client-generated case reference (e.g. `TDL-XXXXXX`) and a "we'll be in touch" message. Nothing is actually transmitted or stored. A code comment marks this as the integration point for a real backend later.

**Implementation:** Plain HTML/CSS/JS, no framework or dependency. New `js/case-wizard.js` handles step navigation, validation, and the tooth-chart/summary rendering. New CSS rules under a `.td-wizard-*` namespace added to `css/style.css`, following the existing design tokens (`--td-navy`, `--td-blue`, etc.) and card/shadow style already used elsewhere on the site.

## Out of scope

- Any real form submission / email / file upload backend (explicitly deferred per user decision).
- Changes to `index.html` (Home).
- New pages beyond the wizard section on the existing Prescription Form page.
