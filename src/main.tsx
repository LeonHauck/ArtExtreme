import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/permanent-marker'
import '@fontsource/bebas-neue'
import '@fontsource-variable/inter'
import './index.css'
import App from './App'
import { installChunkRecovery } from './lib/chunkReload'
import { installGlobalErrorLog } from './lib/errorLog'

// Recupera de atualização no meio do uso e registra erros para diagnóstico
installChunkRecovery()
installGlobalErrorLog()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
