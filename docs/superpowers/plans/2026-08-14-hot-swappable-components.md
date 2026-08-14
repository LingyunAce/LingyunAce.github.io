# 凌云个人网站「组件化热拔插」实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把凌云个人网站（Hexo + Butterfly）拆分为自包含组件，用 `source/_data/components.yml` 一个配置实现组件的增删、排序、开关与替换，组件放入 `components/` 目录即被自动发现（即插即用）。

**Architecture:** 一个纯函数引擎（`lib/components-engine.js`）负责扫描组件注册表、解析插槽、合并 props、校验配置、打包资源；一个 Hexo 脚本（`scripts/components.js`）把它接到 Hexo 的 helper（`render_slot`/`render_component`）和 generator（打包 `components.css`/`components.js`）上。页面 Pug 模板退化为「薄壳」，只调用 `render_slot(插槽)`。

**Tech Stack:** Hexo 7.3、Butterfly 5（Pug 渲染）、Node 20、js-yaml（Hexo 已内置）。

---

## 设计调整（相对已确认规格的两处澄清，需知晓）

1. **博客列表/详情只组件化「外壳」**：规格里 `archive-list`、`post-body` 两个组件**不落地**。归档与文章内页的正文渲染沿用 Butterfly 现有 `archive.pug`/`post.pug`（规格非目标明确「不重写 Hexo 归档/文章渲染」），它们已经通过 `includes/layout.pug` 复用组件化的 header/footer 外壳。因此首期组件为 9 个（见下）。
2. **样式/脚本自包含延迟到后续**：本计划交付「模板组件化 + 配置编排 + 引擎（含 style.css/script.js/data.yml 打包基础设施）」；现有 9 个组件继续复用全局 `source/css/notebook.css` 与 `source/js/notebook.js`（渲染产物与视觉 100% 不变，现有测试几乎全绿）。引擎的 `style.css`/`script.js` 打包能力就绪，未来新增带自定义样式的组件即可用，无需再改模板。

**首期 9 个组件**：`home-header`、`site-header`、`home-footer`、`site-footer`、`role-line`、`destination-grid`、`about-notes`、`project-gallery`、`scheme-picker`。

---

## 文件结构

**新建：**
- `lib/components-engine.js` — 纯函数引擎（扫描/解析插槽/合并/校验/打包），无 hexo 依赖，可单测
- `scripts/components.js` — Hexo 接线（helper + generator + 校验）
- `source/_data/components.yml` — 编排配置
- `components/{site-header,site-footer,home-header,home-footer,role-line,destination-grid,about-notes,project-gallery,scheme-picker}/component.yml` + `template.pug`
- `test/components-engine.test.js` — 引擎单测

**修改：**
- `themes/butterfly/layout/includes/layout.pug` — `include` 换 `render_slot`
- `themes/butterfly/layout/notebook-home.pug` — 薄壳 + 插槽 + 资源链接
- `themes/butterfly/layout/notebook-about.pug`、`projects.pug` — 薄壳
- `_config.butterfly.yml` — inject 组件资源包
- `package.json` — test 脚本纳入新测试文件
- `test/notebook-site.test.js` — 更新 1 处模板断言 + 新增集成断言
- `README.md` — 组件系统说明

**不改：** `source/css/notebook.css`、`source/js/notebook.js`、`source/_data/notebook.yml`、`source/_data/projects.yml`。

---

## Task 1: 组件引擎纯函数模块

**Files:**
- Create: `lib/components-engine.js`
- Create: `test/components-engine.test.js`
- Modify: `package.json`

- [ ] **Step 1: 写引擎模块**

创建 `lib/components-engine.js`（完整内容）：

