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
  const checkInstances = (slot, instances) => {
    const list = Array.isArray(instances) ? instances : []
    for (const instance of list) {
      const id = instance && instance.component
      if (id && !registry.has(id)) {
        throw new Error(`components.yml 引用未知组件 "${id}"（插槽 "${slot}"）`)
      }
    }
  }
  const global = config.global
  if (global && typeof global === 'object') {
    for (const [slot, instances] of Object.entries(global)) {
      checkInstances(slot, instances)
    }
  }
  const pages = config.pages
  if (pages && typeof pages === 'object') {
    for (const [page, slots] of Object.entries(pages)) {
      if (!slots || typeof slots !== 'object') continue
      for (const [slot, instances] of Object.entries(slots)) {
        checkInstances(slot, instances)
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
