import { initConfig, getConfig } from './utils/storage'
import { observeThumbnails, processVideo } from './features/thumbnails'
import { startReactionLoop } from './features/reactions'

function waitForVideo() {
  const video = document.querySelector('video.html5-main-video')
  if (video) {
    startReactionLoop()
  } else {
    setTimeout(waitForVideo, 1000)
  }
}

function initScripts() {
  observeThumbnails()
  waitForVideo()

  // SPA
  let lastUrl = location.href
  setInterval(() => {
    if (location.href !== lastUrl) {
      lastUrl = location.href
      if (getConfig().thumbnails.enabled) {
        document
          .querySelectorAll<HTMLElement>(
            '.ytd-rich-item-renderer, .ytd-item-section-renderer, .ytd-playlist-panel-renderer'
          )
          .forEach((video) => {
            processVideo(video)
          })
      }
    }
  }, 1000)
}

initConfig(initScripts)