```js
'use strict'

const fs = require('fs')
const path = require('path')
const yaml = require('js-yaml')

function readText(file) {
  try {
    return fs.readFileSync(file, 'utf8')
  } catch (_) {
    return ''
  }
}

function readYaml(file) {
  const raw = readText(file)
  if (!raw.trim()) return undefined
  return yaml.load(raw) || undefined
}

// 扫描 componentsDir 下所有子目录，读取每个目录的 component.yml，
// 返回 Map<id, component>。校验 id 唯一、template.pug 存在。
function scanComponents(componentsDir) {
  const registry = new Map()
  if (!fs.existsSync(componentsDir)) return registry
  const names = fs.readdirSync(componentsDir, { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .map(entry => entry.name)
    .sort()

  for (const name of names) {
    const dir = path.join(componentsDir, name)
    const manifestPath = path.join(dir, 'component.yml')
    if (!fs.existsSync(manifestPath)) continue
    const manifest = yaml.load(fs.readFileSync(manifestPath, 'utf8')) || {}
    const id = manifest.id || name
    if (registry.has(id)) {
      throw new Error(`组件 id 重复: "${id}"（目录 ${name}）`)
    }
    const templatePath = path.join(dir, 'template.pug')
    if (!fs.existsSync(templatePath)) {
      throw new Error(`组件 "${id}" 缺少 template.pug`)
    }
    registry.set(id, {
      id,
      name: manifest.name || id,
      description: manifest.description || '',
      slots: Array.isArray(manifest.slots) ? manifest.slots : [],
      defaults: manifest.defaults || {},
      templatePath,
      style: readText(path.join(dir, 'style.css')),
      script: readText(path.join(dir, 'script.js')),
      data: readYaml(path.join(dir, 'data.yml'))
    })
  }
  return registry
}

// 页面输出路径 → 配置里的页面键（无则返回 null，表示只用 global 插槽）
function resolvePageType(page) {
  if (!page || !page.path) return null
  const p = String(page.path)
  if (p === 'index.html') return 'home'
  if (p === 'about/index.html') return 'about'
  if (p === 'projects/index.html') return 'projects'
  return null
}

// 解析某页面某插槽的组件实例列表：pages.<page>.<slot> 优先，回退 global.<slot>
function resolveSlotInstances(config, pageType, slot) {
  const global = (config && config.global) || {}
  const pages = (config && config.pages) || {}
  const pageSlots = (pageType && pages[pageType]) || {}
  const own = pageSlots[slot]
  if (Array.isArray(own)) return own
  const fallback = global[slot]
  return Array.isArray(fallback) ? fallback : []
}

// 去掉 enabled === false 的实例
function filterEnabled(instances) {
  return instances.filter(instance => instance && instance.enabled !== false)
}

// defaults 被 props 覆盖
function mergeProps(defaults, props) {
  return Object.assign({}, defaults || {}, props || {})
}

// 配置引用未知组件时抛错（fail fast）
function validateConfig(registry, config) {
  if (!config) return
  for (const section of [config.global, config.pages]) {
    if (!section || typeof section !== 'object') continue
    for (const [slot, instances] of Object.entries(section)) {
      const list = Array.isArray(instances) ? instances : []
      for (const instance of list) {
        const id = instance && instance.component
        if (id && !registry.has(id)) {
          throw new Error(`components.yml 引用未知组件 "${id}"（插槽 "${slot}"）`)
        }
      }
    }
  }
}

function buildCssBundle(registry) {
  return [...registry.values()].map(c => c.style).filter(Boolean).join('\n')
}

function buildJsBundle(registry) {
  return [...registry.values()].map(c => c.script).filter(Boolean).join('\n')
}

module.exports = {
  scanComponents,
  resolvePageType,
  resolveSlotInstances,
  filterEnabled,
  mergeProps,
  validateConfig,
  buildCssBundle,
  buildJsBundle
}
```

- [ ] **Step 2: 写引擎单测**

创建 `test/components-engine.test.js`（完整内容）：

```js
const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')

const {
  scanComponents,
  resolvePageType,
  resolveSlotInstances,
  filterEnabled,
  mergeProps,
  validateConfig,
  buildCssBundle,
  buildJsBundle
} = require('../lib/components-engine.js')

function makeTmpComponent(dir, name, manifest, files = {}) {
  const componentDir = path.join(dir, name)
  fs.mkdirSync(componentDir, { recursive: true })
  fs.writeFileSync(path.join(componentDir, 'component.yml'), manifest)
  fs.writeFileSync(path.join(componentDir, 'template.pug'), 'span= props.label\n')
  for (const [filename, content] of Object.entries(files)) {
    fs.writeFileSync(path.join(componentDir, filename), content)
  }
  return componentDir
}

function withTmpDir(fn) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'components-engine-'))
  try {
    return fn(dir)
  } finally {
    fs.rmSync(dir, { recursive: true, force: true })
  }
}

test('scanComponents discovers valid components', () => {
  withTmpDir(dir => {
    makeTmpComponent(dir, 'alpha', 'id: alpha\nname: A\nslots: [global.header]\n')
    makeTmpComponent(dir, 'beta', 'id: beta\nslots: [home.destinations]\n')
    const registry = scanComponents(dir)
    assert.equal(registry.size, 2)
    assert.ok(registry.has('alpha'))
    assert.equal(registry.get('alpha').name, 'A')
    assert.deepEqual(registry.get('beta').slots, ['home.destinations'])
  })
})

test('scanComponents throws on duplicate id', () => {
  withTmpDir(dir => {
    makeTmpComponent(dir, 'alpha', 'id: alpha\n')
    makeTmpComponent(dir, 'beta', 'id: alpha\n')
    assert.throws(() => scanComponents(dir), /id 重复/)
  })
})

test('scanComponents throws when template.pug is missing', () => {
  withTmpDir(dir => {
    const componentDir = path.join(dir, 'alpha')
    fs.mkdirSync(componentDir, { recursive: true })
    fs.writeFileSync(path.join(componentDir, 'component.yml'), 'id: alpha\n')
    assert.throws(() => scanComponents(dir), /缺少 template\.pug/)
  })
})

test('scanComponents returns empty Map for a missing directory', () => {
  const registry = scanComponents(path.join(os.tmpdir(), 'does-not-exist-' + Date.now()))
  assert.equal(registry.size, 0)
})

test('resolvePageType maps known page paths', () => {
  assert.equal(resolvePageType({ path: 'index.html' }), 'home')
  assert.equal(resolvePageType({ path: 'about/index.html' }), 'about')
  assert.equal(resolvePageType({ path: 'projects/index.html' }), 'projects')
  assert.equal(resolvePageType({ path: 'archives/index.html' }), null)
  assert.equal(resolvePageType({ path: 'posts/x/index.html' }), null)
  assert.equal(resolvePageType(null), null)
})

test('resolveSlotInstances prefers page slot and falls back to global', () => {
  const config = {
    global: { header: [{ component: 'site-header' }] },
    pages: { home: { header: [{ component: 'home-header' }] } }
  }
  assert.deepEqual(resolveSlotInstances(config, 'home', 'header'), [{ component: 'home-header' }])
  assert.deepEqual(resolveSlotInstances(config, 'about', 'header'), [{ component: 'site-header' }])
  assert.deepEqual(resolveSlotInstances(config, 'about', 'footer'), [])
})

test('filterEnabled removes disabled instances', () => {
  const instances = [
    { component: 'a' },
    { component: 'b', enabled: false },
    { component: 'c', enabled: true }
  ]
  assert.deepEqual(filterEnabled(instances).map(i => i.component), ['a', 'c'])
})

test('mergeProps overrides defaults with props', () => {
  assert.deepEqual(mergeProps({ a: 1, b: 2 }, { b: 3 }), { a: 1, b: 3 })
  assert.deepEqual(mergeProps(undefined, { b: 3 }), { b: 3 })
})

test('validateConfig throws for unknown component id', () => {
  const registry = new Map([['known', { id: 'known' }]])
  const config = { pages: { home: { hero: [{ component: 'missing' }] } } }
  assert.throws(() => validateConfig(registry, config), /未知组件 "missing"/)
  assert.doesNotThrow(() => validateConfig(registry, { global: { header: [{ component: 'known' }] } }))
})

test('bundles concatenate component assets', () => {
  withTmpDir(dir => {
    makeTmpComponent(dir, 'alpha', 'id: alpha\n', { 'style.css': '/*a*/', 'script.js': '//a' })
    makeTmpComponent(dir, 'beta', 'id: beta\n', { 'style.css': '/*b*/' })
    const registry = scanComponents(dir)
    assert.equal(buildCssBundle(registry), '/*a*/\n/*b*/')
    assert.equal(buildJsBundle(registry), '//a')
  })
})
```

