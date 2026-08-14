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
  if (!locals) return {}
  const data = (locals.site && locals.site.data) || locals.data || {}
  return data.components || {}
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
