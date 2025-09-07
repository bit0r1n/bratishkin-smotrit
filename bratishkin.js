function getExtensionURL(path) {
  if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getURL) {
    return chrome.runtime.getURL(path)
  }
  if (typeof browser !== 'undefined' && browser.runtime && browser.runtime.getURL) {
    return browser.runtime.getURL(path)
  }
  console.error('getURL is not supported in this environment')
  return path
}

let config = null;

(chrome || browser).storage.local.get('bratishkinConfig', data => {
  config = data.bratishkinConfig || {
    reactions: {
      enabled: true,
      minDelay: 5,
      maxDelay: 45,
      ignoreWords: [ 'братишкин', 'смотрит', 'реакция' ]
    },
    thumbnails: {
      enabled: true,
      ignoreWords: [ 'братишкин', 'смотрит', 'реакция' ]
    }
  }

  initScripts()
});

(chrome || browser).storage.onChanged.addListener(changes => {
  if (changes.bratishkinConfig) {
    config = changes.bratishkinConfig.newValue
  }
})

function titleContainsIgnoredWord(title, ignoreList) {
  return ignoreList.some(t => title.toLowerCase().includes(t.toLowerCase()))
}

// РЕАКЦИИ

const reactionsRange = [ 1, 4 ]
let reactionQueue = []

function getNextReaction() {
  if (reactionQueue.length === 0) {
    reactionQueue = Array.from(
      { length: reactionsRange[1] - reactionsRange[0] + 1 },
      (_, i) => reactionsRange[0] + i
    )

    for (let i = reactionQueue.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[reactionQueue[i], reactionQueue[j]] = [reactionQueue[j], reactionQueue[i]]
    }
  }

  return reactionQueue.pop()
}

function createReactionOverlayInsidePlayer() {
  const player = document.querySelector('#movie_player')
  if (!player) return null

  player.style.position = 'relative'

  const wrapper = document.createElement('div')
  wrapper.id = 'bratishkin-reaction-wrapper'
  wrapper.style.position = 'absolute'
  wrapper.style.width = '280px'
  wrapper.style.height = 'auto'
  wrapper.style.top = '30%'
  wrapper.style.transform = 'translateY(-50%)'
  wrapper.style.zIndex = '10'
  wrapper.style.overflow = 'hidden'

  const img = document.createElement('img')
  img.src = getExtensionURL('faces/afk.png')
  img.style.width = '100%'
  img.style.height = 'auto'
  img.style.display = 'block'

  const video = document.createElement('video')
  video.style.width = '100%'
  video.style.height = 'auto'
  video.style.display = 'none'
  video.muted = true
  video.playsInline = true

  wrapper.appendChild(img)
  wrapper.appendChild(video)
  player.appendChild(wrapper)

  return { wrapper, img, video }
}

function getRandomDelay() {
  return (Math.floor(Math.random() * (config.reactions.maxDelay - config.reactions.minDelay + 1)) + config.reactions.minDelay) * 1000
}

function manageOverlayBasedOnTitle(mainVideo, overlayState) {
  function handleTitleChange() {
    const titleEl = document.querySelector('h1.title yt-formatted-string, .yt-lockup-metadata-view-model__title span')
    if (!titleEl) return

    const title = titleEl.textContent.trim().toLowerCase()

    if (titleContainsIgnoredWord(title, config.reactions.ignoreWords)) {
      if (overlayState.wrapper) {
        overlayState.wrapper.remove()
        overlayState.wrapper = null
      }
      overlayState.active = false
    } else {
      if (!overlayState.wrapper) {
        overlayState.wrapper = createReactionOverlayInsidePlayer()
        if (overlayState.wrapper) {
          overlayState.active = true
          scheduleNextReaction(mainVideo, overlayState.wrapper)
        }
      }
    }
  }

  handleTitleChange()

  const observer = new MutationObserver(handleTitleChange)
  const container = document.querySelector('#primary-inner') || document.body
  observer.observe(container, { childList: true, subtree: true })
}

