import { getConfig } from '../utils/storage'
import { titleContainsIgnoredWord } from '../utils/title'

const facesRange: [number, number] = [1, 6]

function getExtensionURL(path: string): string {
  if (typeof chrome !== 'undefined' && chrome.runtime?.getURL) {
    return chrome.runtime.getURL(path)
  }
  if (typeof browser !== 'undefined' && browser.runtime?.getURL) {
    return browser.runtime.getURL(path)
  }
  return path
}

function getRandomFace(): string {
  const index = Math.floor(Math.random() * facesRange[1]) + facesRange[0]
  return getExtensionURL(`faces/${index}.png`)
}

function applyOverlay(thumbnailElement: HTMLElement, overlayImageURL: string, flip = false) {
  if (thumbnailElement.querySelector('.bratishkin-overlay')) return

  const overlayImage = document.createElement('img')
  overlayImage.className = 'bratishkin-overlay'
  overlayImage.src = overlayImageURL
  overlayImage.style.position = 'absolute'
  overlayImage.style.bottom = '0'
  overlayImage.style.height = '100%'
  overlayImage.style.width = 'auto'
  overlayImage.style.objectFit = 'contain'
  overlayImage.style.zIndex = '0'
  overlayImage.style.pointerEvents = 'none'
  overlayImage.style.transform = flip ? 'scaleX(-1)' : ''
  if (flip) overlayImage.style.left = '0'
  else overlayImage.style.right = '0'

  if (getComputedStyle(thumbnailElement).position === 'static') {
    thumbnailElement.style.position = 'relative'
  }
  thumbnailElement.appendChild(overlayImage)
}

export function processVideo(video: HTMLElement) {
  const cfg = getConfig().thumbnails
  if (!cfg.enabled) return

  const title = video.querySelector<HTMLElement>(
    '.yt-lockup-metadata-view-model__title span, #video-title'
  )
  if (title && titleContainsIgnoredWord(title.textContent, cfg.ignoreWords)) return

  const thumbWrapper = video.querySelector<HTMLElement>(
    '.ytThumbnailViewModelImage, #thumbnail-container, .ytd-thumbnail'
  )
  if (thumbWrapper) applyOverlay(thumbWrapper, getRandomFace(), Math.random() < 0.5)

  if (title) title.textContent = 'БРАТИШКИН СМОТРИТ ' + (title.textContent.trim())
}

export function observeThumbnails() {
  const observer = new MutationObserver(() => {
    document
      .querySelectorAll<HTMLElement>(
        '.ytd-rich-item-renderer, .ytd-item-section-renderer, .ytd-playlist-panel-renderer'
      )
      .forEach((video) => processVideo(video))
  })

  observer.observe(document.body, { childList: true, subtree: true, attributes: true, characterData: true })

  document
    .querySelectorAll<HTMLElement>(
      '.ytd-rich-item-renderer, .ytd-item-section-renderer, .ytd-playlist-panel-renderer'
    )
    .forEach((video) => processVideo(video))
}
