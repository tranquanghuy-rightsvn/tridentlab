# Site Redesign + "Send a Case" Wizard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Increase readability and visual "fullness" across every inner page of the Trident Dental Lab site (all pages except Home), and add an in-page "Send a Case" online prescription wizard to the Prescription Form page.

**Architecture:** Plain HTML/CSS/JS static site, no build step, no framework. Shared typography/layout rules live in one stylesheet (`css/style.css`) consumed by every page, so most of the visual change is a handful of CSS edits plus targeted content rewrites. The wizard is a self-contained progressive-enhancement feature: static HTML markup for all 3 steps ships in the page, and `js/case-wizard.js` handles step navigation, validation, and a client-only submit confirmation (no backend exists).

**Tech Stack:** HTML5, vanilla CSS (custom properties already defined in `css/style.css`), vanilla ES5-style JS (matches the existing `js/main.js` style — `document.addEventListener`, no modules/bundler). Fonts: Playfair Display (headings) + Inter (body), already loaded via Google Fonts link tags on every page.

There is no automated test runner in this project (no `package.json`, no test framework). "Tests" in this plan are concrete, repeatable verification steps: `grep` checks that a specific rule/string exists, and manual browser checks (a local static server + visual screenshot) for anything that can only be judged visually.

## Global Constraints

- Scope is `html/new/` only. Do not touch anything outside it.
- Do not modify `index.html` (Home) — the redesign applies to every other page: `about-us/`, `services/`, `materials-brands/`, `gallery/`, `contact-us/`, `prescription-form/`.
- No new pages. The wizard lives inside the existing `prescription-form/index.html`.
- No backend integration for the wizard submit. On submit, validate client-side, generate a client-side case reference, and show a confirmation message — nothing is transmitted or stored. Mark the spot with a comment as the future backend integration point.
- Typography/layout changes go through the shared classes in `css/style.css` only — no new per-page `<style>` blocks or inline style forks of shared components.
- Keep the existing design tokens (`--td-navy`, `--td-blue`, `--td-bg`, etc.), font pairing, and shadow/radius language already used across the site — no new type system or color palette.
- New wizard CSS rules use the `.td-wizard-*` / `.td-tooth-*` / `.td-upload-*` namespace. New wizard JS lives in a new file, `js/case-wizard.js`, loaded only on `prescription-form/index.html`.

---

### Task 1: Global typography & layout CSS pass

**Files:**
- Modify: `html/new/css/style.css`

**Interfaces:**
- Produces: updated font-size/padding values on the shared classes `.td-prose p`, `.td-page-hero h1`, `.td-page-hero p`, `.td-section-head p.td-lead`, `.td-info-card` (+ children), `.td-material-card` (+ children), `.td-service-body` (+ children), `.td-steps` (+ children), `.td-download-body` (+ children), `.td-contact-strip-item a/p`, `.td-field input/textarea/select`, `.td-split`. Every later task (and every existing page) inherits these without further changes.

This task is a pure CSS edit — no HTML changes. It raises body-copy size site-wide and gives cards/heroes more breathing room, satisfying "tăng kích thước font chữ" and "bố cục đầy đặn hơn" for all six inner pages in one place.

- [ ] **Step 1: Record baseline font sizes for the verification diff**

Run: `grep -nE "font-size: (1[0-5]\.?5?px|13px)" html/new/css/style.css`
Expected: prints the current (small) font-size declarations for `.td-prose p`, `.td-info-card p`, `.td-material-card p`, `.td-service-body p`, `.td-page-hero p`, `.td-section-head p.td-lead`, `.td-steps p`, `.td-download-body p`, `.td-contact-strip-item a, .td-contact-strip-item p`, `.td-field input, .td-field textarea`. Keep this output for comparison after Step 2.

- [ ] **Step 2: Apply the CSS edits**

In `html/new/css/style.css`, make these exact replacements:

```css
/* was: .td-prose p { font-size: 15.5px; line-height: 1.85; color: var(--td-ink-soft); margin-bottom: 18px; } */
.td-prose p { font-size: 17px; line-height: 1.8; color: var(--td-ink-soft); margin-bottom: 20px; }
```

```css
/* was: .td-check-list li { display: flex; align-items: center; gap: 12px; font-size: 14.5px; color: var(--td-ink-soft); } */
.td-check-list li { display: flex; align-items: center; gap: 12px; font-size: 15.5px; color: var(--td-ink-soft); }
```

```css
/* was: .td-section-head p.td-lead { margin-top: 16px; font-size: 15.5px; color: var(--td-ink-soft); line-height: 1.7; } */
.td-section-head p.td-lead { margin-top: 16px; font-size: 17px; color: var(--td-ink-soft); line-height: 1.7; }
```

