/// <reference types="vite/client" />

interface SpeechRecognition extends EventTarget {
  lang: string
  start(): void
  onresult: ((event: SpeechRecognitionEvent) => void) | null
}

interface Window {
  SpeechRecognition?: new () => SpeechRecognition
  webkitSpeechRecognition?: new () => SpeechRecognition
}
