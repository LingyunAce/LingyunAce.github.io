# Configurable Pokemon Home Icons Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the homepage destination SVGs with five configurable Pokemon images, remove the Notes destination, and present the remaining cards in a more open responsive `3 + 2` layout.

**Architecture:** `source/_data/notebook.yml` remains the single source of truth and gains one `icon` path per destination. The homepage template renders the configured image and retains the existing SVG mixin as a defensive fallback. CSS owns presentation only: a six-track desktop grid centers two cards on the second row, while media queries reset placement to `2 + 2 + 1` and then one column.

**Tech Stack:** Hexo 7, Pug templates, YAML data, plain CSS, Node.js built-in test runner

## Global Constraints

- Remove only the homepage “随记” destination; do not delete tag pages or article data.
- Copy the five 512×512 transparent PNG files without lossy conversion.
- Future icon changes must require only adding an image under `source/img/pokemon/` and editing `source/_data/notebook.yml`.
- Keep the current colored card backgrounds, light/dark themes, hover behavior, reduced-motion behavior, links, and accessible names.
- Desktop uses a centered `3 + 2` layout with `36px` column gaps and `28px` row gaps.
- Mobile uses `2 + 2 + 1`; viewports at or below `359px` use one column.
- Missing `icon` configuration must fall back to the existing SVG icon mixin.
- Deliver a local preview at `http://localhost:4000/`; do not push or deploy without a new user request.

## File Structure

- Create `source/img/pokemon/*.png`: repository-owned homepage image assets with semantic filenames.
- Modify `source/_data/notebook.yml`: destination list and configurable image paths.
- Modify `themes/butterfly/layout/notebook-home.pug`: image rendering plus SVG fallback.
- Modify `source/css/notebook.css`: Pokemon image sizing and responsive five-card placement.
- Modify `test/notebook-site.test.js`: configuration, asset, generated markup, fallback, and CSS contracts.
- Modify `README.md`: maintenance instructions for changing homepage icons.

---

### Task 1: Add the Configurable Pokemon Asset Contract

**Files:**
- Create: `source/img/pokemon/pikachu.png`
- Create: `source/img/pokemon/psyduck.png`
- Create: `source/img/pokemon/eevee.png`
- Create: `source/img/pokemon/meowth.png`
- Create: `source/img/pokemon/jigglypuff.png`
- Modify: `source/_data/notebook.yml:10-16`
- Modify: `README.md:141-148`
- Test: `test/notebook-site.test.js:31-43`

**Interfaces:**
- Consumes: Source PNG files from `C:\Users\a1318\OneDrive\图片\pokemon`.
- Produces: Five destination objects with `icon: /img/pokemon/<name>.png`; five repository-owned PNG assets.

- [ ] **Step 1: Write the failing data and asset test**

Replace the destination portion of the current navigation test with:

```js
test('notebook data defines five configurable Pokemon destinations', () => {
  const data = read('source/_data/notebook.yml')
  const expected = {
    projects: '/img/pokemon/pikachu.png',
    writing: '/img/pokemon/psyduck.png',
    about: '/img/pokemon/eevee.png',
    github: '/img/pokemon/meowth.png',
    contact: '/img/pokemon/jigglypuff.png'
  }

  for (const [id, icon] of Object.entries(expected)) {
    assert.match(data, new RegExp(`id: ${id}[^\\n]*icon: ${icon.replaceAll('/', '\\\\/')}`))
    const bytes = fs.readFileSync(path.join(root, 'source', icon))
    assert.equal(bytes.subarray(1, 4).toString('ascii'), 'PNG')
  }

  assert.doesNotMatch(data, /id: notes/)
  assert.doesNotMatch(data, /label: 随记/)
})
```

Keep the wordmark and SVG symbol assertions in a separate test so the fallback assets remain protected:

```js
test('notebook fallback SVG assets remain available', () => {
  const wordmark = read('source/img/notebook/wordmark.svg')
  const icons = read('source/img/notebook/icons.svg')
  assert.match(wordmark, /aria-labelledby="wordmark-title"/)
  assert.match(icons, /<symbol id="icon-projects"/)
  assert.match(icons, /<symbol id="icon-contact"/)
})
```

- [ ] **Step 2: Run the focused test and verify RED**

Run:

```powershell
node --test --test-name-pattern="Pokemon destinations|fallback SVG assets" test/notebook-site.test.js
```

Expected: the Pokemon destination test fails because `notes` still exists, `icon` paths are missing, and the PNG files are not in the repository.

- [ ] **Step 3: Copy the assets with semantic names**

Run these exact commands from the repository root:

```powershell
New-Item -ItemType Directory -Force -Path 'source\img\pokemon'
Copy-Item -LiteralPath 'C:\Users\a1318\OneDrive\图片\pokemon\avatar_1752772.png' -Destination 'source\img\pokemon\pikachu.png'
Copy-Item -LiteralPath 'C:\Users\a1318\OneDrive\图片\pokemon\avatar_1752787.png' -Destination 'source\img\pokemon\psyduck.png'
Copy-Item -LiteralPath 'C:\Users\a1318\OneDrive\图片\pokemon\avatar_1752686.png' -Destination 'source\img\pokemon\eevee.png'
Copy-Item -LiteralPath 'C:\Users\a1318\OneDrive\图片\pokemon\avatar_1752735.png' -Destination 'source\img\pokemon\meowth.png'
Copy-Item -LiteralPath 'C:\Users\a1318\OneDrive\图片\pokemon\avatar_1752713.png' -Destination 'source\img\pokemon\jigglypuff.png'
```

Do not resize, recompress, or alter the alpha channel.

- [ ] **Step 4: Replace the destination configuration**

Set `destinations` in `source/_data/notebook.yml` to:

```yaml
destinations:
  - { id: projects, label: 作品, subtitle: Projects, url: /projects/, accent: blue, icon: /img/pokemon/pikachu.png }
  - { id: writing, label: 文章, subtitle: Writing, url: /archives/, accent: pink, icon: /img/pokemon/psyduck.png }
  - { id: about, label: 关于, subtitle: About, url: /about/, accent: purple, icon: /img/pokemon/eevee.png }
  - { id: github, label: GitHub, subtitle: Code, url: "https://github.com/LingyunAce", accent: green, external: true, icon: /img/pokemon/meowth.png }
  - { id: contact, label: 联系, subtitle: Email, url: "mailto:543491395@qq.com", accent: orange, icon: /img/pokemon/jigglypuff.png }
```

- [ ] **Step 5: Document the replacement interface**

Add this item under `README.md` → “自定义内容”:

```markdown
- **首页入口图标**：将 PNG 放入 `source/img/pokemon/`，再修改 `source/_data/notebook.yml` 对应入口的 `icon` 路径；无需修改模板或 CSS
```

Also replace the stale “首页文案” line with:

```markdown
- **首页入口与文案**：编辑 `source/_data/notebook.yml`
```

- [ ] **Step 6: Run the focused source-contract tests**

Run:

```powershell
node --test --test-name-pattern="Pokemon destinations|fallback SVG assets" test/notebook-site.test.js
```

Expected: the focused tests pass. Do not run the generated-output tests against the stale `public/` directory; Task 2 rebuilds the site after updating the template and then runs the full suite.

- [ ] **Step 7: Commit**

```powershell
git add -- source/_data/notebook.yml source/img/pokemon README.md test/notebook-site.test.js
git commit -m "feat: add configurable pokemon destination icons"
```

---

### Task 2: Render Configured Images with an SVG Fallback

**Files:**
- Modify: `themes/butterfly/layout/notebook-home.pug:25-36`
- Modify: `source/css/notebook.css:678-684`
- Test: `test/notebook-site.test.js:124-133`