- [ ] **Step 3: 更新 test 脚本纳入新测试**

把 `package.json` 的 `test` 脚本改为：

```json
"test": "node --test test/notebook-site.test.js test/components-engine.test.js"
```

- [ ] **Step 4: 跑测试，确认引擎单测通过、现有测试仍通过**

Run: `npm test`
Expected: 全部通过（引擎 9 个新测试 + 现有 25 个测试，现有行为未改动）。

- [ ] **Step 5: Commit**

```bash
git add lib/components-engine.js test/components-engine.test.js package.json package-lock.json
git commit -m "feat: add component engine (scan, slots, props, validate, bundle)"
```

> 注：`package-lock.json` 若因 package.json 的 scripts 变化无 diff 则不加它（scripts 不改依赖树）。执行时按 `git status` 实际结果提交。

---

## Task 2: Hexo 接线脚本 + 空配置

**Files:**
- Create: `scripts/components.js`
- Create: `source/_data/components.yml`

- [ ] **Step 1: 写 Hexo 接线脚本**

创建 `scripts/components.js`（完整内容；`hexo` 由 Hexo 注入为脚本参数）：

```js
'use strict'

const path = require('path')
const engine = require(path.join(hexo.base_dir, 'lib', 'components-engine.js'))

const componentsDir = path.join(hexo.base_dir, 'components')

let registry = null
function getRegistry() {
  if (!registry) registry = engine.scanComponents(componentsDir)
  return registry
}

function getConfig(locals) {
  return (locals && locals.site && locals.site.data && locals.site.data.components) || {}
}

function renderComponent(id, props, locals) {
  const component = getRegistry().get(id)
  if (!component) {
    throw new Error(`未知组件 "${id}"：请在 components/ 目录创建该组件`)
  }
  const mergedProps = engine.mergeProps(component.defaults, props)
  return hexo.render.renderSync(
    { path: component.templatePath, engine: 'pug' },
    Object.assign({}, locals, { props: mergedProps, componentData: component.data })
  )
}

function renderSlot(slot, locals) {
  const pageType = engine.resolvePageType(locals.page)
  const instances = engine.resolveSlotInstances(getConfig(locals), pageType, slot)
  return engine.filterEnabled(instances)
    .map(instance => renderComponent(instance.component, instance.props, locals))
    .join('\n')
}

hexo.extend.helper.register('render_component', function (id, props) {
  return renderComponent(id, props, this)
})

hexo.extend.helper.register('render_slot', function (slot) {
  return renderSlot(slot, this)
})

hexo.extend.generator.register('component-assets', function (locals) {
  const reg = getRegistry()
  engine.validateConfig(reg, getConfig(locals))
  return [
    { path: 'css/components.css', data: engine.buildCssBundle(reg) },
    { path: 'js/components.js', data: engine.buildJsBundle(reg) }
  ]
})
```

