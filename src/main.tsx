import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/permanent-marker'
import '@fontsource/bebas-neue'
import '@fontsource-variable/inter'
import './index.css'
import App from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