```css
/* was:
.td-info-card { background: #fff; border-radius: 22px; padding: 32px; box-shadow: 0 24px 46px -34px rgba(11,37,69,0.3); }
.td-info-card svg { width: 30px; height: 30px; color: var(--td-blue); margin-bottom: 18px; }
.td-info-card h3 { font-size: 17px; margin-bottom: 10px; }
.td-info-card p { font-size: 14px; color: var(--td-ink-soft); line-height: 1.7; }
*/
.td-info-card { background: #fff; border-radius: 22px; padding: 38px; box-shadow: 0 24px 46px -34px rgba(11,37,69,0.3); }
.td-info-card svg { width: 34px; height: 34px; color: var(--td-blue); margin-bottom: 20px; }
.td-info-card h3 { font-size: 18.5px; margin-bottom: 10px; }
.td-info-card p { font-size: 16px; color: var(--td-ink-soft); line-height: 1.7; }
```

```css
/* was:
.td-service-row { display: flex; align-items: center; gap: 18px; background: #fff; border-radius: 18px; padding: 18px 22px; box-shadow: 0 20px 40px -32px rgba(11,37,69,0.3); transition: transform 0.25s ease, box-shadow 0.25s ease; }
.td-service-body h3 { font-size: 16px; font-weight: 700; margin-bottom: 4px; }
.td-service-body p { font-size: 13.5px; color: var(--td-ink-soft); line-height: 1.5; }
*/
.td-service-row { display: flex; align-items: center; gap: 20px; background: #fff; border-radius: 18px; padding: 22px 26px; box-shadow: 0 20px 40px -32px rgba(11,37,69,0.3); transition: transform 0.25s ease, box-shadow 0.25s ease; }
.td-service-body h3 { font-size: 17px; font-weight: 700; margin-bottom: 5px; }
.td-service-body p { font-size: 15.5px; color: var(--td-ink-soft); line-height: 1.6; }
```

```css
/* was:
.td-steps h4 { font-size: 16px; color: var(--td-navy); margin-bottom: 6px; }
.td-steps p { font-size: 14px; color: var(--td-ink-soft); line-height: 1.7; }
*/
.td-steps h4 { font-size: 17.5px; color: var(--td-navy); margin-bottom: 7px; }
.td-steps p { font-size: 16px; color: var(--td-ink-soft); line-height: 1.7; }
```

```css
/* was:
.td-download-body h3 { font-size: 20px; margin-bottom: 8px; }
.td-download-body p { font-size: 14.5px; color: var(--td-ink-soft); line-height: 1.6; margin-bottom: 20px; max-width: 520px; }
*/
.td-download-body h3 { font-size: 22px; margin-bottom: 10px; }
.td-download-body p { font-size: 16.5px; color: var(--td-ink-soft); line-height: 1.65; margin-bottom: 22px; max-width: 520px; }
```

```css
/* was:
.td-material-card h3 { font-size: 16.5px; margin-bottom: 10px; }
.td-material-card p { font-size: 13.5px; color: var(--td-ink-soft); line-height: 1.65; }
*/
.td-material-card { background: #fff; border-radius: 20px; padding: 34px; border: 1px solid var(--td-line); transition: box-shadow 0.25s ease, transform 0.25s ease; }
.td-material-card h3 { font-size: 18px; margin-bottom: 12px; }
.td-material-card p { font-size: 16px; color: var(--td-ink-soft); line-height: 1.65; }
```

(Note the `.td-material-card` base rule padding also changes from `30px` to `34px` — replace the whole existing `.td-material-card { ... }` declaration, not just the child selectors.)

```css
/* was: .td-contact-strip-item a, .td-contact-strip-item p { font-size: 15.5px; font-weight: 600; color: var(--td-navy); line-height: 1.5; } */
.td-contact-strip-item a, .td-contact-strip-item p { font-size: 16.5px; font-weight: 600; color: var(--td-navy); line-height: 1.5; }
```

```css
/* was: .td-field input, .td-field textarea { width: 100%; border: none; border-bottom: 1.5px solid var(--td-line); background: transparent; padding: 10px 2px; font-family: inherit; font-size: 14.5px; color: var(--td-ink); outline: none; transition: border-color 0.2s ease; } */
.td-field input, .td-field textarea, .td-field select {
  width: 100%; border: none; border-bottom: 1.5px solid var(--td-line); background: transparent; padding: 10px 2px; font-family: inherit; font-size: 15.5px; color: var(--td-ink); outline: none; transition: border-color 0.2s ease;
}
/* was: .td-field input:focus, .td-field textarea:focus { border-color: var(--td-blue); } */
.td-field input:focus, .td-field textarea:focus, .td-field select:focus { border-color: var(--td-blue); }
```

```css
/* was:
.td-page-hero h1 { font-size: 44px; }
.td-page-hero p { margin: 18px auto 0; max-width: 560px; font-size: 15.5px; color: var(--td-ink-soft); line-height: 1.7; }
*/
.td-page-hero h1 { font-size: 50px; }
.td-page-hero p { margin: 20px auto 0; max-width: 600px; font-size: 17px; color: var(--td-ink-soft); line-height: 1.7; }
```

```css
/* was: .td-split { display: grid; grid-template-columns: 0.9fr 1.1fr; gap: 60px; align-items: center; } */
.td-split { display: grid; grid-template-columns: 0.82fr 1.18fr; gap: 50px; align-items: center; }
```

Also add this to the `@media (max-width: 760px)` block (append after the existing `.td-page-hero h1 { font-size: 32px; }` line):

```css
  .td-page-hero p { font-size: 15.5px; }
```

