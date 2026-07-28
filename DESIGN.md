# DESIGN.md: Tang Weijuan-inspired personal site

## Source

- Reference URL: https://tangweijuan.com/
- Target URL: https://lingyunace.github.io/
- Capture date: 2026-07-28
- Evidence:
  - `.firecrawl/tangweijuan-home.json`
  - `.firecrawl/tangweijuan-blog.json`
  - `.firecrawl/tangweijuan-weekly.json`
  - `.firecrawl/tangweijuan-about.json`
  - `.firecrawl/tangweijuan-illustration.json`
  - `.firecrawl/tangweijuan-map.json`
  - `.firecrawl/tangweijuan-screenshot.png`
  - `.firecrawl/tangweijuan-blog-screenshot.png`
  - `.firecrawl/tangweijuan-about-screenshot.png`
  - `.firecrawl/lingyunace-home.json`
  - `.firecrawl/lingyunace-screenshot.png`

## Reference Screenshot

![Full-page screenshot of tangweijuan.com](./.firecrawl/tangweijuan-screenshot.png)

Use this screenshot as the visual source of truth for layout, hierarchy, density,
and feel. Do not reuse the source site's logo, illustrations, icons, or copy.

## Design Summary

The source site presents a personal archive as a playful paper desk rather than
a conventional portfolio. Its homepage is a large ring-bound grid-paper sheet
containing lightly rotated card links. Hand-drawn marks, tiny color accents,
paper shadows, and generous empty space create a warm, handmade identity.

For LingyunAce, preserve that approachable notebook metaphor while translating
the content to an independent developer: original code/tool/project icons,
existing Chinese copy, real project links, blog archives, and an original
凌云 wordmark. The result should be inspired by the interaction and layout
language, not a pixel copy.

## Design Tokens

### Colors

Observed through Firecrawl:

- Page background: `#EEEDED`
- Primary text: `#000000`
- Link/secondary ink: `#615743`
- Light card surfaces: `#F7FAFE` and `#FFFEF5`
- Color scheme: light

Inferred from screenshots:

- Notebook paper: `#FBF9FA`
- Grid line: `rgba(215, 207, 215, 0.42)`
- Soft border: `rgba(18, 18, 18, 0.10)`
- Pink marker accent: approximately `#F04F9A`
- Supporting sticker accents: sky blue, violet, and warm yellow
- Footer/header band: approximately `#E9E8E8`

Target-site adaptation:

- Keep black as the action color.
- Use pink only as a marker/highlight, never as a large background.
- Assign one restrained accent color to each primary destination.
- Retain sufficient contrast for text and focus states.

### Typography

Observed:

- Firecrawl detects `Inter` for body and headings.
- Extracted scale: `32px` headings and `16px` body.
- The logo is an image with a handwritten personality, not body text.

Inferred:

- Navigation labels use a sturdy, compact display treatment.
- Long-form lists use smaller text, short descriptions, and restrained dates.

Target-site adaptation:

- UI/body: `"Inter", "Noto Sans SC", system-ui, sans-serif`
- Display/card labels: `"Noto Sans SC", "Inter", sans-serif`, weight 700
- Original wordmark: hand-drawn-style SVG made specifically for “凌云”
- Type scale: 14 / 16 / 20 / 28 / 40px
- Body line-height: 1.65; compact list line-height: 1.45

### Spacing And Layout

Observed:

- Firecrawl reports a 4px base spacing unit and square corners.
- Homepage uses one centered, oversized notebook surface.
- Six destinations form a loose 4+2 card arrangement.
- Cards rotate by a few degrees and use very small shadows.
- Header and footer are low-height gray bands on inner pages.
- Blog/weekly pages use a narrow reading column with high information density.
- About uses five independent paper notes distributed across a dotted canvas.

Target-site adaptation:

- Desktop content maximum: 1200-1320px.
- Notebook panel: minimum 720px high, 28-36px radius, 1px grid.
- Primary navigation cards: 176-208px wide, 16-24px internal padding.
- Use 8px spacing increments for implementation.
- Mobile: remove decorative rings, stack cards in two columns, then one column.
- Keep all essential links in normal document flow; rotations are decorative.