- [ ] **Step 2: 写空配置（后续任务逐步填充）**

创建 `source/_data/components.yml`：

```yaml
global: {}
pages: {}
```

- [ ] **Step 3: 构建验证脚本加载且无报错**

Run: `npm run clean && npm run build`
Expected: 构建成功；`public/css/components.css` 与 `public/js/components.js` 生成为空文件（0 字节）；页面输出与之前完全一致。

- [ ] **Step 4: 确认现有测试仍通过**

Run: `npm test`
Expected: 全部通过。

- [ ] **Step 5: Commit**

```bash
git add scripts/components.js source/_data/components.yml
git commit -m "feat: wire component engine into Hexo (helpers + asset bundle generator)"
```

---

## Task 3: 组件化内页外壳（site-header + site-footer）

**Files:**
- Create: `components/site-header/component.yml`、`components/site-header/template.pug`
- Create: `components/site-footer/component.yml`、`components/site-footer/template.pug`
- Modify: `source/_data/components.yml`
- Modify: `themes/butterfly/layout/includes/layout.pug`

- [ ] **Step 1: 创建 site-header**

`components/site-header/component.yml`：

```yaml
id: site-header
name: 站点导航
description: 内页顶部字标 + 标签导航 + 主题切换
slots: [global.header]
defaults: {}
```

`components/site-header/template.pug`（与现 `includes/notebook/header.pug` 逐字一致）：

```pug
- const notebookData = site.data.notebook
- const currentNotebookPath = `/${String(page.path || '').replace(/index\.html$/, '')}`
header.notebook-header
  .notebook-header-inner.notebook-shell
    a.notebook-wordmark(href=url_for('/') aria-label="凌云首页")
      img(src=url_for('/img/notebook/wordmark.svg') alt="凌云 · LingyunAce")
    nav.notebook-tabs(aria-label="主要导航")
      each item in notebookData.nav
        - const isCurrent = !item.external && (item.url === '/' ? currentNotebookPath === '/' : currentNotebookPath.startsWith(item.url))
        a.notebook-tab(
          href=url_for(item.url)
          aria-current=isCurrent ? 'page' : null
          target=item.external ? '_blank' : null
          rel=item.external ? 'noopener' : null
        )= item.label
    .notebook-actions
      button.notebook-theme-toggle(
        type="button"
        data-theme-toggle
        aria-pressed="false"
        aria-label="切换到暗色主题"
      ) ◐
```

- [ ] **Step 2: 创建 site-footer**

`components/site-footer/component.yml`：

```yaml
id: site-footer
name: 站点页脚
description: 内页页脚版权 + 链接
slots: [global.footer]
defaults: {}
```

`components/site-footer/template.pug`（与现 `includes/notebook/footer.pug` 逐字一致）：

```pug
footer.notebook-footer
  .notebook-footer-inner.notebook-shell
    p &copy; #{new Date().getFullYear()} #{config.author}
    nav.notebook-footer-links(aria-label="页脚链接")
      each item in site.data.notebook.footer_links
        a(
          href=url_for(item.url)
          target=item.external ? '_blank' : null
          rel=item.external ? 'noopener' : null
        )= item.label
```

- [ ] **Step 3: 配置 global 插槽**

把 `source/_data/components.yml` 改为：

```yaml
global:
  header:
    - component: site-header
  footer:
    - component: site-footer

pages: {}
```

- [ ] **Step 4: 接线 includes/layout.pug**

在 `themes/butterfly/layout/includes/layout.pug` 中，把 `isNotebookPage` 分支里的两行：

```pug
      include notebook/header.pug
```

替换为：

```pug
      != render_slot('header')
```

把：

```pug
      include notebook/footer.pug
```

替换为：

```pug
      != render_slot('footer')
```

- [ ] **Step 5: 构建并核对产物未变**

Run: `npm run clean && npm run build`
Expected: 构建成功；`public/projects/index.html` 仍含 `class="notebook-header"` 与 `class="notebook-footer"`。

- [ ] **Step 6: 跑测试**

Run: `npm test`
Expected: 全部通过（内页产物 HTML 不变）。

- [ ] **Step 7: Commit**

```bash
git add components/site-header components/site-footer source/_data/components.yml themes/butterfly/layout/includes/layout.pug
git commit -m "feat: componentize internal header and footer (site-header, site-footer)"
```

---

## Task 4: 组件化首页（home-header / home-footer / role-line / destination-grid / scheme-picker）

**Files:**
- Create: `components/home-header/component.yml` + `template.pug`
- Create: `components/home-footer/component.yml` + `template.pug`
- Create: `components/role-line/component.yml` + `template.pug`
- Create: `components/destination-grid/component.yml` + `template.pug`
- Create: `components/scheme-picker/component.yml` + `template.pug`
- Modify: `source/_data/components.yml`
- Modify: `themes/butterfly/layout/notebook-home.pug`

- [ ] **Step 1: 创建 home-header**

`components/home-header/component.yml`：

```yaml
id: home-header
name: 首页头部
description: 首页顶部字标 + 主题切换（无标签导航）
slots: [home.header]
defaults: {}
```

`components/home-header/template.pug`：

