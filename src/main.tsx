import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { RenderView } from './pages/RenderView.tsx'

const isRenderMode = window.location.pathname.replace(/\/$/, '').endsWith('/render')
const root = createRoot(document.getElementById('root')!)

if (isRenderMode) {
  // No StrictMode (avoid double-mount churn) and no app chrome — the harness screenshots this.
  root.render(<RenderView />)
} else {
  root.render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}
