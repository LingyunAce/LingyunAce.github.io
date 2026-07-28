# Notebook Portfolio Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild LingyunAce's Hexo portfolio as an original light/dark notebook-style site with an index homepage and a unified visual shell across projects, archives, about, and posts.

**Architecture:** Keep Hexo 7 and Butterfly 5 as the content and rendering engine. Add one notebook data file, one shared CSS file, one browser runtime with testable pure functions, original SVG assets, and small Pug includes/layout overrides; preserve Hexo's existing post, tag, category, archive, and deployment behavior.

**Tech Stack:** Hexo 7.3, Butterfly 5.5, Pug, CSS custom properties, vanilla JavaScript, Node.js built-in test runner, GitHub Pages.

## Global Constraints

- Keep the existing Hexo + Butterfly stack and existing GitHub Pages deployment target.
- Implement both light and dark themes; first visit follows `prefers-color-scheme`, manual choice persists in `localStorage`.
- Do not copy tangweijuan.com logos, illustrations, icons, personal copy, or other protected assets.
- Create an original `凌云 · LingyunAce` wordmark and original destination icons.
- Keep `source/_data/projects.yml` as the sole project data source.
- JavaScript may enhance theme switching, mobile navigation, and filtering only; navigation and content must work without it.
- Minimum interactive target is 44×44px; both themes must meet WCAG AA for body text.
- Respect `prefers-reduced-motion`.
- Validate desktop at 1440px and mobile at 390px.
- Do not commit `.firecrawl/`, `.superpowers/`, `public/`, or runtime screenshots.

---

## File Structure

### Create

- `source/_data/notebook.yml` — homepage destinations, shared navigation, role line, and about-note content.
- `source/css/notebook.css` — all notebook tokens, components, layouts, light/dark themes, and responsive behavior.
- `source/js/notebook.js` — pure theme/filter helpers plus guarded DOM initialization.
- `source/img/notebook/wordmark.svg` — original LingyunAce wordmark.
- `source/img/notebook/icons.svg` — original SVG symbol sprite for destinations and page headings.
- `themes/butterfly/layout/includes/notebook/header.pug` — shared wordmark, tabs, theme toggle, and mobile navigation.
- `themes/butterfly/layout/includes/notebook/footer.pug` — shared footer links and copyright.
- `themes/butterfly/layout/includes/notebook/icon.pug` — SVG sprite helper mixin.
- `themes/butterfly/layout/notebook-home.pug` — index-style notebook homepage.
- `themes/butterfly/layout/notebook-about.pug` — scattered-note about page.
- `test/notebook-site.test.js` — source-contract and generated-site regression tests.

### Modify

- `package.json` — add the built-in Node test command.
- `package-lock.json` — lock the RSS generator dependency.
- `_config.yml` — generate the approved `/atom.xml` footer target.
- `_config.butterfly.yml` — inject `notebook.css` and `notebook.js`; remove superseded custom injections.
- `source/index.md` — replace standalone HTML with `layout: notebook-home`.
- `source/about/index.md` — switch to `layout: notebook-about`; retain the approved profile facts.
- `themes/butterfly/layout/includes/layout.pug` — select the notebook shell for non-home pages without removing Butterfly content widgets.
- `themes/butterfly/layout/projects.pug` — notebook project grid with resilient missing-link/image behavior.
- `themes/butterfly/layout/archive.pug` — compact notebook archive list.
- `themes/butterfly/layout/post.pug` — notebook reading shell around Butterfly post content.

### Delete after replacement

- `source/css/home.css` — superseded by `source/css/notebook.css`.
- `source/css/portfolio.styl` — superseded by `source/css/notebook.css`.
- `source/js/projects-filter.js` — filtering moves into `source/js/notebook.js`.

---

### Task 1: Notebook data, assets, theme runtime, and regression harness

**Files:**
- Create: `source/_data/notebook.yml`
- Create: `source/css/notebook.css`
- Create: `source/js/notebook.js`
- Create: `source/img/notebook/wordmark.svg`
- Create: `source/img/notebook/icons.svg`
- Create: `test/notebook-site.test.js`
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `_config.yml`
- Modify: `_config.butterfly.yml`