```pug
header.notebook-homebar
  a.notebook-wordmark(href="/" aria-label="凌云首页")
    img(src=url_for("/img/notebook/wordmark.svg") alt="凌云 · LingyunAce")
  button.notebook-theme-toggle(type="button" data-theme-toggle aria-pressed="false" aria-label="切换到暗色主题") ◐
```

- [ ] **Step 2: 创建 home-footer**

`components/home-footer/component.yml`：

```yaml
id: home-footer
name: 首页页脚
description: 首页底部版权行
slots: [home.footer]
defaults: {}
```

`components/home-footer/template.pug`：

```pug
footer.notebook-home-footer
  span &copy; #{new Date().getFullYear()} 凌云
```

- [ ] **Step 3: 创建 role-line**

`components/role-line/component.yml`：

```yaml
id: role-line
name: 角色说明
description: 首页封面中的一行角色说明
slots: [home.hero]
defaults: {}
```

`components/role-line/template.pug`：

```pug
p.notebook-cover__role= site.data.notebook.role
```

- [ ] **Step 4: 创建 destination-grid**

`components/destination-grid/component.yml`：

```yaml
id: destination-grid
name: 入口卡片网格
description: 首页六个主要入口卡片
slots: [home.destinations]
defaults: {}
```

`components/destination-grid/template.pug`（把原 `+notebookIcon(...)` 混入内联为等价 SVG）：

```pug
nav.notebook-destinations(aria-label="主要入口")
  each item in site.data.notebook.destinations
    a.notebook-destination(
      href=url_for(item.url)
      class=`is-${item.accent}`
      data-destination=item.id
      target=item.external ? "_blank" : null
      rel=item.external ? "noopener" : null
    )
      if item.icon
        img.notebook-destination__image(src=url_for(item.icon) alt="")
      else
        svg.notebook-icon(role="img" aria-label=item.label)
          use(href=url_for(`/img/notebook/icons.svg#icon-${item.id}`))
      span.notebook-destination__label= item.label
      small= item.subtitle
```

- [ ] **Step 5: 创建 scheme-picker**

`components/scheme-picker/component.yml`：

```yaml
id: scheme-picker
name: 背景风格选择
description: 首页右下角浮动背景风格选择器
slots: [home.scheme]
defaults: {}
```

`components/scheme-picker/template.pug`（与 `notebook-home.pug` 92-123 行逐字一致）：

```pug
button.notebook-scheme-toggle(type='button' data-scheme-toggle aria-label='选择背景风格' aria-expanded='false')
  svg.notebook-icon(viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='1.75' stroke-linecap='round' stroke-linejoin='round' aria-hidden='true')
    path(d='M12 3a9 9 0 1 0 0 18c1.2 0 2-.8 2-2 0-.5-.2-1-.5-1.3-.3-.3-.5-.8-.5-1.2 0-1 .8-1.8 1.8-1.8H17a4 4 0 0 0 4-4c0-4-4-7.7-9-7.7z')
    circle(cx='7.5' cy='11.5' r='1')
    circle(cx='10.5' cy='7.5' r='1')
    circle(cx='15' cy='7.5' r='1')
.notebook-scheme-panel#scheme-panel(role='dialog' aria-label='背景风格选择' hidden)
  p.notebook-scheme-panel__title 背景风格
  .notebook-scheme-options
    button(type='button' data-scheme-choice='auto')
      span.notebook-scheme-swatch.notebook-scheme-swatch--auto
      span 自动轮换
    button(type='button' data-scheme-choice='0')
      span.notebook-scheme-swatch.notebook-scheme-swatch--0
      span 纸张高光
    button(type='button' data-scheme-choice='1')
      span.notebook-scheme-swatch.notebook-scheme-swatch--1
      span 科幻
    button(type='button' data-scheme-choice='2')
      span.notebook-scheme-swatch.notebook-scheme-swatch--2
      span 动漫
    button(type='button' data-scheme-choice='3')
      span.notebook-scheme-swatch.notebook-scheme-swatch--3
      span 几何
    button(type='button' data-scheme-choice='4')
      span.notebook-scheme-swatch.notebook-scheme-swatch--4
      span Xbox
    button(type='button' data-scheme-choice='5')
      span.notebook-scheme-swatch.notebook-scheme-swatch--5
      span PlayStation
    button(type='button' data-scheme-choice='6')
      span.notebook-scheme-swatch.notebook-scheme-swatch--6
      span 塞尔达
```

- [ ] **Step 6: 配置 pages.home**

把 `source/_data/components.yml` 改为：

```yaml
global:
  header:
    - component: site-header
  footer:
    - component: site-footer

pages:
  home:
    header:
      - component: home-header
    hero:
      - component: role-line
    destinations:
      - component: destination-grid
    footer:
      - component: home-footer
    scheme:
      - component: scheme-picker