- [ ] **Step 2b: Verify the edits landed**

Run: `grep -nE "font-size: (17px|16px|16\.5px|18\.5px|18px|22px|50px|15\.5px)" html/new/css/style.css | head -30`
Expected: the new sizes from Step 2 appear; none of the old sizes from the Step 1 grep still exist for the touched selectors.

- [ ] **Step 3: Visual check on two pages**

Start a static server and check rendering with the browser tool:

Run: `cd html/new && python3 -m http.server 8934 >/tmp/td-serve.log 2>&1 &`

Then navigate a browser tab to `http://localhost:8934/about-us/index.html` and `http://localhost:8934/materials-brands/index.html`, and take a screenshot of each. Confirm: body paragraph text is visibly larger than before, info/material cards have more internal padding, no text overlaps or overflows its container, no horizontal scrollbar appears at 1440px or at a mobile width (~390px).

- [ ] **Step 4: Commit**

```bash
cd /home/hai/Workspaces/projects/tridentlab
git add html/new/css/style.css
git commit -m "style: increase body/heading type scale and card padding site-wide

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 2: About Us content rewrite

**Files:**
- Modify: `html/new/about-us/index.html:57-71` (the "Why We Started Trident" split section)

**Interfaces:**
- Consumes: `.td-split`, `.td-prose` classes from Task 1 (must already be applied so the shorter copy renders at the new larger size).
- Produces: none consumed by later tasks — self-contained content change.

The current section has three long paragraphs (61–63) next to a single photo. Replace the three paragraphs with three short ones, and keep the existing photo/markup structure (Task 1's `.td-split` ratio change already gives the image more width).

- [ ] **Step 1: Replace the three paragraphs**

In `html/new/about-us/index.html`, replace:

```html
      <div class="td-prose td-reveal">
        <h2>Why We Started Trident</h2>
        <p>As dentists, we are responsible for the services we provide to the patient. In the case of a filling, for example, we have full control over that process from start to finish and can confidently stand behind the service we have provided. Where there are requirements for lab work, however, we lose control over a part of the process &mdash; and any problem with colour, thickness, design, aesthetics or fit can undermine our clinical efforts.</p>
        <p>Trident Dental Lab was created by dentists in order to ensure that lab work was controlled to the highest level, with patient and clinical outcomes given the highest priority. Beyond the lab work itself, we place a high focus on cultivating an effective working relationship between the lab and the clinician.</p>
        <p>As Trident Dental Lab continues to grow, we remain committed to being a highly efficient, digital-first lab with competitive prices &mdash; and equally committed to a clinical focus, working with every clinician to help them deliver a premium service to their patients.</p>
      </div>
```

with:

```html
      <div class="td-prose td-reveal">
        <h2>Why We Started Trident</h2>
        <p>As dentists, we control every part of patient care &mdash; except the lab work. One flaw in colour, fit or design can undo months of clinical effort.</p>
        <p>Trident Dental Lab closes that gap. We hold every case to the same clinical standard we hold our own chairside work, and build a real working relationship with the clinicians we serve.</p>
        <p>As we grow, we stay digital-first and competitively priced &mdash; without ever losing that clinical focus.</p>
      </div>
```

- [ ] **Step 2: Verify the old copy is gone**

Run: `grep -c "In the case of a filling" html/new/about-us/index.html`
Expected: `0`

Run: `grep -c "One flaw in colour, fit or design" html/new/about-us/index.html`
Expected: `1`

- [ ] **Step 3: Visual check**

With the server from Task 1 Step 3 still running (or restart it), reload `http://localhost:8934/about-us/index.html`, screenshot the "Why We Started Trident" section. Confirm: three short paragraphs, no orphaned single-word lines, section no longer looks like a dense wall of text, photo and text are vertically balanced.

- [ ] **Step 4: Commit**

```bash
cd /home/hai/Workspaces/projects/tridentlab
git add html/new/about-us/index.html
git commit -m "content: shorten About Us origin story copy

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 3: Services page copy tightening

**Files:**
- Modify: `html/new/services/index.html:53` (hero paragraph)
- Modify: `html/new/services/index.html:103-104` (Ceramic Layering & Custom Work paragraphs)

**Interfaces:**
- Consumes: Task 1's CSS (renders at the new larger size).
- Produces: none.

Services' info cards are already one short sentence each — leave those. Only the hero line and the two "Ceramic Layering" paragraphs run long.

- [ ] **Step 1: Tighten the hero paragraph**

Replace:
```html
      <p class="td-reveal">At Trident Dental Lab we utilise a digital approach wherever possible &mdash; planning and manufacturing cases at a high level while keeping costs competitive, without compromising on quality.</p>
```
with:
```html
      <p class="td-reveal">A digital-first approach to every case &mdash; precise planning and manufacturing, competitive pricing, no compromise on quality.</p>
```

- [ ] **Step 2: Tighten the Ceramic Layering & Custom Work paragraphs**

Replace:
```html
        <p>Quality is not the only important factor &mdash; it doesn&rsquo;t matter how technically perfect the design, material and fit is if it doesn&rsquo;t look incredible. Sometimes the artistic touch of a skilled technician brings a case to life. We are committed to supporting even the most aesthetically demanding cases, with the option of ceramic layering on any case.</p>
        <p>We also offer customised abutments, implant-supported restorations, occlusal splints and temporary solutions. If you have a specific need not listed here, please don&rsquo;t hesitate to get in touch.</p>