function scheduleNextReaction(mainVideo, overlay) {
  if (!config.reactions.enabled) return

  const delay = getRandomDelay()
  setTimeout(() => {
    if (!config.reactions.enabled) return
    if (mainVideo.paused) {
      scheduleNextReaction(mainVideo, overlay)
      return
    }

    const titleEl = document.querySelector('h1.title yt-formatted-string, .yt-lockup-metadata-view-model__title span')
    if (titleEl) {
      if (titleContainsIgnoredWord(titleEl.textContent, config.reactions.ignoreWords)) {
        scheduleNextReaction(mainVideo, overlay)
        return
      }
    }


    const reactionIndex = getNextReaction()
    const reactionSrc = getExtensionURL(`reactions/${reactionIndex}.mp4`)
    const { img, video } = overlay

    mainVideo.pause()
    img.style.display = 'none'
    video.src = reactionSrc
    video.style.display = 'block'
    video.currentTime = 0
    video.muted = false
    video.play()

    const stopReaction = () => {
      if (!video.paused) {
        video.pause()
        video.style.display = 'none'
        img.style.display = 'block'
        scheduleNextReaction(mainVideo, overlay)
      }
    }

    mainVideo.addEventListener('play', stopReaction, { once: true })
    mainVideo.addEventListener('seeked', stopReaction, { once: true })

    video.onended = () => {
      video.style.display = 'none'
      img.style.display = 'block'
      mainVideo.play()
      scheduleNextReaction(mainVideo, overlay)
    }
  }, delay)
}

function startReactionLoop() {
  if (!config.reactions.enabled) return
  const mainVideo = document.querySelector('video.html5-main-video')
  if (!mainVideo) return

  const overlayState = { wrapper: null, active: false }
  manageOverlayBasedOnTitle(mainVideo, overlayState)
}

function waitForVideo() {
  const video = document.querySelector('video.html5-main-video')
  if (video) startReactionLoop()
  else setTimeout(waitForVideo, 1000)
}

// ПРЕВЬЮ

const facesRange = [ 1, 6 ]

function getRandomFace() {
  const index = Math.floor(Math.random() * facesRange[1]) + facesRange[0]
  return getExtensionURL(`faces/${index}.png`)
}

function applyOverlay(thumbnailElement, overlayImageURL, flip = false) {
  if (thumbnailElement.querySelector('.bratishkin-overlay')) return

  const overlayImage = document.createElement('img')
  overlayImage.className = 'bratishkin-overlay'
  overlayImage.src = overlayImageURL
  overlayImage.style.position = 'absolute'
  overlayImage.style.bottom = '0'
  overlayImage.style.height = '100%'
  overlayImage.style.width = 'auto'
  overlayImage.style.objectFit = 'contain'
  overlayImage.style.zIndex = '1'
  overlayImage.style.pointerEvents = 'none'
  overlayImage.style.transform = flip ? 'scaleX(-1)' : ''
  if (flip) overlayImage.style.left = '0'
  else overlayImage.style.right = '0'

  if (getComputedStyle(thumbnailElement).position === 'static') {
    thumbnailElement.style.position = 'relative'
  }
  thumbnailElement.appendChild(overlayImage)
}

function processVideo(video) {
  if (!config.thumbnails.enabled) return

  const title =
    video.querySelector('.yt-lockup-metadata-view-model__title span, #video-title')
  if (title) {
    if (titleContainsIgnoredWord(title.textContent, config.thumbnails.ignoreWords)) return
  }

  const thumbWrapper =
    video.querySelector('.ytThumbnailViewModelImage, #thumbnail-container, .ytd-thumbnail')
  if (thumbWrapper) applyOverlay(thumbWrapper, getRandomFace(), Math.random() < 0.5)

  if (title) title.textContent = 'БРАТИШКИН СМОТРИТ ' + title.textContent.trim()
}

function observeThumbnails() {
  const observer = new MutationObserver(() => {
    document.querySelectorAll('.ytd-rich-item-renderer, .ytd-item-section-renderer, .ytd-playlist-panel-renderer').forEach(video => processVideo(video))
  })

  observer.observe(document.body, { childList: true, subtree: true, attributes: true, characterData: true })

  document.querySelectorAll('.ytd-rich-item-renderer, .ytd-item-section-renderer, .ytd-playlist-panel-renderer').forEach(video => processVideo(video))
}

function initScripts() {
  observeThumbnails()
  waitForVideo()

  // SPA
  let lastUrl = location.href
  setInterval(() => {
    if (location.href !== lastUrl) {
      lastUrl = location.href
      if (config?.thumbnails?.enabled) {
        document.querySelectorAll(
          '.ytd-rich-item-renderer, .ytd-item-section-renderer, .ytd-playlist-panel-renderer'
        ).forEach(video => processVideo(video))
      }
    }
  }, 1000)
}
