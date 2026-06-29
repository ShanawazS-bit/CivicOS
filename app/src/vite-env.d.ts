/// <reference types="vite/client" />

interface SpeechRecognition extends EventTarget {
  lang: string
  start(): void
  onstart: (() => void) | null
  onerror: ((event: any) => void) | null
  onend: (() => void) | null
  onresult: ((event: any) => void) | null
}

interface Window {
  SpeechRecognition?: new () => SpeechRecognition
  webkitSpeechRecognition?: new () => SpeechRecognition
}