**Interfaces:**
- Consumes: existing `config.author`, `config.email`, and `/source/_data/projects.yml`.
- Produces: `resolveTheme(savedTheme, prefersDark) -> "light" | "dark"`.
- Produces: `nextTheme(currentTheme) -> "light" | "dark"`.
- Produces: `tagsMatch(activeTag, csvTags) -> boolean`.
- Produces: CSS contracts `.notebook-site`, `.notebook-header`, `.notebook-footer`, `.notebook-card`, `[data-theme="dark"]`.
- Produces: YAML keys `role`, `nav`, `destinations`, `about_notes`, and `footer_links`.

- [ ] **Step 1: Add the failing source-contract tests**

Create `test/notebook-site.test.js`:

```js
const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const root = path.resolve(__dirname, '..')
const read = relativePath =>
  fs.readFileSync(path.join(root, relativePath), 'utf8')

const {
  resolveTheme,
  nextTheme,
  tagsMatch
} = require('../source/js/notebook.js')

test('theme resolution follows saved choice before system choice', () => {
  assert.equal(resolveTheme('dark', false), 'dark')
  assert.equal(resolveTheme('light', true), 'light')
  assert.equal(resolveTheme(null, true), 'dark')
  assert.equal(resolveTheme(null, false), 'light')
  assert.equal(nextTheme('dark'), 'light')
  assert.equal(nextTheme('light'), 'dark')
})

test('project tag matching supports all and comma-delimited tags', () => {
  assert.equal(tagsMatch('all', 'React,TypeScript'), true)
  assert.equal(tagsMatch('React', 'React,TypeScript'), true)
  assert.equal(tagsMatch('Go', 'React,TypeScript'), false)
})

test('notebook data and original assets define the approved navigation', () => {
  const data = read('source/_data/notebook.yml')
  assert.match(data, /role: "Independent Developer · Writer"/)
  for (const id of ['projects', 'writing', 'notes', 'about', 'github', 'contact']) {
    assert.match(data, new RegExp(`id: ${id}`))
  }

  const wordmark = read('source/img/notebook/wordmark.svg')
  const icons = read('source/img/notebook/icons.svg')
  assert.match(wordmark, /aria-labelledby="wordmark-title"/)
  assert.match(icons, /<symbol id="icon-projects"/)
  assert.match(icons, /<symbol id="icon-contact"/)
})

test('approved RSS footer target is generated by Hexo', () => {
  const packageJson = JSON.parse(read('package.json'))
  assert.ok(packageJson.devDependencies['hexo-generator-feed'])
  assert.match(read('_config.yml'), /feed:\s*\n\s+type:\s+atom\s*\n\s+path:\s+atom\.xml/)
})

test('theme stylesheet contains both palettes and reduced-motion rules', () => {
  const css = read('source/css/notebook.css')
  assert.match(css, /--notebook-canvas:\s*#ecebeb/i)
  assert.match(css, /\[data-theme="dark"\]/)
  assert.match(css, /--notebook-paper:\s*#242225/i)
  assert.match(css, /prefers-reduced-motion:\s*reduce/)
  assert.match(css, /min-height:\s*44px/)
})
```

- [ ] **Step 2: Add the test command and verify the test fails**

Add to `package.json`:

```json
"test": "node --test test/notebook-site.test.js"
```

Run:

```powershell
npm test
```

Expected: FAIL because `source/js/notebook.js`, notebook data, CSS, and SVG assets do not exist.

- [ ] **Step 3: Install and configure the RSS generator**

Run:

```powershell
npm install --save-dev hexo-generator-feed
```

Append to `_config.yml`:

```yaml
feed:
  type: atom
  path: atom.xml
  limit: 20
  content: true
  order_by: -date
```

Expected: `package.json` and `package-lock.json` record `hexo-generator-feed`, and the next build emits `public/atom.xml`.

- [ ] **Step 4: Create the approved notebook data**

