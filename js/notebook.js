;(function (root) {
  const STORAGE_KEY = 'lingyunace-notebook-theme'
  const SCHEME_KEY = 'lingyunace-notebook-scheme'
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

  function dailyScheme() {
    const now = new Date()
    const startOfYear = new Date(now.getFullYear(), 0, 1)
    const dayIndex = Math.floor((now.getTime() - startOfYear.getTime()) / 86400000)
    return ((dayIndex % 7) + 7) % 7
  }

  function currentSchemeKey() {
    try {
      const saved = window.localStorage.getItem(SCHEME_KEY)
      if (saved === 'auto' || saved === null) return 'auto'
      return saved
    } catch (_) {
      return 'auto'
    }
  }

  function currentScheme() {
    const key = currentSchemeKey()
    if (key === 'auto') return dailyScheme()
    const n = Number(key)
    return Number.isInteger(n) && n >= 0 && n <= 6 ? n : dailyScheme()
  }

  function applyScheme() {
    const scheme = currentScheme()
    document.querySelectorAll('.notebook-cover').forEach(cover => {
      cover.setAttribute('data-scheme', String(scheme))
    })
    const activeKey = currentSchemeKey()
    document.querySelectorAll('[data-scheme-choice]').forEach(button => {
      button.setAttribute('aria-pressed', String(button.dataset.schemeChoice === activeKey))
    })
  }

  function initSchemePicker() {
    const toggle = document.querySelector('[data-scheme-toggle]')
    const panel = document.querySelector('#scheme-panel')
    if (!toggle || !panel) return

    const setOpen = open => {
      toggle.setAttribute('aria-expanded', String(open))
      panel.hidden = !open
    }

    toggle.addEventListener('click', () => {
      setOpen(toggle.getAttribute('aria-expanded') !== 'true')
    })

    panel.querySelectorAll('[data-scheme-choice]').forEach(button => {
      button.addEventListener('click', () => {
        try {
          window.localStorage.setItem(SCHEME_KEY, button.dataset.schemeChoice)
        } catch (_) {}
        applyScheme()
        setOpen(false)
      })
    })

    document.addEventListener('click', event => {
      if (panel.hidden) return
      if (!panel.contains(event.target) && !toggle.contains(event.target)) {
        setOpen(false)
      }
    })
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
    applyScheme()
    initSchemePicker()

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
