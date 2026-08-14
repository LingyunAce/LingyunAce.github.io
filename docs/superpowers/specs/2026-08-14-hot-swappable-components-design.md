# 凌云个人网站「组件化热拔插」设计规格

**日期：** 2026-08-14
**状态：** 设计已确认，等待书面规格复核
**站点：** https://biubiutoo.cn
**仓库：** `LingyunAce/LingyunAce.github.io`
**技术栈：** Hexo 7 + Butterfly 5 + Pug/Stylus

## 1. 目标

在保留 Hexo、Butterfly、现有文章与部署方式的前提下，把全站拆分为**自包含组件**，
用一个**编排配置**实现组件的增删、排序、开关与替换，并让组件能够像插件一样
「即插即用」——新增组件只需放入一个目录并挂载到插槽，无需改动模板或全局样式。

## 2. 非目标

- 不做浏览器内实时拖拽编辑界面。
- 不做面向访客的组件换肤选择器。
- 不引入服务端运行时、CMS、数据库或账号系统。
- 不重写 Hexo 的文章、标签、分类与归档生成逻辑。
- 不改变 `notebook.yml`、`projects.yml` 的内容数据契约。
- 不改变 GitHub Pages 现有发布目标与构建方式。

## 3. 已确认决策

- 采用「组件注册表 + 编排配置」方案（方案 A）。
- 全站统一组件化，一次到位（首页、导航、页脚、关于、作品、博客外壳）。
- 组件目录放在仓库根 `components/`。
- 组件专属样式拆进各自组件目录，全局令牌与共享基元保留在 `source/css/notebook.css`。
- 「热拔插」= 改配置即可插拔/替换，提交后由 GitHub Actions 自动重建上线；
  不要求零构建的浏览器端实时替换。

## 4. 架构总览

```
components/<id>/
  component.yml     元数据 + 默认 props（必填）
  template.pug      渲染片段（必填）
  data.yml          可选：组件自带默认数据（暴露为 componentData）
  style.css         可选：组件专属样式
  script.js         可选：组件交互脚本

source/_data/components.yml   编排配置：页面 → 插槽 → 组件实例列表
scripts/components.js         构建期引擎：发现、校验、渲染、资源注入
```

数据流：

1. Hexo 启动时，`scripts/components.js` 扫描 `components/*/component.yml`，构建组件注册表。
2. 页面模板（Pug）调用 `render_slot(slot)`，引擎读取 `site.data.components` 找到该插槽的
   组件实例列表，过滤 `enabled`，逐个渲染组件并拼接 HTML。
3. 渲染过程中引擎记录「当前页面用到的组件」，`after_render:html` 过滤器把它们的
   `style.css` / `script.js` 注入该页面。
4. 内容数据来自 `source/_data/notebook.yml`、`projects.yml`（规范数据源），
   组件也可通过自带 `data.yml` 提供默认数据。

## 5. 组件契约

组件目录结构见第 4 节。`component.yml` 形如：

```yaml
id: site-header
name: 站点导航
description: 顶部字标 + 标签导航 + 主题切换
slots: [global.header]
defaults: {}
```

约束：

- `id` 全局唯一，与目录名一致。
- `template.pug` 是 Pug 片段，可用 `props`、`site`、`config`、`page`、`theme` 等 locals。
- `slots` 声明组件可挂载的插槽，用于自文档。
- `defaults` 提供默认 props；配置实例的 `props` 覆盖默认值。
- `data.yml` 可省略；存在时其内容以 `componentData` 传入模板，作为组件自带默认数据。
- `style.css` / `script.js` 可省略，省略时不注入、不报错。

## 6. 插槽

页面模板退化为「薄壳」，只声明插槽位置。插槽解析规则：
**`pages.<当前页面>.<slot>` 优先，不存在则回退 `global.<slot>`**。

- **共享插槽**：`global.header`、`global.footer`，供所有内页使用。
- **首页专属插槽**：`pages.home.header`、`pages.home.footer`（首页头部为字标 + 主题切换、
  无标签导航；首页页脚仅版权行，与内页是两个组件变体）。
- **内容插槽**（各页面模板在 `block content` 内声明）：
  - 首页 `home`：`hero`、`destinations`
  - 关于 `about`：`notes`
  - 作品 `projects`：`gallery`
  - 归档 `archives`：`list`
  - 文章详情 `post`：`body`

每个插槽渲染一个**有序组件实例列表**；同一插槽可挂多个组件，按数组顺序渲染。

## 7. 编排配置

文件：`source/_data/components.yml`（通过 `site.data.components` 访问）。

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
        props:
          text: "Independent Developer · Writer"
    destinations:
      - component: destination-grid
    footer:
      - component: home-footer
  about:
    notes:
      - component: about-notes
  projects:
    gallery:
      - component: project-gallery
  archives:
    list:
      - component: archive-list
  post:
    body:
      - component: post-body