## Components

### Wordmark

- Original “凌云 / LingyunAce” mark with a short pink highlighter stroke.
- Links to `/`.
- Must remain legible without relying on the marker stroke.

### Notebook Shell

- Gray outer canvas.
- Centered white/off-white paper with subtle grid.
- Decorative binder rings on desktop only.
- Rounded bottom and top corners; no texture image required.

### Destination Card

- Paper rectangle with 1px pale border and 1-2px soft shadow.
- Original line icon above a black pill label.
- Slight deterministic rotation per card.
- Hover: straighten, lift 4px, and deepen the shadow.
- Focus: visible black outline with offset.

Suggested destinations:

1. Projects / 作品
2. Blog / 文章
3. Notes / 随记
4. About / 关于
5. GitHub
6. Contact / 联系

### Header Tabs

- Used on internal pages.
- Centered wordmark above a row of rounded-top tabs.
- Active tab is black with white text.
- On mobile, tabs become horizontally scrollable.

### Project Gallery

- Reuse LingyunAce project data.
- Replace blank typographic cover panels with original “pinned project cards.”
- Each project shows title, one-sentence description, year, and technology chips.
- Preserve direct GitHub links and external-link affordances.

### Article And Notes Lists

- Narrow central column.
- Search/filter row above the list.
- Each item contains date, title, and optional one-line summary.
- Avoid large cards; rely on whitespace and a single vertical guide line.

### About Notes

- Distribute profile, tools, current work, interests, and contact across separate
  paper notes.
- Use subtle rotation only on wide screens.
- Linearize in a clear reading order on mobile and for keyboard navigation.

### Footer

- Muted gray band with compact wordmark, GitHub/email/RSS links, and copyright.
- Keep text ownership and branding entirely LingyunAce's.

## Page Patterns

### Home

1. Original wordmark and concise role line
2. Notebook navigation surface
3. Six destination cards
4. Compact footer

The homepage becomes an index, not a long portfolio feed. Projects and writing
move to focused internal pages.

### Projects

1. Shared tab header
2. Page icon and title
3. Filterable project grid from `source/_data/projects.yml`
4. Shared footer

### Blog / Archives

1. Shared tab header
2. Search and category/tag filters
3. Dense chronological list generated by Hexo
4. Shared footer

### About

1. Shared tab header
2. Dotted-paper canvas
3. Five profile notes
4. Shared footer

## Content Style

- First-person Chinese, warm and direct.
- Short labels paired with optional English subtitles.
- Headlines stay factual; descriptions fit in one or two lines.
- Use actual repository/project information where available.
- Do not import or paraphrase the reference site's personal biography.

## Motion And Accessibility

- Transition duration: 160-240ms.
- Use transform and shadow only for card motion.
- Respect `prefers-reduced-motion`.
- Maintain keyboard focus, semantic navigation, and logical DOM order.
- Decorative rings, tape, dots, and grid lines are hidden from assistive tech.
- Minimum interactive target: 44x44px.

## Agent Build Instructions

- Keep Hexo + Butterfly for posts, archives, tags, and deployment.
- Implement the custom homepage as the existing `layout: false` page.
- Introduce shared notebook tokens in a focused CSS file rather than rewriting
  Butterfly's full theme.
- Add only the smallest Pug overrides needed for projects/about/internal headers.
- Continue sourcing projects from `source/_data/projects.yml`.
- Generate original SVG icons and wordmark; do not download the source site's
  branded assets or illustration files.
- Verify desktop at 1440px and mobile at 390px.
- Run `npm run build` and inspect generated `/`, `/projects/`, `/about/`, and
  `/archives/`.

## Rerun Inputs

```text
workflow: firecrawl-website-design-clone
source_url: https://tangweijuan.com/
target_url: https://lingyunace.github.io/
target_stack: Hexo 7 + Butterfly 5 + custom HTML/CSS/Pug
output: DESIGN.md and implementation
```