Create `source/_data/notebook.yml` with these exact routes and labels:

```yaml
role: "Independent Developer · Writer"

nav:
  - { id: home, label: 首页, url: / }
  - { id: projects, label: 作品, url: /projects/ }
  - { id: writing, label: 文章, url: /archives/ }
  - { id: about, label: 关于, url: /about/ }
  - { id: github, label: "GitHub ↗", url: "https://github.com/LingyunAce", external: true }

destinations:
  - { id: projects, label: 作品, subtitle: Projects, url: /projects/, accent: blue }
  - { id: writing, label: 文章, subtitle: Writing, url: /archives/, accent: pink }
  - { id: notes, label: 随记, subtitle: Notes, url: /tags/随笔/, accent: yellow }
  - { id: about, label: 关于, subtitle: About, url: /about/, accent: purple }
  - { id: github, label: GitHub, subtitle: Code, url: "https://github.com/LingyunAce", accent: green, external: true }
  - { id: contact, label: 联系, subtitle: Email, url: "mailto:543491395@qq.com", accent: orange }

about_notes:
  - id: hello
    title: Hello
    lines: ["我是凌云", "独立开发者 / 工程师", "关注产品、系统与写作"]
  - id: doing
    title: 正在做
    lines: ["Web 应用", "数据可视化", "开发工具"]
  - id: tools
    title: 常用工具
    lines: ["React · TypeScript", "Python · Go", "Git · Docker"]
  - id: interests
    title: 兴趣
    lines: ["独立开发", "技术写作", "持续学习"]
  - id: contact
    title: 联系我
    lines: ["GitHub @LingyunAce", "543491395@qq.com"]

footer_links:
  - { label: GitHub, url: "https://github.com/LingyunAce", external: true }
  - { label: 邮箱, url: "mailto:543491395@qq.com" }
  - { label: RSS, url: /atom.xml }
```

- [ ] **Step 5: Implement testable browser helpers and guarded initialization**

Create `source/js/notebook.js` with pure exports before DOM initialization:

```js
;(function (root) {
  const STORAGE_KEY = 'lingyunace-notebook-theme'
  const VALID_THEMES = new Set(['light', 'dark'])

  function resolveTheme(savedTheme, prefersDark) {
    if (VALID_THEMES.has(savedTheme)) return savedTheme
    return prefersDark ? 'dark' : 'light'
  }

  function nextTheme(currentTheme) {
    return currentTheme === 'dark' ? 'light' : 'dark'
  }

  function tagsMatch(activeTag, csvTags) {
    if (activeTag === 'all') return true
    return String(csvTags || '')
      .split(',')
      .map(tag => tag.trim())
      .includes(activeTag)
  }

  function applyTheme(theme) {
    document.documentElement.dataset.theme = theme
    document.querySelectorAll('[data-theme-toggle]').forEach(button => {
      button.setAttribute('aria-pressed', String(theme === 'dark'))
      button.setAttribute(
        'aria-label',
        theme === 'dark' ? '切换到浅色主题' : '切换到暗色主题'
      )
    })
  }

  function initNotebook() {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    let savedTheme = null
    try {
      savedTheme = window.localStorage.getItem(STORAGE_KEY)
    } catch (_) {}
    applyTheme(resolveTheme(savedTheme, prefersDark))

    document.querySelectorAll('[data-theme-toggle]').forEach(button => {
      button.addEventListener('click', () => {
        const theme = nextTheme(document.documentElement.dataset.theme)
        applyTheme(theme)
        try {
          window.localStorage.setItem(STORAGE_KEY, theme)
        } catch (_) {}
      })
    })

    document.querySelectorAll('[data-project-filter]').forEach(button => {
      button.addEventListener('click', () => {
        const activeTag = button.dataset.projectFilter
        let visibleCount = 0
        document.querySelectorAll('[data-project-tags]').forEach(card => {
          const visible = tagsMatch(activeTag, card.dataset.projectTags)
          card.hidden = !visible
          if (visible) visibleCount += 1
        })
        document.querySelectorAll('[data-project-filter]').forEach(item => {
          item.setAttribute('aria-pressed', String(item === button))
        })
        const status = document.querySelector('[data-project-status]')
        if (status) status.textContent = `显示 ${visibleCount} 个项目`
      })
    })
  }

  const api = { resolveTheme, nextTheme, tagsMatch }
  if (typeof module !== 'undefined' && module.exports) module.exports = api
  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initNotebook)
    } else {
      initNotebook()
    }
  }
})(typeof globalThis !== 'undefined' ? globalThis : this)
```

