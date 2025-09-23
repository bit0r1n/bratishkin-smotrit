import { getConfig, getExtensionURL } from '../utils/storage'
import { titleContainsIgnoredWord } from '../utils/title'
import { getRandomDelay } from '../utils/random'

interface OverlayWrapper {
  wrapper: HTMLElement
  img: HTMLImageElement
  video: HTMLVideoElement
}

interface OverlayState {
  active: boolean
  wrapper: OverlayWrapper | null
}

const reactionsRange: [number, number] = [1, 4]
let reactionQueue: number[] = []

function getNextReaction(): number {
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

  return reactionQueue.pop()!
}

function createReactionOverlayInsidePlayer(): OverlayWrapper | null {
  const player = document.querySelector<HTMLElement>('#movie_player')
  if (!player) return null

  player.style.position = 'relative'

  const wrapper = document.createElement('div')
  wrapper.id = 'bratishkin-reaction-wrapper'
  wrapper.style.position = 'absolute'
  wrapper.style.width = '280px'
  wrapper.style.top = '30%'
  wrapper.style.transform = 'translateY(-50%)'
  wrapper.style.zIndex = '10'
  wrapper.style.overflow = 'hidden'

  const smotrit = document.createElement('video')
  smotrit.src = getExtensionURL('faces/bratishkin.webm')
  smotrit.style.width = '100%'
  smotrit.style.display = 'block'
  smotrit.loop = true
  smotrit.playsInline = true

  const video = document.createElement('video')
  video.style.width = '100%'
  video.style.display = 'none'
  video.muted = true
  video.playsInline = true

  wrapper.appendChild(img)
  wrapper.appendChild(video)
  player.appendChild(wrapper)

  return { wrapper, img, video }
}

function scheduleNextReaction(mainVideo: HTMLVideoElement, overlay: OverlayWrapper) {
  const cfg = getConfig().reactions
  if (!cfg.enabled) return

  const delay = getRandomDelay()
  setTimeout(() => {
    if (!cfg.enabled) return
    if (mainVideo.paused) {
      scheduleNextReaction(mainVideo, overlay)
      return
    }

    const titleEl = document.querySelector<HTMLElement>(
      'h1.title yt-formatted-string, .yt-lockup-metadata-view-model__title span'
    )
    if (titleEl && titleContainsIgnoredWord(titleEl.textContent, cfg.ignoreWords)) {
      scheduleNextReaction(mainVideo, overlay)
      return
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

function manageOverlayBasedOnTitle(
  mainVideo: HTMLVideoElement,
  overlayState: OverlayState
) {
  function handleTitleChange() {
    const titleEl = document.querySelector<HTMLElement>(
      'h1.title yt-formatted-string, .yt-lockup-metadata-view-model__title span'
    )
    if (!titleEl) return

    const cfg = getConfig().reactions

    if (titleContainsIgnoredWord(titleEl.textContent.trim(), cfg.ignoreWords)) {
      if (overlayState.wrapper) {
        overlayState.wrapper.wrapper.remove()
        overlayState.wrapper = null
      }
      overlayState.active = false
    } else {
      if (!overlayState.wrapper) {
        const created = createReactionOverlayInsidePlayer()
        if (created) {
          overlayState.wrapper = created
          overlayState.active = true
          scheduleNextReaction(mainVideo, created)
        }
      }
    }
  }

  handleTitleChange()

  const observer = new MutationObserver(handleTitleChange)
  const container = document.querySelector('#primary-inner') || document.body
  observer.observe(container, { childList: true, subtree: true })
}

export function startReactionLoop() {
  const cfg = getConfig().reactions
  if (!cfg.enabled) return
  const mainVideo = document.querySelector<HTMLVideoElement>('video.html5-main-video')
  if (!mainVideo) return

  const overlayState: OverlayState = { wrapper: null, active: false }
  manageOverlayBasedOnTitle(mainVideo, overlayState)
}