```

- [ ] **Step 7: 把 notebook-home.pug 改写为薄壳**

用下面完整内容**整体替换** `themes/butterfly/layout/notebook-home.pug`（保留 3-39 行的数据/结构化数据逻辑，头部追加 `components.css`/`components.js`，body 内容改用插槽）：

```pug
-
  const homeUrl = full_url_for('/')
  const homeImage = full_url_for('/img/favicon-512.png')
  const homeTitle = page.title || config.title
  const homeDescription = page.description || config.description
  const githubProfile = site.data.notebook.nav.find(item => item.id === 'github')
  const homeStructuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': `${homeUrl}#website`,
        url: homeUrl,
        name: config.title,
        description: homeDescription,
        inLanguage: config.language
      },
      {
        '@type': 'Person',
        '@id': `${homeUrl}#person`,
        name: config.author,
        alternateName: config.title,
        url: homeUrl,
        sameAs: githubProfile ? [githubProfile.url] : []
      },
      {
        '@type': 'ProfilePage',
        '@id': `${homeUrl}#profile`,
        url: homeUrl,
        name: homeTitle,
        description: homeDescription,
        inLanguage: config.language,
        isPartOf: { '@id': `${homeUrl}#website` },
        mainEntity: { '@id': `${homeUrl}#person` }
      }
    ]
  }

doctype html
html(lang=config.language data-theme="light")
  head
    meta(charset="UTF-8")
    meta(name="viewport" content="width=device-width, initial-scale=1")
    title= page.title
    meta(name="description" content=page.description)
    link(rel="canonical" href=homeUrl)
    meta(property="og:type" content="website")
    meta(property="og:title" content=homeTitle)
    meta(property="og:description" content=homeDescription)
    meta(property="og:url" content=homeUrl)
    meta(property="og:image" content=homeImage)
    meta(property="og:site_name" content=config.title)
    meta(name="twitter:card" content="summary")
    meta(name="twitter:title" content=homeTitle)
    meta(name="twitter:description" content=homeDescription)
    meta(name="twitter:image" content=homeImage)
    link(rel="stylesheet" href=url_for("/css/notebook.css?v=6"))
    link(rel="stylesheet" href=url_for("/css/components.css"))
    link(rel="icon" type="image/png" href=url_for("/img/favicon.png"))
    script(src=url_for("/js/notebook.js?v=6") defer)
    script(src=url_for("/js/components.js") defer)
    script(type="application/ld+json").
      !{JSON.stringify(homeStructuredData)}
  body.notebook-site.notebook-home
    a.notebook-skip(href="#main") 跳到主内容
    != render_slot('header')
    main#main
      section.notebook-cover(aria-labelledby="home-title")
        h1#home-title.notebook-sr-only= homeTitle
        != render_slot('hero')
        != render_slot('destinations')
    != render_slot('footer')
    != render_slot('scheme')
```

- [ ] **Step 8: 构建并核对首页产物未变**

Run: `npm run clean && npm run build`
Expected: 构建成功；`public/index.html` 仍含 `data-destination="projects"` 等 5 个入口、`data-scheme-toggle`、`data-theme-toggle`、`aria-label="主要入口"`。

- [ ] **Step 9: 跑测试，修复因模板结构变化而失败的那 1 个测试（在 Task 7 统一处理，此处先记录）**

Run: `npm test`
Expected: 除「homepage template renders configured images with an SVG fallback」外全部通过（该测试断言的是旧 `notebook-home.pug` 内容，将在 Task 7 更新）。若该失败可接受，进入下一步。

- [ ] **Step 10: Commit**

```bash
git add components/home-header components/home-footer components/role-line components/destination-grid components/scheme-picker source/_data/components.yml themes/butterfly/layout/notebook-home.pug
git commit -m "feat: componentize homepage (header, footer, role, destinations, scheme picker)"
```

---

## Task 5: 组件化关于页与作品页（about-notes + project-gallery）

**Files:**
- Create: `components/about-notes/component.yml` + `template.pug`
- Create: `components/project-gallery/component.yml` + `template.pug`
- Modify: `source/_data/components.yml`
- Modify: `themes/butterfly/layout/notebook-about.pug`
- Modify: `themes/butterfly/layout/projects.pug`

- [ ] **Step 1: 创建 about-notes**

`components/about-notes/component.yml`：

```yaml
id: about-notes
name: 关于便签
description: 关于页的自我介绍便签
slots: [about.notes]
defaults: {}
```

`components/about-notes/template.pug`（与现 `notebook-about.pug` 的 block content 逐字一致）：

```pug
section.notebook-about.notebook-shell(aria-labelledby="about-title")
  header.notebook-page-heading
    p.notebook-kicker About
    h1#about-title 关于我
  .notebook-about-notes
    each note in site.data.notebook.about_notes
      article.notebook-note.notebook-card
        h2.notebook-note-title= note.title
        each line in note.lines
          p= line