- [ ] **Step 6: Create original SVG assets and the CSS token contract**

Create `wordmark.svg` with an accessible `<title id="wordmark-title">凌云 · LingyunAce</title>`, original vector text/paths, and a pink highlighter path. Create `icons.svg` with symbols `icon-projects`, `icon-writing`, `icon-notes`, `icon-about`, `icon-github`, and `icon-contact`; use only original geometric paths with `currentColor`.

Start `source/css/notebook.css` with the approved values:

```css
:root {
  --notebook-canvas: #ecebeb;
  --notebook-paper: #fcf9fb;
  --notebook-ink: #171717;
  --notebook-muted: #686166;
  --notebook-grid: rgba(212, 203, 211, 0.38);
  --notebook-border: #e8e1e5;
  --notebook-pink: #ef4f98;
  --notebook-blue: #69b8ff;
  --notebook-yellow: #ffd34d;
  --notebook-purple: #9b8cff;
  --notebook-green: #6bd4a2;
  --notebook-orange: #ff9e63;
  --notebook-radius: 32px;
  --notebook-max: 1280px;
}

[data-theme="dark"] {
  --notebook-canvas: #151515;
  --notebook-paper: #242225;
  --notebook-ink: #f4f1f3;
  --notebook-muted: #b8b0b5;
  --notebook-grid: rgba(255, 255, 255, 0.055);
  --notebook-border: #454046;
}

.notebook-theme-toggle,
.notebook-tab,
.notebook-destination {
  min-width: 44px;
  min-height: 44px;
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    scroll-behavior: auto !important;
    transition-duration: 0.01ms !important;
    animation-duration: 0.01ms !important;
  }
}
```

Add named sections for base/reset, shared shell, header/tabs, homepage notebook, destination cards, project grid, archive list, about notes, post reading layout, footer, dark-theme adjustments, and 900px/600px responsive rules. Keep every selector under `.notebook-site` except root tokens and accessibility utilities.

- [ ] **Step 7: Replace the old injections**

Update `_config.butterfly.yml`:

```yaml
inject:
  head:
    - <link rel="stylesheet" href="/css/notebook.css">
  bottom:
    - <script src="/js/notebook.js" defer></script>
```

- [ ] **Step 8: Run the focused tests and commit**

Run:

```powershell
npm test
```

Expected: 5 tests PASS.

Commit:

```powershell
git add package.json package-lock.json _config.yml _config.butterfly.yml source/_data/notebook.yml source/css/notebook.css source/js/notebook.js source/img/notebook test/notebook-site.test.js
git commit -m "feat: add notebook design foundation"
```

---

### Task 2: Index-style notebook homepage

**Files:**
- Create: `themes/butterfly/layout/notebook-home.pug`
- Create: `themes/butterfly/layout/includes/notebook/icon.pug`
- Modify: `source/index.md`
- Modify: `source/css/notebook.css`
- Modify: `test/notebook-site.test.js`
- Delete: `source/css/home.css`

**Interfaces:**
- Consumes: `site.data.notebook.destinations`, `site.data.notebook.role`, and SVG symbols from `/img/notebook/icons.svg`.
- Produces: six anchors with `data-destination="<id>"`.
- Produces: `button[data-theme-toggle]`.
- Produces: semantic `header`, `main`, `nav`, and `footer` landmarks.

- [ ] **Step 1: Add the failing generated-homepage test**

Append to `test/notebook-site.test.js`:

```js
test('generated homepage is a six-destination notebook index', () => {
  const html = read('public/index.html')
  assert.match(html, /class="notebook-site notebook-home"/)
  assert.match(html, /data-theme-toggle/)
  assert.match(html, /aria-label="主要入口"/)
  for (const id of ['projects', 'writing', 'notes', 'about', 'github', 'contact']) {
    assert.match(html, new RegExp(`data-destination="${id}"`))
  }
  assert.equal((html.match(/data-destination=/g) || []).length, 6)
})
```

- [ ] **Step 2: Verify the homepage test fails**

Run:

```powershell
npm run clean
npm run build
npm test
```

Expected: the new homepage test FAILS because the current page is standalone gallery HTML.

- [ ] **Step 3: Add the reusable SVG icon mixin**

Create `themes/butterfly/layout/includes/notebook/icon.pug`:

```pug
mixin notebookIcon(name, label)
  svg.notebook-icon(role="img" aria-label=label)
    use(href=url_for(`/img/notebook/icons.svg#icon-${name}`))
```

- [ ] **Step 4: Implement the notebook homepage**

Create `themes/butterfly/layout/notebook-home.pug` as a complete HTML document so the homepage does not inherit Butterfly's article chrome:

```pug
include includes/notebook/icon.pug

doctype html
html(lang=config.language data-theme="light")
  head
    meta(charset="UTF-8")
    meta(name="viewport" content="width=device-width, initial-scale=1")
    title= page.title
    meta(name="description" content=page.description)
    link(rel="stylesheet" href=url_for("/css/notebook.css"))
    script(src=url_for("/js/notebook.js") defer)
  body.notebook-site.notebook-home
    a.notebook-skip(href="#main") 跳到主内容
    header.notebook-homebar
      a.notebook-wordmark(href="/" aria-label="凌云首页")
        img(src=url_for("/img/notebook/wordmark.svg") alt="凌云 · LingyunAce")
      button.notebook-theme-toggle(type="button" data-theme-toggle aria-pressed="false" aria-label="切换到暗色主题") ◐
    main#main
      section.notebook-cover(aria-labelledby="home-role")
        .notebook-rings(aria-hidden="true")
          each ring in [1, 2, 3, 4, 5, 6, 7, 8]
            i
        img.notebook-cover__wordmark(src=url_for("/img/notebook/wordmark.svg") alt="")
        p#home-role.notebook-cover__role= site.data.notebook.role
        nav.notebook-destinations(aria-label="主要入口")
          each item in site.data.notebook.destinations
            a.notebook-destination(
              href=url_for(item.url)
              class=`is-${item.accent}`
              data-destination=item.id
              target=item.external ? "_blank" : null
              rel=item.external ? "noopener" : null
            )
              +notebookIcon(item.id, item.label)
              span.notebook-destination__label= item.label
              small= item.subtitle
    footer.notebook-home-footer
      span &copy; #{new Date().getFullYear()} 凌云