```
with:
```html
        <p>Technical precision isn&rsquo;t enough on its own &mdash; a case has to look incredible too. Our technicians hand-layer ceramic on any case that calls for that extra artistic touch.</p>
        <p>We also offer custom abutments, implant-supported restorations, occlusal splints and temporary solutions &mdash; get in touch if your case needs something not listed here.</p>
```

- [ ] **Step 3: Verify**

Run: `grep -c "Quality is not the only important factor" html/new/services/index.html`
Expected: `0`

Run: `grep -c "Technical precision isn" html/new/services/index.html`
Expected: `1`

- [ ] **Step 4: Visual check**

Reload `http://localhost:8934/services/index.html`, screenshot the hero and the "Ceramic Layering & Custom Work" split section. Confirm text reads as short, confident statements, and the card grid above still displays 6 cards at the new padding from Task 1 without visual breakage.

- [ ] **Step 5: Commit**

```bash
cd /home/hai/Workspaces/projects/tridentlab
git add html/new/services/index.html
git commit -m "content: tighten Services hero and ceramic layering copy

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 4: "Send a Case" wizard — markup and CSS

**Files:**
- Modify: `html/new/prescription-form/index.html:49-55` (hero copy) and insert a new section after line 55 (before the existing "Download" section that starts at line 58)
- Modify: `html/new/css/style.css` (append new `.td-wizard-*` / `.td-tooth-*` / `.td-upload-*` rules)

**Interfaces:**
- Produces: the DOM structure and element IDs that Task 5's JS binds to: `#td-wizard-start`, `#td-wizard-intro`, `#td-wizard`, `#td-wizard-progress` (with `<li data-step="1|2|3">`), `#td-wizard-form`, `.td-wizard-step[data-step="1|2|3"]`, `.td-wizard-next` / `.td-wizard-back` buttons, `#td-tooth-row-upper` / `#td-tooth-row-lower`, field IDs `wz-dentist-name`, `wz-practice`, `wz-email`, `wz-phone`, `wz-patient-name`, `wz-patient-ref`, `wz-restoration`, `wz-material`, `wz-shade`, `wz-instructions`, `wz-scan-files` + `#wz-scan-list`, `wz-photo-files` + `#wz-photo-list`, `wz-due-date`, `#td-wizard-summary`, `#td-wizard-confirm` + `#td-wizard-confirm-text`.
- Consumes: `.td-field`, `.td-btn`, `.td-eyebrow`, `.td-lead`, design tokens — all from the existing stylesheet (no new tokens).

Without JS, all 3 `.td-wizard-step` panels would show at once and the `hidden` attribute on `#td-wizard` would keep the whole thing invisible — this task only needs to produce correct, valid markup; Task 5 wires up the interactivity.

- [ ] **Step 1: Update the page hero copy to mention both submission paths**

Replace:
```html
      <h1 class="td-reveal">Send a Case in<br>Three Simple Steps</h1>
      <p class="td-reveal">Download the Prescription Card, fill in your case details, and email it through with your scan file or impression. Our team will confirm receipt and keep you updated.</p>
```
with:
```html
      <h1 class="td-reveal">Send a Case in<br>Three Simple Steps</h1>
      <p class="td-reveal">Submit your case online in minutes, or download the Prescription Card and email it through. Either way, our team confirms receipt and keeps you updated.</p>
```

- [ ] **Step 2: Insert the wizard section markup**

Insert this new `<section>` immediately after the closing `</section>` of the page hero (after line 55, before `<!-- Download -->` on line 57):

