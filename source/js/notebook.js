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

  function legacyCopy(text) {
    const textarea = document.createElement('textarea')
    textarea.value = text
    textarea.setAttribute('readonly', '')
    textarea.style.position = 'fixed'
    textarea.style.opacity = '0'
    document.body.appendChild(textarea)
    textarea.select()
    try { document.execCommand('copy') } catch (_) {}
    textarea.remove()
  }

  function showToast(message) {
    document.querySelectorAll('.notebook-toast').forEach(toast => toast.remove())
    const toast = document.createElement('div')
    toast.className = 'notebook-toast'
    toast.setAttribute('role', 'status')
    toast.textContent = message
    document.body.appendChild(toast)
    window.setTimeout(() => toast.remove(), 2400)
  }

  function copyCurrentUrl() {
    const url = window.location.href
    const done = () => showToast('链接已复制，去微信粘贴给好友吧')
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(done).catch(() => {
        legacyCopy(url)
        done()
      })
    } else {
      legacyCopy(url)
      done()
    }
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

    document.querySelectorAll('[data-share]').forEach(button => {
      button.addEventListener('click', copyCurrentUrl)
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