```

- [ ] **Step 5: Reduce the homepage source to front matter**

Replace `source/index.md` with:

```markdown
---
title: 凌云 · 独立开发者
date: 2026-06-01 12:00:00
layout: notebook-home
description: 凌云的个人作品集——Web 应用、数据可视化、工具链与技术写作。
aside: false
comment: false
---
```

Delete `source/css/home.css` only after the new page builds.

- [ ] **Step 6: Complete homepage CSS and verify**

Implement `.notebook-cover`, `.notebook-rings`, `.notebook-destinations`, `.notebook-destination`, six accent classes, hover/focus behavior, 3-column desktop, 2-column tablet, and single-column fallback below 360px. Decorative rings must use `aria-hidden` in markup and be hidden below 600px.

Run:

```powershell
npm run clean
npm run build
npm test
```

Expected: all tests PASS; `public/index.html` contains exactly six destination cards.

- [ ] **Step 7: Commit**

```powershell
git add source/index.md source/css/notebook.css themes/butterfly/layout/notebook-home.pug themes/butterfly/layout/includes/notebook/icon.pug test/notebook-site.test.js
git add -u source/css/home.css
git commit -m "feat: build notebook index homepage"
```

---

### Task 3: Shared notebook shell, projects, and about

**Files:**
- Create: `themes/butterfly/layout/includes/notebook/header.pug`
- Create: `themes/butterfly/layout/includes/notebook/footer.pug`
- Create: `themes/butterfly/layout/notebook-about.pug`
- Modify: `themes/butterfly/layout/includes/layout.pug`
- Modify: `themes/butterfly/layout/projects.pug`
- Modify: `source/about/index.md`
- Modify: `source/css/notebook.css`
- Modify: `test/notebook-site.test.js`
- Delete: `source/css/portfolio.styl`
- Delete: `source/js/projects-filter.js`

**Interfaces:**
- Consumes: `site.data.notebook.nav`, `site.data.notebook.about_notes`, `site.data.notebook.footer_links`, and `site.data.projects`.
- Produces: `.notebook-header`, `.notebook-tabs`, `.notebook-footer`.
- Produces: project buttons with `data-project-filter` and cards with `data-project-tags`.
- Produces: live result element `[data-project-status][aria-live="polite"]`.

- [ ] **Step 1: Add failing project/about generated-page tests**

Append:

```js
test('projects page uses shared shell and renders project data', () => {
  const html = read('public/projects/index.html')
  assert.match(html, /class="notebook-header"/)
  assert.match(html, /aria-current="page"[^>]*>作品</)
  assert.match(html, /data-project-filter="all"/)
  assert.match(html, /data-project-status/)
  assert.equal(
    (html.match(/data-project-tags=/g) || []).length,
    6
  )
})

test('about page renders approved notes in semantic order', () => {
  const html = read('public/about/index.html')
  assert.match(html, /class="notebook-about-notes"/)
  for (const title of ['Hello', '正在做', '常用工具', '兴趣', '联系我']) {
    assert.match(html, new RegExp(title))
  }
  assert.match(html, /class="notebook-footer"/)
})
```

- [ ] **Step 2: Verify the tests fail**

Run:

```powershell
npm run clean
npm run build
npm test
```

Expected: project/about tests FAIL because the shared notebook shell does not exist.

- [ ] **Step 3: Implement shared header and footer**

`header.pug` must:

- Render `/img/notebook/wordmark.svg`.
- Render every `site.data.notebook.nav` item.
- Set `aria-current="page"` using `page.path` and the nav URL.
- Add a 44×44px theme toggle.
- Keep external links `target="_blank" rel="noopener"`.

`footer.pug` must:

- Render the current year and `config.author`.
- Render `footer_links`.
- Keep the email and RSS links in the same window.

Use this partial contract from `includes/layout.pug`:

```pug
body.notebook-site
  a.notebook-skip(href="#content-inner") 跳到主内容
  include notebook/header.pug
  main#content-inner.notebook-main
    block content
  include notebook/footer.pug
  include ./additional-js.pug
```

Preserve Butterfly sidebar/widgets only where a post explicitly needs them; set notebook pages to `aside: false`.

- [ ] **Step 4: Rebuild the projects template with resilient rendering**

For each project:

- Use `project.link` when present; otherwise render a non-anchor `.notebook-project`.
- Use `project.cover` when present and add an `onerror` fallback class.
- Always render an `.notebook-project__fallback` containing the project name.
- Set `data-project-tags=project.tags.join(',')`.
- Render technology chips and a screen-reader external-link label.

Add filter controls:

```pug
.notebook-project-filters(aria-label="按技术筛选项目")
  button(type="button" data-project-filter="all" aria-pressed="true") 全部
  each tag in [...new Set(site.data.projects.flatMap(project => project.tags))]
    button(type="button" data-project-filter=tag aria-pressed="false")= tag