```html
  <!-- Send a Case wizard -->
  <section class="td-section td-wizard-section" style="padding-top:10px;">
    <div class="td-container">
      <div class="td-wizard-intro td-reveal" id="td-wizard-intro">
        <div>
          <p class="td-eyebrow"><span class="td-dot"></span> Send a Case Online</p>
          <h2>Submit a Prescription in 3 Steps</h2>
          <p class="td-lead">Skip the PDF &mdash; fill in the prescription, attach your files, and submit directly from your browser.</p>
        </div>
        <button type="button" class="td-btn td-btn-solid" id="td-wizard-start">START NEW CASE <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 17 17 7M9 7h8v8"/></svg></button>
      </div>

      <div class="td-wizard" id="td-wizard" hidden>
        <ol class="td-wizard-progress" id="td-wizard-progress">
          <li data-step="1"><span>01</span> Create Case</li>
          <li data-step="2"><span>02</span> Upload Files</li>
          <li data-step="3"><span>03</span> Review &amp; Submit</li>
        </ol>

        <form class="td-wizard-form" id="td-wizard-form" novalidate>
          <div class="td-wizard-step" data-step="1">
            <h3>Dentist Details</h3>
            <div class="td-wizard-grid">
              <div class="td-field"><label for="wz-dentist-name">Dentist Name</label><input type="text" id="wz-dentist-name" required></div>
              <div class="td-field"><label for="wz-practice">Practice</label><input type="text" id="wz-practice" required></div>
              <div class="td-field"><label for="wz-email">Email</label><input type="email" id="wz-email" required></div>
              <div class="td-field"><label for="wz-phone">Phone</label><input type="tel" id="wz-phone" required></div>
            </div>

            <h3>Patient Details</h3>
            <div class="td-wizard-grid">
              <div class="td-field"><label for="wz-patient-name">Patient Name</label><input type="text" id="wz-patient-name" required></div>
              <div class="td-field"><label for="wz-patient-ref">Record / Reference ID (optional)</label><input type="text" id="wz-patient-ref"></div>
            </div>

            <h3>Restoration Details</h3>
            <div class="td-wizard-grid">
              <div class="td-field">
                <label for="wz-restoration">Select Restoration</label>
                <select id="wz-restoration" required>
                  <option value="">Choose...</option>
                  <option>Crown</option>
                  <option>Bridge</option>
                  <option>Veneer</option>
                  <option>Denture</option>
                  <option>Implant</option>
                  <option>Night Guard</option>
                  <option>Other</option>
                </select>
              </div>
              <div class="td-field">
                <label for="wz-material">Material</label>
                <select id="wz-material" required>
                  <option value="">Choose...</option>
                  <option>IPS e.max</option>
                  <option>Multi-layer Zirconia</option>
                  <option>Zirconia</option>
                  <option>Ceramic Layering</option>
                  <option>Denture Acrylic</option>
                  <option>Other</option>
                </select>
              </div>
              <div class="td-field">
                <label for="wz-shade">Shade</label>
                <select id="wz-shade" required>
                  <option value="">Choose...</option>
                  <option>A1</option><option>A2</option><option>A3</option><option>A3.5</option><option>A4</option>
                  <option>B1</option><option>B2</option><option>B3</option><option>B4</option>
                  <option>C1</option><option>C2</option><option>C3</option><option>C4</option>
                  <option>D2</option><option>D3</option><option>D4</option>
                </select>
              </div>
            </div>

            <div class="td-field">
              <label>Select Teeth</label>
              <div class="td-tooth-chart" id="td-tooth-chart">
                <div class="td-tooth-row" id="td-tooth-row-upper"></div>
                <div class="td-tooth-row" id="td-tooth-row-lower"></div>
              </div>
              <p class="td-tooth-hint">Click a tooth number to select it (Universal numbering, 1&ndash;32).</p>
            </div>

            <div class="td-field">
              <label for="wz-instructions">Design Instructions</label>
              <textarea id="wz-instructions" rows="4"></textarea>
            </div>

            <div class="td-wizard-actions">
              <span></span>
              <button type="button" class="td-btn td-btn-solid td-wizard-next">Next: Upload Files <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 17 17 7M9 7h8v8"/></svg></button>
            </div>
          </div>

          <div class="td-wizard-step" data-step="2" hidden>
            <h3>Upload STL / PLY / OBJ</h3>
            <label class="td-upload-drop" for="wz-scan-files">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3v12m0 0-4.5-4.5M12 15l4.5-4.5M4 20h16"/></svg>
              <span>Click to choose files or drag them here</span>
              <input type="file" id="wz-scan-files" accept=".stl,.ply,.obj" multiple>
            </label>
            <ul class="td-upload-list" id="wz-scan-list"></ul>

            <h3>Upload Photos (optional)</h3>
            <label class="td-upload-drop" for="wz-photo-files">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3v12m0 0-4.5-4.5M12 15l4.5-4.5M4 20h16"/></svg>
              <span>Click to choose photos or drag them here</span>
              <input type="file" id="wz-photo-files" accept="image/*" multiple>
            </label>
            <ul class="td-upload-list" id="wz-photo-list"></ul>

            <div class="td-field">
              <label for="wz-due-date">Due Date</label>
              <input type="date" id="wz-due-date" required>
            </div>

            <div class="td-wizard-actions">
              <button type="button" class="td-btn td-btn-outline td-wizard-back">Back</button>
              <button type="button" class="td-btn td-btn-solid td-wizard-next">Next: Review</button>
            </div>
          </div>

          <div class="td-wizard-step" data-step="3" hidden>
            <h3>Review Your Case</h3>
            <dl class="td-wizard-summary" id="td-wizard-summary"></dl>
            <div class="td-wizard-actions">
              <button type="button" class="td-btn td-btn-outline td-wizard-back">Back</button>
              <button type="submit" class="td-btn td-btn-solid">SUBMIT CASE</button>
            </div>
          </div>
        </form>

        <div class="td-wizard-confirm" id="td-wizard-confirm" hidden>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-7.5 8-13a8 8 0 1 0-16 0c0 5.5 8 13 8 13Z"/><path d="m9 12 2 2 4-4"/></svg>
          <h3>Case Submitted</h3>
          <p id="td-wizard-confirm-text"></p>
        </div>
      </div>
    </div>
  </section>

```

- [ ] **Step 3: Add the wizard CSS block**

Append to the end of `html/new/css/style.css` (after the existing `@media (max-width: 760px)` block):

