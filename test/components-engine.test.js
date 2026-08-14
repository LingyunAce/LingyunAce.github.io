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

test('validateConfig throws when a slot value is not an array', () => {
  const registry = new Map([['known', { id: 'known' }]])
  const config = { pages: { home: { header: { component: 'home-header' } } } }
  assert.throws(() => validateConfig(registry, config), /插槽 "header" 的值必须是数组/)
})

test('validateConfig throws when an instance lacks a component field', () => {
  const registry = new Map([['known', { id: 'known' }]])
  const config = { global: { header: ['site-header'] } }
  assert.throws(() => validateConfig(registry, config), /插槽 "header" 存在格式错误的组件实例/)
})

test('scanComponents preserves a falsy data.yml document', () => {
  withTmpDir(dir => {
    makeTmpComponent(dir, 'alpha', 'id: alpha\n', { 'data.yml': 'false\n' })
    const registry = scanComponents(dir)
    assert.equal(registry.get('alpha').data, false)
  })
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