```

`pages.home` 省略某插槽（如 `header`）时回退 `global.header`；此处显式声明是因为
首页头部/页脚是独立变体。

字段语义：

- `component`（必填）：组件 id。
- `props`（可选）：实例级配置，覆盖组件 `defaults`；仅承载标量或简单结构。
- `enabled`（可选，默认 `true`）：设为 `false` 即「拔掉」该实例，渲染时干净跳过。
- **数据来源**：组件模板可直接读取 `site.data.notebook`、`site.data.projects` 等规范
  数据源，或读取自带 `data.yml`（以 `componentData` 传入）。`props` 不做数据引用解析，
  避免字符串引用与字面量的歧义；需要数据绑定的场景再单独设计。

替换组件示例：把 `destinations` 插槽的 `destination-grid` 改为另一个同插槽组件
`destination-list` 即可，配置改一行。

## 8. 渲染管线

文件：`scripts/components.js`（站点根 `scripts/` 目录被 Hexo 自动加载）。

1. **注册表**：在 `generate` 前扫描 `components/*/component.yml`，校验 id 唯一、
   `template.pug` 存在，生成注册表。
2. **helpers**：
   - `render_slot(slot)`：读 `site.data.components` 与当前页面类型，取该插槽实例列表，
     过滤 `enabled`，逐个渲染并拼接。
   - `render_component(id, props)`：`hexo.render.render({ path, engine: 'pug' }, locals)`
     渲染单个组件，locals 含 `props`（`defaults` ← 实例 `props` 覆盖）。
3. **资源注入**：`render_component` 把组件 id 记入当前页面上下文；
   `after_render:html` 过滤器把已用组件的 `style.css` 内联到 `<head>`、`script.js`
   内联到 `</body>` 前。仅当前页面真正用到的组件才加载资源。

## 9. 内容数据与迁移

- `source/_data/notebook.yml`（导航、入口、关于、页脚）与 `projects.yml`（作品）
  继续作为**规范内容数据源**，契约不变。
- 现有模板中的区块逐个搬进 `components/`，**保持 class 名与 DOM 结构不变**，
  使已生成 HTML 与现有样式、测试继续成立。
- 首期组件清单：
  - `home-header`（首页头部：字标 + 主题切换）
  - `site-header`（内页头部：字标 + 标签导航 + 主题切换）
  - `home-footer`（首页页脚：版权行）
  - `site-footer`（内页页脚：版权 + 链接）
  - `role-line`（首页角色说明）
  - `destination-grid`（首页入口卡片网格）
  - `about-notes`（关于便签）
  - `project-gallery`（作品筛选 + 卡片网格）
  - `archive-list`（归档时间列表）
  - `post-body`（文章详情阅读外壳）
  - `theme-toggle`、`scheme-picker`（主题切换与背景风格选择，首页使用）

## 10. 样式策略

- **全局层**（`source/css/notebook.css`）：设计令牌、明暗主题变量、`.notebook-shell` /
  `.notebook-card` 等共享基元、focus 轮廓、`prefers-reduced-motion` 通用规则。
- **组件层**（`components/*/style.css`）：组件专属规则，随组件一起加载与替换。
- 组件通过全局令牌命名类，不复制主题变量；替换组件时其样式随组件一同退出页面。

## 11. 错误处理与降级

- 配置引用未知组件 id、组件 id 重复、组件目录缺 `template.pug` →
  **构建失败**并输出可读错误（fail fast，避免静默丢内容）。
- 配置中的插槽未被任何页面渲染 → **构建警告**（提示可能的插槽名笔误），不阻断构建。
- `enabled: false` → 跳过，不渲染空标签。
- 组件缺 `style.css` / `script.js` → 跳过，不报错。
- JavaScript 禁用 → 仅丢失交互（主题切换、筛选、背景风格选择），
  导航与内容完整（沿用现有降级策略）。
- 无对应插槽配置 → 该插槽输出为空，不报错（允许页面尚无内容）。

## 12. 可访问性

- 组件迁移保持语义化标签与现有 `aria-*` 属性不变。
- 主题切换、筛选、背景风格选择保持 44×44px 最小交互目标与可读标签。
- 装饰性元素继续对辅助技术隐藏。
- 组件样式同样满足明暗主题 WCAG AA 对比度与 `prefers-reduced-motion`。

## 13. 测试与验证

### 保留与更新

- 保留现有 `test/notebook-site.test.js` 的 25 个测试；渲染产物不变，大部分继续通过。
- 更新断言模板内部结构的测试（如 `notebook-home.pug` 的 `if item.icon`、
  `notebook.css` 中组件专属规则）→ 改为断言组件目录内对应文件。

### 新增测试

- 组件注册表正确发现 `components/*/component.yml`。
- `enabled: false` 的实例不渲染、不产生空标签。
- 配置引用未知组件 id 时报错。
- 同一插槽多组件按配置顺序渲染。
- 组件资源只注入到实际使用它的页面。

### 验证命令

```bash
npm test
npm run clean && npm run build
```

检查生成的 `/`、`/projects/`、`/about/`、`/archives/` 与至少一个文章详情页；
确认构建日志无缺失模板、无效 YAML、未知组件报错。

## 14. 成功标准

1. 首页、导航、页脚、关于、作品、博客外壳均通过 `components/` 目录渲染。
2. 改 `source/_data/components.yml` 即可增删、排序、开关、替换组件，无需改模板或全局样式。
3. 新增组件 = 新建 `components/<id>/` 目录 + 在配置中挂载，即可被构建自动发现。
4. 现有文章、项目数据、明暗主题、GitHub Pages 发布流程不丢失。
5. 生成的 HTML 结构与现有站点一致，桌面与手机无横向溢出或不可点击元素。
6. `npm test` 与 `npm run build` 成功完成。

## 15. 证据与背景

- 现有规格：`docs/superpowers/specs/2026-07-28-notebook-portfolio-redesign.md`。
- 现有组件边界：`themes/butterfly/layout/notebook-home.pug`、
  `notebook-about.pug`、`projects.pug`、`includes/layout.pug`、
  `includes/notebook/{header,footer,icon}.pug`。
- 现有数据：`source/_data/notebook.yml`、`source/_data/projects.yml`。
- 现有测试：`test/notebook-site.test.js`。
