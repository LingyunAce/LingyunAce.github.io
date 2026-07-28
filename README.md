# 个人作品集博客

基于 **Hexo** + **Butterfly 主题** 的个人作品集站点。包含首页作品集、关于页、博客三大模块，支持 GitHub Pages 自动部署。

## ✨ 特性

- 🎨 Butterfly 主题 + 自定义 portfolio 布局
- 📝 博客（标签、分类、归档、字数统计）
- 🗂️ 作品集页面（标签筛选）
- 🚀 GitHub Actions 自动部署到 GitHub Pages
- 🌗 明暗主题切换
- 🔍 本地搜索

## 📁 目录结构

```
.
├── _config.yml              # 站点配置
├── _config.butterfly.yml    # 主题配置
├── source/                  # 源文件
│   ├── _posts/              # 博客文章
│   ├── _data/projects.yml   # 作品集数据
│   ├── index.md             # 首页（portfolio 布局）
│   ├── about/index.md       # 关于页
│   └── projects/index.md    # 作品集页
├── themes/butterfly/        # 主题（含自定义 portfolio.pug / projects.pug）
├── public/                  # 生成的静态文件
├── .github/workflows/       # GitHub Actions 部署配置
└── package.json
```

## 🚀 快速开始

### 环境要求

- **Node.js** ≥ 18
- **Git**

### 本地安装

```bash
# 1. 克隆仓库
git clone https://github.com/你的GitHub用户名/你的GitHub用户名.github.io.git
cd 你的GitHub用户名.github.io

# 2. 安装依赖
npm install

# 3. 启动本地预览（默认 http://localhost:4000）
npm run server
```

### 写作

```bash
# 新建文章
npx hexo new "文章标题"

# 编辑完成后预览
npm run server
```

### 构建与部署

```bash
# 清理 + 构建
npm run clean && npm run build

# 推送到 main 即可触发 GitHub Actions 自动部署
git add .
git commit -m "更新博客"
git push origin main
```

部署完成后访问 `https://你的GitHub用户名.github.io`。

## ⚙️ 部署到自己的 GitHub Pages

按以下步骤把博客部署到自己的 GitHub 账号：

### 1. 创建仓库

在 GitHub 上新建一个仓库，命名必须为：

```
你的GitHub用户名.github.io
```

### 2. 修改 `_config.yml`

把文件中的 `your-github-username` 全部替换为你的真实 GitHub 用户名：

```yaml
url: https://你的GitHub用户名.github.io
deploy:
  repo: https://github.com/你的GitHub用户名/你的GitHub用户名.github.io.git
```

### 3. 修改 `_config.butterfly.yml`

把 `social` 字段里的占位符替换为你的真实账号：

```yaml
social:
  GitHub: https://github.com/你的GitHub用户名 || fa-brands fa-github
  邮箱: mailto:你的邮箱 || fa-solid fa-envelope
  # ...
```

### 4. 修改 `source/_data/projects.yml`

把项目里的 `[你的GitHub用户名]` 替换为真实用户名，调整 `link` 为实际项目地址。

### 5. 启用 GitHub Pages

仓库 → **Settings** → **Pages** → **Build and deployment** → **Source** 选 **GitHub Actions**。

### 6. 推送

```bash
git init
git add .
git commit -m "feat: 初始化个人博客"
git branch -M main
git remote add origin https://github.com/你的GitHub用户名/你的GitHub用户名.github.io.git
git push -u origin main
```

打开仓库的 **Actions** 标签页可以看到部署进度。完成后访问 `https://你的GitHub用户名.github.io`。

## 🛠️ 常用命令

| 命令 | 说明 |
| --- | --- |
| `npm run server` | 启动本地预览服务器 |
| `npm run build` | 生成静态文件（输出到 `public/`） |
| `npm run clean` | 清理缓存和 `public/` |
| `npm run deploy` | 通过 hexo-deployer-git 一键部署（可选） |
| `npx hexo new "标题"` | 新建文章 |

## 📝 自定义内容

- **个人信息**：编辑 `_config.yml` 的 `author`、`subtitle`、`description`
- **导航菜单**：编辑 `_config.butterfly.yml` 的 `menu`
- **社交链接**：编辑 `_config.butterfly.yml` 的 `social`
- **作品集数据**：编辑 `source/_data/projects.yml`（`highlight: true` 的项目会显示在首页）
- **首页入口与文案**：编辑 `source/_data/notebook.yml`
- **首页入口图标**：将 PNG 放入 `source/img/pokemon/`，再修改 `source/_data/notebook.yml` 对应入口的 `icon` 路径；无需修改模板或 CSS
- **关于页**：编辑 `source/about/index.md`

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

## 📄 许可证

MIT
