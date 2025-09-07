function getDefaultConfig() {
  return {
    reactions: {
      enabled: true,
      minDelay: 5,
      maxDelay: 45,
      ignoreWords: ['братишкин', 'смотрит', 'реакция'],
    },
    thumbnails: {
      enabled: true,
      ignoreWords: ['братишкин', 'смотрит', 'реакция'],
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  chrome.storage.local.get('bratishkinConfig', data => {
    const cfg = data.bratishkinConfig || getDefaultConfig()
    loadConfig(cfg)
  })

  document.getElementById('save').addEventListener('click', saveConfig)
  document.getElementById('reset').addEventListener('click', resetConfig)
})

function loadConfig(cfg) {
  document.getElementById('reactions-enabled').checked = cfg.reactions.enabled
  document.getElementById('reactions-min').value = cfg.reactions.minDelay
  document.getElementById('reactions-max').value = cfg.reactions.maxDelay
  document.getElementById('reactions-ignore').value = cfg.reactions.ignoreWords.join(',')

  document.getElementById('thumbnails-enabled').checked = cfg.thumbnails.enabled
  document.getElementById('thumbnails-ignore').value = cfg.thumbnails.ignoreWords.join(',')
}

function saveConfig() {
  const cfg = {
    reactions: {
      enabled: document.getElementById('reactions-enabled').checked,
      minDelay: parseInt(document.getElementById('reactions-min').value, 10) || 5,
      maxDelay: parseInt(document.getElementById('reactions-max').value, 10) || 10,
      ignoreWords: document.getElementById('reactions-ignore').value.split(',').map(s => s.trim()).filter(Boolean),
    },
    thumbnails: {
      enabled: document.getElementById('thumbnails-enabled').checked,
      ignoreWords: document.getElementById('thumbnails-ignore').value.split(',').map(s => s.trim()).filter(Boolean),
    }
  }

  if (cfg.reactions.minDelay < 1 || cfg.reactions.minDelay > 60) return showStatus('Минимальный интервал реакции должен быть от 1 секунды до 60 секунд')
  if (cfg.reactions.maxDelay < 1 || cfg.reactions.maxDelay > 60) return showStatus('Максимальный интервал реакции должен быть от 1 секунды до 60 секунд')

  chrome.storage.local.set({ bratishkinConfig: cfg }, () => {
    showStatus('Настройки сохранены')
  })
}

function resetConfig() {
  const defaults = getDefaultConfig()
  chrome.storage.local.set({ bratishkinConfig: defaults }, () => {
    loadConfig(defaults)
    showStatus('Настройки сброшены')
  })
}

function showStatus(msg) {
  const status = document.getElementById('status')
  status.textContent = msg
  setTimeout(() => status.textContent = '', 2000)
}