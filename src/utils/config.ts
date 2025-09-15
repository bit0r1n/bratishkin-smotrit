export interface BratishkinConfig {
  reactions: {
    enabled: boolean
    minDelay: number
    maxDelay: number
    ignoreWords: string[]
  }
  thumbnails: {
    enabled: boolean
    ignoreWords: string[]
  }
}

export const defaultConfig: BratishkinConfig = {
  reactions: {
    enabled: true,
    minDelay: 5,
    maxDelay: 45,
    ignoreWords: [ 'братишкин', 'смотрит', 'реакция' ],
  },
  thumbnails: {
    enabled: true,
    ignoreWords: [ 'братишкин', 'смотрит', 'реакция' ],
  },
}