```css
/* ---------- Send a Case wizard ---------- */
.td-wizard-intro {
  display: flex; align-items: center; justify-content: space-between; gap: 30px; flex-wrap: wrap;
  background: #fff; border-radius: 26px; padding: 40px 44px; box-shadow: 0 30px 60px -36px rgba(11,37,69,0.35); margin-bottom: 40px;
}
.td-wizard-intro h2 { font-size: 26px; margin: 10px 0 8px; }
.td-wizard-intro p.td-lead { margin: 0; max-width: 480px; font-size: 16px; }

.td-wizard { background: #fff; border-radius: 26px; padding: 44px; box-shadow: 0 30px 60px -36px rgba(11,37,69,0.35); margin-bottom: 40px; }

.td-wizard-progress { display: flex; gap: 10px; margin-bottom: 40px; }
.td-wizard-progress li {
  flex: 1; text-align: center; padding: 14px 10px; border-radius: 12px; background: var(--td-bg-soft);
  font-size: 13.5px; font-weight: 600; color: var(--td-ink-faint); display: flex; flex-direction: column; gap: 4px; align-items: center;
}
.td-wizard-progress li span { font-family: "Playfair Display", serif; font-size: 20px; color: var(--td-ink-faint); }
.td-wizard-progress li.is-active { background: var(--td-blue-soft); color: var(--td-navy); }
.td-wizard-progress li.is-active span { color: var(--td-blue); }
.td-wizard-progress li.is-done { background: var(--td-navy); color: #fff; }
.td-wizard-progress li.is-done span { color: #a9c6ff; }

.td-wizard-step h3 { font-size: 18px; margin: 30px 0 18px; }
.td-wizard-step h3:first-child { margin-top: 0; }
.td-wizard-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 0 30px; }

.td-tooth-chart { display: flex; flex-direction: column; gap: 10px; margin-top: 10px; }
.td-tooth-row { display: grid; grid-template-columns: repeat(16, 1fr); gap: 6px; }
.td-tooth {
  aspect-ratio: 1; border-radius: 8px; border: 1.5px solid var(--td-line); background: var(--td-bg-soft);
  font-size: 12px; font-weight: 600; color: var(--td-ink-soft); cursor: pointer;
  transition: background 0.2s ease, color 0.2s ease, border-color 0.2s ease;
}
.td-tooth:hover { border-color: var(--td-blue); }
.td-tooth.is-selected { background: var(--td-blue); border-color: var(--td-blue); color: #fff; }
.td-tooth-hint { margin-top: 10px; font-size: 12.5px; color: var(--td-ink-faint); }

.td-upload-drop {
  display: flex; flex-direction: column; align-items: center; gap: 10px; text-align: center;
  border: 1.5px dashed var(--td-line); border-radius: 16px; padding: 34px; cursor: pointer; color: var(--td-ink-soft); font-size: 14px;
  transition: border-color 0.2s ease, background 0.2s ease;
}
.td-upload-drop:hover { border-color: var(--td-blue); background: var(--td-blue-soft); }
.td-upload-drop svg { width: 28px; height: 28px; color: var(--td-blue); }
.td-upload-drop input { display: none; }
.td-upload-list { margin: 12px 0 26px; display: flex; flex-direction: column; gap: 6px; }
.td-upload-list li { font-size: 13.5px; color: var(--td-ink-soft); background: var(--td-bg-soft); border-radius: 8px; padding: 8px 12px; }

.td-wizard-actions { display: flex; justify-content: space-between; align-items: center; margin-top: 34px; }

.td-wizard-summary { display: grid; grid-template-columns: 180px 1fr; row-gap: 16px; column-gap: 20px; }
.td-wizard-summary dt { font-size: 12.5px; text-transform: uppercase; letter-spacing: 0.06em; color: var(--td-ink-faint); font-weight: 600; }
.td-wizard-summary dd { margin: 0; font-size: 15px; color: var(--td-navy); font-weight: 500; }

.td-wizard-confirm { text-align: center; padding: 30px 0; }
.td-wizard-confirm svg { width: 56px; height: 56px; color: var(--td-blue); margin: 0 auto 18px; }
.td-wizard-confirm h3 { font-size: 24px; margin-bottom: 12px; }
.td-wizard-confirm p { font-size: 15.5px; color: var(--td-ink-soft); max-width: 480px; margin: 0 auto; line-height: 1.7; }

@media (max-width: 760px) {
  .td-wizard-intro { flex-direction: column; align-items: flex-start; padding: 28px; }
  .td-wizard { padding: 26px; }
  .td-wizard-grid { grid-template-columns: 1fr; }
  .td-tooth-row { grid-template-columns: repeat(8, 1fr); }
  .td-wizard-progress li span { font-size: 16px; }
  .td-wizard-summary { grid-template-columns: 1fr; row-gap: 4px; }
}
```

- [ ] **Step 4: Verify markup validity**

Run: `grep -c 'id="td-wizard-start"' html/new/prescription-form/index.html` → expected `1`
Run: `grep -c 'id="td-wizard-confirm-text"' html/new/prescription-form/index.html` → expected `1`
Run: `grep -c 'class="td-wizard-step" data-step="3" hidden' html/new/prescription-form/index.html` → expected `1`
Run: `python3 -c "import xml.dom.minidom, re, sys; s=open('html/new/prescription-form/index.html').read(); print('OK' if s.count('<section')==s.count('</section>') else 'MISMATCH')"` → expected `OK` (sanity check on section tag balance)