**Interfaces:**
- Consumes: `item.icon: string | undefined` from each destination object.
- Produces: `<img class="notebook-destination__image" src="..." alt="...">` when configured; `notebookIcon(item.id, item.label)` otherwise.

- [ ] **Step 1: Write the failing template and generated-output test**

Add:

```js
test('homepage template renders configured images with an SVG fallback', () => {
  const template = read('themes/butterfly/layout/notebook-home.pug')
  assert.match(template, /if item\.icon/)
  assert.match(template, /img\.notebook-destination__image\(src=url_for\(item\.icon\) alt=item\.label\)/)
  assert.match(template, /else\s+\+notebookIcon\(item\.id, item\.label\)/)
})
```

Replace the generated homepage test with:

```js
test('generated homepage is a five-destination Pokemon notebook index', () => {
  const html = read('public/index.html')
  assert.match(html, /class="notebook-site notebook-home"/)
  assert.match(html, /data-theme-toggle/)
  assert.match(html, /aria-label="主要入口"/)

  const expected = {
    projects: 'pikachu.png',
    writing: 'psyduck.png',
    about: 'eevee.png',
    github: 'meowth.png',
    contact: 'jigglypuff.png'
  }

  for (const [id, filename] of Object.entries(expected)) {
    assert.match(html, new RegExp(`data-destination="${id}"[\\s\\S]*?img/pokemon/${filename}`))
  }

  assert.doesNotMatch(html, /data-destination="notes"/)
  assert.equal((html.match(/data-destination=/g) || []).length, 5)
  assert.equal((html.match(/class="notebook-destination__image"/g) || []).length, 5)
})
```

- [ ] **Step 2: Run the focused test and verify RED**

Run:

```powershell
npm.cmd run clean
npm.cmd run build
node --test --test-name-pattern="template renders configured images|five-destination Pokemon" test/notebook-site.test.js
```

Expected: the template fallback test fails because the conditional image rendering does not exist.

- [ ] **Step 3: Implement conditional image rendering**

Replace the icon call in `themes/butterfly/layout/notebook-home.pug` with:

```pug
              if item.icon
                img.notebook-destination__image(src=url_for(item.icon) alt=item.label)
              else
                +notebookIcon(item.id, item.label)
```

- [ ] **Step 4: Add image presentation rules**

Immediately after the existing `.notebook-site .notebook-icon` rule, add:

```css
.notebook-site .notebook-destination__image {
  display: block;
  width: 72px;
  height: 72px;
  object-fit: contain;
}
```

The image remains in normal card flow so the existing `margin-top: auto` on the label preserves text alignment.

- [ ] **Step 5: Rebuild and verify GREEN**

Run:

```powershell
npm.cmd run clean
npm.cmd run build
node --test --test-name-pattern="template renders configured images|five-destination Pokemon" test/notebook-site.test.js
npm.cmd test
```

Expected: build succeeds with 35 files or more; focused tests and the full suite pass.

- [ ] **Step 6: Commit**

```powershell
git add -- themes/butterfly/layout/notebook-home.pug source/css/notebook.css test/notebook-site.test.js
git commit -m "feat: render configurable pokemon home icons"
```

---

### Task 3: Open the Five-Card Layout and Verify the Local Preview

**Files:**
- Modify: `source/css/notebook.css:661-726`
- Test: `test/notebook-site.test.js`

**Interfaces:**
- Consumes: Exactly five `.notebook-destination` links in configured order.
- Produces: desktop `3 + 2`, mobile `2 + 2 + 1`, and narrow one-column placement with no document overflow.

- [ ] **Step 1: Write the failing responsive-layout test**

Add:

```js
test('Pokemon destinations use open desktop and centered mobile layouts', () => {
  const css = read('source/css/notebook.css')
  assert.match(css, /grid-template-columns:\s*repeat\(6,\s*minmax\(0,\s*78px\)\)/)
  assert.match(css, /column-gap:\s*36px/)
  assert.match(css, /row-gap:\s*28px/)
  assert.match(css, /\.notebook-destination:nth-child\(4\)[^{]*\{[^}]*grid-column:\s*2\s*\/\s*span 2/)
  assert.match(css, /\.notebook-destination:nth-child\(5\)[^{]*\{[^}]*grid-column:\s*4\s*\/\s*span 2/)
  assert.match(css, /@media \(max-width:\s*760px\)[\s\S]*grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)/)
  assert.match(css, /@media \(max-width:\s*760px\)[\s\S]*\.notebook-destination:nth-child\(5\)[^{]*\{[^}]*grid-column:\s*1\s*\/\s*-1/)
  assert.match(css, /@media \(max-width:\s*359px\)[\s\S]*grid-template-columns:\s*1fr/)
})
```

- [ ] **Step 2: Run the focused test and verify RED**

Run:

```powershell
node --test --test-name-pattern="open desktop and centered mobile layouts" test/notebook-site.test.js
```

Expected: FAIL because the current desktop grid uses three equal columns with a `16px` gap and has no five-card placement rules.

- [ ] **Step 3: Implement the desktop `3 + 2` grid**

Change the homepage-specific destination grid to:

```css
.notebook-site .notebook-cover .notebook-destinations {
  width: min(100%, 820px);
  margin-inline: auto;
  grid-template-columns: repeat(6, minmax(0, 78px));
  column-gap: 36px;
  row-gap: 28px;
  justify-content: center;
}

.notebook-site .notebook-cover .notebook-destination {
  grid-column: span 2;
}

.notebook-site .notebook-cover .notebook-destination:nth-child(4) {
  grid-column: 2 / span 2;
}

.notebook-site .notebook-cover .notebook-destination:nth-child(5) {
  grid-column: 4 / span 2;
}
```

Each desktop card is `192px` wide: two `78px` tracks plus one `36px` internal gap.

- [ ] **Step 4: Implement mobile placement resets**

Replace the homepage portion of the `max-width: 760px` media query with:

```css
@media (max-width: 760px) {
  .notebook-site .notebook-cover .notebook-destinations {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    column-gap: 16px;
    row-gap: 20px;
  }

  .notebook-site .notebook-cover .notebook-destination {
    grid-column: auto;
  }

  .notebook-site .notebook-cover .notebook-destination:nth-child(5) {
    width: calc((100% - 16px) / 2);
    grid-column: 1 / -1;
    justify-self: center;
  }

  .notebook-site .notebook-destination__image {
    width: 60px;
    height: 60px;
  }
}
```

Keep the existing `max-width: 600px` shell sizing but remove its duplicate homepage grid declaration.

Expand the `max-width: 359px` rule to:

```css
@media (max-width: 359px) {
  .notebook-site .notebook-cover .notebook-destinations {
    grid-template-columns: 1fr;
  }

  .notebook-site .notebook-cover .notebook-destination:nth-child(5) {
    width: 100%;
    grid-column: auto;
  }
}
```

- [ ] **Step 5: Run automated verification**

Run:

```powershell
npm.cmd run clean
npm.cmd run build
npm.cmd test
git diff --check
```

Expected: build succeeds; all tests pass; diff check exits `0`.

- [ ] **Step 6: Verify the local preview in a real browser**

Run:

```powershell
npm.cmd run server -- --port 4000
```

Validate `http://localhost:4000/` at:

- `1440 × 900`: three cards on row one, two centered on row two, visibly wider spacing, five undistorted Pokemon images.
- `390 × 844`: `2 + 2 + 1`, final card centered, no horizontal overflow.
- Light and dark themes: colored cards, labels, and transparent images remain readable.
- Browser console: zero errors or warnings caused by the page.
- Links: Projects, Writing, About, GitHub, and Email retain their approved targets.

Stop the local server only after the user has reviewed the preview or asks to stop it.

- [ ] **Step 7: Commit**

```powershell
git add -- source/css/notebook.css test/notebook-site.test.js
git commit -m "feat: open the five-card pokemon layout"
```