p.notebook-sr-only(data-project-status aria-live="polite")= `显示 ${site.data.projects.length} 个项目`
```

- [ ] **Step 5: Implement the about-note layout**

Set `source/about/index.md` to:

```markdown
---
title: 关于我
date: 2026-06-01 12:00:00
layout: notebook-about
aside: false
comment: false
---
```

Render `site.data.notebook.about_notes` in source order as `<article>` elements. CSS may visually reposition them at desktop widths, but grid and mobile ordering must remain the YAML order.

- [ ] **Step 6: Remove superseded assets, build, and test**

Delete `source/css/portfolio.styl` and `source/js/projects-filter.js` after `_config.butterfly.yml` no longer references them.

Run:

```powershell
npm run clean
npm run build
npm test
```

Expected: all tests PASS; six project cards render; five about notes render.

- [ ] **Step 7: Commit**

```powershell
git add themes/butterfly/layout/includes/layout.pug themes/butterfly/layout/includes/notebook themes/butterfly/layout/projects.pug themes/butterfly/layout/notebook-about.pug source/about/index.md source/css/notebook.css test/notebook-site.test.js
git add -u source/css/portfolio.styl source/js/projects-filter.js
git commit -m "feat: unify projects and about with notebook shell"
```

---

### Task 4: Archives and post reading shell

**Files:**
- Modify: `themes/butterfly/layout/archive.pug`
- Modify: `themes/butterfly/layout/post.pug`
- Modify: `themes/butterfly/layout/includes/mixins/article-sort.pug`
- Modify: `source/css/notebook.css`
- Modify: `test/notebook-site.test.js`

**Interfaces:**
- Consumes: Hexo `page.posts`, post metadata, pagination, tags, and Butterfly post-body partials.
- Produces: `.notebook-archive`, `.notebook-archive-item`, `.notebook-post`, and `.notebook-reading`.
- Preserves: post content, code blocks, tags, pagination, copyright, and related-post behavior.

- [ ] **Step 1: Add failing archive/post tests**

Append:

```js
test('archive is a compact chronological notebook list', () => {
  const html = read('public/archives/index.html')
  assert.match(html, /class="notebook-archive"/)
  assert.match(html, /class="notebook-archive-item"/)
  assert.match(html, /aria-current="page"[^>]*>文章</)
})

test('post pages keep article content inside the notebook reading shell', () => {
  const html = read('public/2026/06/01/hexo-setup-notes/index.html')
  assert.match(html, /class="notebook-post"/)
  assert.match(html, /class="[^"]*notebook-reading[^"]*"/)
  assert.match(html, /Hexo 建站笔记/)
  assert.match(html, /<pre/)
})
```

- [ ] **Step 2: Verify the tests fail**

Run:

```powershell
npm run clean
npm run build
npm test
```

Expected: archive/post tests FAIL because Butterfly still emits its default class structure.

- [ ] **Step 3: Implement the archive list without replacing Hexo pagination**

Update `archive.pug` and the article-sort mixin so each item contains:

- Machine-readable `<time datetime="YYYY-MM-DD">`.
- Visible `MM.DD` date.
- Post title.
- Description when available.
- Existing post URL.

Keep the existing `includes/pagination.pug` call. Do not add client-side fetching or duplicate post data.

- [ ] **Step 4: Wrap the existing post body in the reading shell**

Update `post.pug`:

```pug
#post.notebook-post
  if top_img === false
    include includes/header/post-info.pug
  article#article-container.container.post-content.notebook-reading
    if theme.noticeOutdate.enable && page.noticeOutdate !== false
      include includes/post/outdate-notice.pug
    else
      !=page.content