- [ ] **Step 5: Visual check (pre-JS)**

Reload `http://localhost:8934/prescription-form/index.html`. Confirm: the new "Submit a Prescription in 3 Steps" card renders above the PDF download card, with a visible **START NEW CASE** button. Clicking it does nothing yet (expected — Task 5 wires it up). No layout breakage, no console errors other than a missing-handler no-op.

- [ ] **Step 6: Commit**

```bash
cd /home/hai/Workspaces/projects/tridentlab
git add html/new/prescription-form/index.html html/new/css/style.css
git commit -m "feat: add Send a Case wizard markup and styles

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 5: "Send a Case" wizard — JS logic

**Files:**
- Create: `html/new/js/case-wizard.js`
- Modify: `html/new/prescription-form/index.html` (add the `<script>` tag)

**Interfaces:**
- Consumes: all element IDs produced in Task 4.
- Produces: nothing consumed elsewhere — this is the leaf of the feature.

- [ ] **Step 1: Write `js/case-wizard.js`**

```javascript
document.addEventListener("DOMContentLoaded", function () {
  var startBtn = document.getElementById("td-wizard-start");
  var wizard = document.getElementById("td-wizard");
  if (!startBtn || !wizard) return;

  var intro = document.getElementById("td-wizard-intro");
  var form = document.getElementById("td-wizard-form");
  var progressItems = wizard.querySelectorAll(".td-wizard-progress li");
  var steps = form.querySelectorAll(".td-wizard-step");
  var confirm = document.getElementById("td-wizard-confirm");
  var confirmText = document.getElementById("td-wizard-confirm-text");
  var summaryList = document.getElementById("td-wizard-summary");
  var currentStep = 1;
  var selectedTeeth = [];

  function makeToothButton(num) {
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "td-tooth";
    btn.textContent = num;
    btn.setAttribute("data-tooth", num);
    btn.addEventListener("click", function () {
      btn.classList.toggle("is-selected");
      var idx = selectedTeeth.indexOf(num);
      if (btn.classList.contains("is-selected") && idx === -1) {
        selectedTeeth.push(num);
      } else if (!btn.classList.contains("is-selected") && idx !== -1) {
        selectedTeeth.splice(idx, 1);
      }
    });
    return btn;
  }

  function buildToothChart() {
    var upper = document.getElementById("td-tooth-row-upper");
    var lower = document.getElementById("td-tooth-row-lower");
    var i, j;
    for (i = 1; i <= 16; i++) {
      upper.appendChild(makeToothButton(i));
    }
    for (j = 32; j >= 17; j--) {
      lower.appendChild(makeToothButton(j));
    }
  }

  function currentStepEl() {
    return form.querySelector('.td-wizard-step[data-step="' + currentStep + '"]');
  }

  function showStep(n) {
    steps.forEach(function (step) {
      step.hidden = Number(step.getAttribute("data-step")) !== n;
    });
    progressItems.forEach(function (item) {
      var stepNum = Number(item.getAttribute("data-step"));
      item.classList.toggle("is-active", stepNum === n);
      item.classList.toggle("is-done", stepNum < n);
    });
    currentStep = n;
    if (n === 3) renderSummary();
  }

  function validateStep(stepEl) {
    var invalid = stepEl.querySelector(":invalid");
    if (invalid) {
      invalid.reportValidity();
      return false;
    }
    return true;
  }

  function fileNames(input) {
    return input && input.files && input.files.length
      ? Array.prototype.map.call(input.files, function (f) { return f.name; })
      : [];
  }

  function renderFileList(input, listEl) {
    listEl.innerHTML = "";
    fileNames(input).forEach(function (name) {
      var li = document.createElement("li");
      li.textContent = name;
      listEl.appendChild(li);
    });
  }

  function fieldValue(id) {
    var el = document.getElementById(id);
    return el ? el.value : "";
  }

  function renderSummary() {
    var scanFiles = fileNames(document.getElementById("wz-scan-files"));
    var photoFiles = fileNames(document.getElementById("wz-photo-files"));
    var sortedTeeth = selectedTeeth.slice().sort(function (a, b) { return a - b; });
    var rows = [
      ["Dentist", fieldValue("wz-dentist-name") + " — " + fieldValue("wz-practice")],
      ["Contact", fieldValue("wz-email") + " / " + fieldValue("wz-phone")],
      ["Patient", fieldValue("wz-patient-name") + (fieldValue("wz-patient-ref") ? " (" + fieldValue("wz-patient-ref") + ")" : "")],
      ["Restoration", fieldValue("wz-restoration")],
      ["Material", fieldValue("wz-material")],
      ["Shade", fieldValue("wz-shade")],
      ["Teeth", sortedTeeth.length ? sortedTeeth.join(", ") : "None selected"],
      ["Instructions", fieldValue("wz-instructions") || "None"],
      ["Scan Files", scanFiles.length ? scanFiles.join(", ") : "None attached"],
      ["Photos", photoFiles.length ? photoFiles.join(", ") : "None attached"],
      ["Due Date", fieldValue("wz-due-date") || "Not set"]
    ];
    summaryList.innerHTML = "";
    rows.forEach(function (row) {
      var dt = document.createElement("dt");
      dt.textContent = row[0];
      var dd = document.createElement("dd");
      dd.textContent = row[1];
      summaryList.appendChild(dt);
      summaryList.appendChild(dd);
    });
  }

  function generateCaseRef() {
    var chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    var ref = "";
    for (var i = 0; i < 6; i++) {
      ref += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return "TDL-" + ref;
  }

  startBtn.addEventListener("click", function () {
    intro.hidden = true;
    wizard.hidden = false;
    showStep(1);
    wizard.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  form.querySelectorAll(".td-wizard-next").forEach(function (btn) {
    btn.addEventListener("click", function () {
      if (!validateStep(currentStepEl())) return;
      showStep(currentStep + 1);
    });
  });

  form.querySelectorAll(".td-wizard-back").forEach(function (btn) {
    btn.addEventListener("click", function () {
      showStep(currentStep - 1);
    });
  });

  document.getElementById("wz-scan-files").addEventListener("change", function () {
    renderFileList(this, document.getElementById("wz-scan-list"));
  });
  document.getElementById("wz-photo-files").addEventListener("change", function () {
    renderFileList(this, document.getElementById("wz-photo-list"));
  });

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (!validateStep(currentStepEl())) return;
    // This site is static with no backend: nothing here is actually
    // transmitted or stored. Replace this block with a real submission
    // (fetch to an API, form service, etc.) once a backend exists.
    var ref = generateCaseRef();
    form.hidden = true;
    document.getElementById("td-wizard-progress").hidden = true;
    confirmText.textContent = "Case " + ref + " has been received. Our team will confirm by email and keep you updated at every stage.";
    confirm.hidden = false;
  });

  buildToothChart();
});
```

- [ ] **Step 2: Load the script on the Prescription Form page only**

In `html/new/prescription-form/index.html`, replace:
```html
<script src="../js/main.js"></script>
</body>
```
with:
```html
<script src="../js/main.js"></script>
<script src="../js/case-wizard.js"></script>
</body>
```

- [ ] **Step 3: Verify the script loads and has no syntax errors**

Run: `node --check html/new/js/case-wizard.js`
Expected: no output (exit code 0) — confirms valid JS syntax.

Run: `grep -c 'case-wizard.js' html/new/prescription-form/index.html`
Expected: `1`

- [ ] **Step 4: Manual functional test in the browser**

With the local server still running, reload `http://localhost:8934/prescription-form/index.html` and, using the browser tool:
1. Click **START NEW CASE** — wizard reveals, progress step "01 Create Case" is highlighted, tooth chart shows two rows of 16 clickable tooth buttons (1–16 top, 32→17 bottom).
2. Click a few tooth numbers — they toggle an active/selected style.
3. Click **Next: Upload Files** with required fields empty — the browser's native validation message appears and the step does not advance.
4. Fill in dentist name, practice, email, phone, patient name, restoration, material, shade — click **Next: Upload Files** again — step 2 shows, progress step "02" is now active and "01" shows as done.
5. Pick a due date, click **Next: Review** — step 3 shows a summary list matching what was entered, including the selected teeth.
6. Click **SUBMIT CASE** — the form is replaced by a confirmation message containing a `TDL-XXXXXX` reference code.

Confirm all six behaviors work as described, then stop the local server: `kill %1` (or find/kill the `http.server` process).

- [ ] **Step 5: Commit**

```bash
cd /home/hai/Workspaces/projects/tridentlab
git add html/new/js/case-wizard.js html/new/prescription-form/index.html
git commit -m "feat: wire up Send a Case wizard step navigation and client-side submit

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 6: Full-site verification pass

**Files:** none (verification only)

**Interfaces:** none.

- [ ] **Step 1: Confirm Home is untouched**

Run: `cd /home/hai/Workspaces/projects/tridentlab && git diff --stat master -- html/new/index.html`
Expected: empty output (no changes to `index.html`).

- [ ] **Step 2: Screenshot every changed page at desktop and mobile widths**

Start the server again: `cd html/new && python3 -m http.server 8934 >/tmp/td-serve.log 2>&1 &`

For each of `about-us`, `services`, `materials-brands`, `gallery`, `contact-us`, `prescription-form`, load `http://localhost:8934/<page>/index.html` in the browser tool at a ~1440px viewport and again at a ~390px viewport, and take a screenshot. Confirm for each: no horizontal scrollbar, no overlapping text, no cut-off cards, hero and body text visibly larger than the pre-Task-1 baseline, nav/footer unaffected.

- [ ] **Step 3: Re-run the wizard end-to-end once more on the final markup**

Repeat Task 5 Step 4's six-point check on `prescription-form/index.html` to confirm nothing in Task 6's earlier steps disturbed it.

- [ ] **Step 4: Stop the local server**

Run: `kill %1` (or `pkill -f "http.server 8934"`)

No commit for this task — it produces no file changes, only confirms the prior five tasks are correct together.