```

- [ ] **Step 2: 创建 project-gallery**

`components/project-gallery/component.yml`：

```yaml
id: project-gallery
name: 作品画廊
description: 作品页筛选 + 项目卡片网格
slots: [projects.gallery]
defaults: {}
```

`components/project-gallery/template.pug`（与现 `projects.pug` 的 block content 逐字一致）：

```pug
section.notebook-projects.notebook-shell(aria-labelledby="projects-title")
  header.notebook-page-heading
    p.notebook-kicker Projects
    h1#projects-title 作品集
    p 这里收录了我做过的所有项目。点击标签可以筛选。

  .notebook-project-tools
    .notebook-project-filters(aria-label="按技术筛选项目")
      button.notebook-project-filter(type="button" data-project-filter="all" aria-pressed="true") 全部
      each tag in [...new Set(site.data.projects.flatMap(project => project.tags))]
        button.notebook-project-filter(type="button" data-project-filter=tag aria-pressed="false")= tag
    p.notebook-sr-only(data-project-status aria-live="polite")= `显示 ${site.data.projects.length} 个项目`

  .notebook-project-grid
    each project in site.data.projects
      if project.link
        a.notebook-project.notebook-card(
          data-project-tags=project.tags.join(',')
          href=project.link
          target="_blank"
          rel="noopener"
        )
          .notebook-project__cover(style=`--project-accent: ${project.accent || '#4f7cff'}`)
            span.notebook-project__monogram(aria-hidden="true")= project.name.charAt(0)
            span.notebook-project__cover-name= project.name
            ul.notebook-project__cover-tags(aria-hidden="true")
              each tag in project.tags.slice(0, 3)
                li.notebook-project__cover-tag= tag
          .notebook-project__body
            h2= project.name
            p= project.desc
            ul.notebook-tags(aria-label="技术")
              each tag in project.tags
                li.notebook-tag= tag
            span.notebook-sr-only #{project.name}（在新窗口打开）
      else
        article.notebook-project.notebook-card(data-project-tags=project.tags.join(','))
          .notebook-project__cover(style=`--project-accent: ${project.accent || '#4f7cff'}`)
            span.notebook-project__monogram(aria-hidden="true")= project.name.charAt(0)
            span.notebook-project__cover-name= project.name
            ul.notebook-project__cover-tags(aria-hidden="true")
              each tag in project.tags.slice(0, 3)
                li.notebook-project__cover-tag= tag
          .notebook-project__body
            h2= project.name
            p= project.desc
            ul.notebook-tags(aria-label="技术")
              each tag in project.tags
                li.notebook-tag= tag
```

- [ ] **Step 3: 配置 about/projects**

把 `source/_data/components.yml` 改为：

```yaml
global:
  header:
    - component: site-header
  footer:
    - component: site-footer

pages:
  home:
    header:
      - component: home-header
    hero:
      - component: role-line
    destinations:
      - component: destination-grid
    footer:
      - component: home-footer
    scheme:
      - component: scheme-picker
  about:
    notes:
      - component: about-notes
  projects:
    gallery:
      - component: project-gallery
```

- [ ] **Step 4: 薄化 notebook-about.pug**

用下面完整内容**整体替换** `themes/butterfly/layout/notebook-about.pug`：

```pug
extends includes/layout.pug

block content
  != render_slot('notes')
```

- [ ] **Step 5: 薄化 projects.pug**

用下面完整内容**整体替换** `themes/butterfly/layout/projects.pug`：

```pug
extends includes/layout.pug

block content
  != render_slot('gallery')
```

- [ ] **Step 6: 构建并核对产物未变**

Run: `npm run clean && npm run build`
Expected: 构建成功；`public/about/index.html` 仍含 `class="notebook-about-notes"` 与五张便签标题；`public/projects/index.html` 仍含 `data-project-filter="all"` 与 `data-project-tags=`。

- [ ] **Step 7: 跑测试**

Run: `npm test`
Expected: 除 Task 4 Step 9 已记录的那 1 个模板断言外全部通过。

- [ ] **Step 8: Commit**

```bash
git add components/about-notes components/project-gallery source/_data/components.yml themes/butterfly/layout/notebook-about.pug themes/butterfly/layout/projects.pug
git commit -m "feat: componentize about notes and project gallery"
```

---

## Task 6: 给内页注入组件资源包

**Files:**
- Modify: `_config.butterfly.yml`

- [ ] **Step 1: 在 inject 中追加组件资源**

把 `_config.butterfly.yml` 的 `inject` 段改为（在现有 notebook.css / notebook.js 之后追加）：

```yaml
inject:
  head:
    - <link rel="stylesheet" href="/css/notebook.css?v=6">
    - <link rel="stylesheet" href="/css/components.css">
  bottom:
    - <script src="/js/notebook.js?v=6" defer></script>
    - <script src="/js/components.js" defer></script>