```

Keep the existing copyright, tags, sharing, reward, pagination, related-post, and comments conditions after the reading article.

- [ ] **Step 5: Add reading and archive CSS**

Implement:

- Archive maximum width 780px.
- A single vertical guide line.
- Date/title/description responsive grid.
- Post reading maximum width 760px.
- No grid background or rotated text inside `.notebook-reading`.
- Code blocks remain horizontally scrollable and retain Butterfly copy controls.
- Heading anchors and keyboard focus remain visible.

- [ ] **Step 6: Build, test, and commit**

Run:

```powershell
npm run clean
npm run build
npm test
```

Expected: all tests PASS and the known Hexo setup article still contains a `<pre>` block.

Commit:

```powershell
git add themes/butterfly/layout/archive.pug themes/butterfly/layout/post.pug themes/butterfly/layout/includes/mixins/article-sort.pug source/css/notebook.css test/notebook-site.test.js
git commit -m "feat: style archives and posts as notebook pages"
```

---

### Task 5: Accessibility, responsive visual verification, and closeout

**Files:**
- Modify: `source/css/notebook.css`
- Modify: `source/js/notebook.js`
- Modify: `test/notebook-site.test.js`
- Modify: `README.md`

**Interfaces:**
- Consumes: all pages and browser behaviors from Tasks 1-4.
- Produces: verified desktop/mobile layouts, keyboard navigation, persistent theme behavior, reduced-motion behavior, and updated development commands.

- [ ] **Step 1: Add the final accessibility contract test**

Append:

```js
test('generated core pages expose skip links and labeled theme controls', () => {
  for (const relativePath of [
    'public/index.html',
    'public/projects/index.html',
    'public/about/index.html',
    'public/archives/index.html'
  ]) {
    const html = read(relativePath)
    assert.match(html, /跳到主内容/)
    assert.match(html, /data-theme-toggle/)
    assert.match(html, /aria-label="切换到(浅色|暗色)主题"/)
  }
})
```

- [ ] **Step 2: Run the contract test and fix any failures**

Run:

```powershell
npm run clean
npm run build
npm test
```

Expected: all tests PASS. If a page fails, add the existing shared header/skip-link partial rather than duplicating markup.

- [ ] **Step 3: Start a bounded local preview**

Run the server as a yielded/background process:

```powershell
npx hexo server --port 4000
```

Expected: `Hexo is running at http://localhost:4000/`.

Stop condition: stop the server after browser verification or immediately if startup produces a template/build error.

- [ ] **Step 4: Verify desktop and mobile in the browser**

At 1440px and 390px, inspect:

- `/`
- `/projects/`
- `/about/`
- `/archives/`
- `/2026/06/01/hexo-setup-notes/`

For each viewport:

- No horizontal scrolling.
- No overlapping tabs, rings, cards, notes, or footer.
- Homepage has six destinations.
- Projects render six cards.
- About renders five notes.
- Post body and code block remain readable.

Capture temporary screenshots outside tracked paths and compare them to the approved companion mockups.

- [ ] **Step 5: Verify interactions and accessibility**

Using keyboard and browser tools:

1. Tab from the skip link through the theme toggle and all homepage destinations.
2. Switch light → dark, reload, and confirm dark remains selected.
3. Switch dark → light, reload, and confirm light remains selected.
4. Filter projects to `React`; confirm only matching cards remain and the live status count changes.
5. Filter back to `全部`.
6. Emulate `prefers-reduced-motion: reduce`; confirm hover/transition movement is removed.
7. Confirm external GitHub links use `rel="noopener"` and email uses `mailto:`.

- [ ] **Step 6: Update README commands and architecture notes**

Add:

````markdown
## 验证

```bash
npm test
npm run clean
npm run build
npm run server
```

首页、作品、文章归档和关于页共享 `source/css/notebook.css` 与
`source/js/notebook.js`。首页入口和关于便签维护在
`source/_data/notebook.yml`，项目继续维护在
`source/_data/projects.yml`。
````

- [ ] **Step 7: Run final clean verification**

Run:

```powershell
npm ci
npm test
npm run clean
npm run build
git diff --check
git status --short
```

Expected:

- `npm ci`: exit 0.
- `npm test`: all tests PASS.
- `npm run build`: exit 0 with no missing template/resource/YAML errors.
- `git diff --check`: no whitespace errors.
- `git status --short`: only the intended Task 5 files are modified.

- [ ] **Step 8: Commit**

```powershell
git add README.md source/css/notebook.css source/js/notebook.js test/notebook-site.test.js
git commit -m "test: verify notebook redesign across viewports"
```

- [ ] **Step 9: Inspect the final commit range**

Run:

```powershell
git log --oneline 9cb2336..HEAD
git status --short
```

Expected: five focused implementation commits after design commit `9cb2336`; worktree clean.
