/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_AI_MODEL_URL: string
  readonly VITE_AI_MODEL_NAME: string
  readonly VITE_AI_API_KEY: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