```

- [ ] **Step 2: 构建并核对内页引入了资源包**

Run: `npm run clean && npm run build`
Expected: 构建成功；`public/projects/index.html` 含 `href="/css/components.css"` 与 `src="/js/components.js"`。

- [ ] **Step 3: 跑测试**

Run: `npm test`
Expected: 与 Task 5 Step 7 相同。

- [ ] **Step 4: Commit**

```bash
git add _config.butterfly.yml
git commit -m "feat: inject component asset bundles on internal pages"
```

---

## Task 7: 更新与新增测试

**Files:**
- Modify: `test/notebook-site.test.js`

- [ ] **Step 1: 更新「首页模板渲染图片 + SVG 回退」断言为指向组件模板**

把现有测试：

```js
test('homepage template renders configured images with an SVG fallback', () => {
  const template = read('themes/butterfly/layout/notebook-home.pug')
  assert.match(template, /if item\.icon/)
  assert.match(template, /img\.notebook-destination__image\(src=url_for\(item\.icon\) alt=""\)/)
  assert.match(template, /else\s+\+notebookIcon\(item\.id, item\.label\)/)
})
```

替换为：

```js
test('destination-grid component renders configured images with an SVG fallback', () => {
  const template = read('components/destination-grid/template.pug')
  assert.match(template, /if item\.icon/)
  assert.match(template, /img\.notebook-destination__image\(src=url_for\(item\.icon\) alt=""\)/)
  assert.match(template, /svg\.notebook-icon\(role="img" aria-label=item\.label\)/)
  assert.match(template, /use\(href=url_for\(`\/img\/notebook\/icons\.svg#icon-\$\{item\.id\}`\)\)/)
})
```

- [ ] **Step 2: 追加组件化集成断言**

在 `test/notebook-site.test.js` 末尾追加：

```js
test('every configured component ships a manifest and template', () => {
  const configYaml = read('source/_data/components.yml')
  const ids = new Set()
  for (const section of ['global', 'pages']) {
    // 粗略收集所有 component: <id>
    const re = new RegExp('component:\\s*(\\S+)', 'g')
    let m
    while ((m = re.exec(configYaml)) !== null) ids.add(m[1])
  }
  assert.ok(ids.size >= 9)
  for (const id of ids) {
    const manifest = read(`components/${id}/component.yml`)
    assert.match(manifest, new RegExp(`id:\\s*${id}`))
    assert.ok(read(`components/${id}/template.pug`).length > 0, `${id} 必须有 template.pug`)
  }
})

test('component asset bundles are generated alongside core pages', () => {
  const css = read('public/css/components.css')
  const js = read('public/js/components.js')
  assert.ok(typeof css === 'string')
  assert.ok(typeof js === 'string')
})
```

> 说明：`components.css`/`components.js` 当前为空（组件尚未自带 style.css/script.js），断言「文件存在且可读」即可，未来组件带样式后会变长。

- [ ] **Step 3: 跑全部测试**

Run: `npm test`
Expected: 全部通过（现有 24 个 + 引擎 9 个 + 新增 2 个，总计 35 个）。

- [ ] **Step 4: 全量构建做最终核对**

Run: `npm run clean && npm run build`
Expected: 成功；检查 `/`、`/projects/`、`/about/`、`/archives/`、`/posts/github-pages-deploy/` 输出均含组件渲染的内容与 `components.css` 引用。

- [ ] **Step 5: Commit**

```bash
git add test/notebook-site.test.js
git commit -m "test: update template assertion and add component integration tests"
```

---

## Task 8: 文档

**Files:**
- Modify: `README.md`

- [ ] **Step 1: 在 README 增加「组件化热拔插」章节**

在 README 的「📝 自定义内容」之后新增一节（内容如下）：

```markdown
## 🧩 组件化热拔插

全站 UI 拆分为 `components/` 目录下的自包含组件，通过 `source/_data/components.yml`
一个配置实现增删、排序、开关与替换，无需改动模板。

### 目录结构

```
components/
  site-header/
    component.yml   # id / name / description / slots / defaults
    template.pug    # 渲染片段
    style.css       # 可选：组件专属样式
    script.js       # 可选：组件交互脚本
    data.yml        # 可选：组件自带数据（componentData）
```

### 编排配置（source/_data/components.yml）

`global.<插槽>` 供所有内页使用，`pages.<页面>.<插槽>` 优先级更高（首页头部/页脚即
通过 `pages.home.header` / `pages.home.footer` 覆盖）。每个插槽是有序组件实例列表：

```yaml
pages:
  home:
    destinations:
      - component: destination-grid   # 替换组件 = 改这一行
        # enabled: false              # 拔掉组件 = 加这一行
```

### 新增一个组件

1. 新建 `components/<id>/`，写入 `component.yml` 与 `template.pug`（可选 `style.css`、`script.js`、`data.yml`）。
2. 在 `source/_data/components.yml` 的对应插槽挂载该组件。
3. 提交，GitHub Actions 自动重建上线。

未知组件 id、重复 id、缺 `template.pug` 会在构建时报错（fail fast）。
```

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "docs: document hot-swappable component system"
```

---

## 自检结论

- **规格覆盖**：组件契约、插槽解析、编排配置、渲染管线、错误处理、测试、文档均有对应任务；「样式拆进组件目录」按本计划开头的「设计调整 2」延迟，引擎打包基础设施已在 Task 1/Task 2 就位。
- **占位符扫描**：无 TBD/TODO；所有代码步骤含完整代码。
- **类型/命名一致性**：引擎函数名（`scanComponents`/`resolvePageType`/`resolveSlotInstances`/`filterEnabled`/`mergeProps`/`validateConfig`/`buildCssBundle`/`buildJsBundle`）在 `lib/components-engine.js`、`scripts/components.js`、`test/components-engine.test.js` 三处完全一致；组件 id 在配置与目录名一致。
