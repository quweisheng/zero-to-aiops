import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ReactBoard } from './ReactBoard'
import './style.css'

const root = document.getElementById('root')
if (!root) throw new Error('missing #root')
createRoot(root).render(<StrictMode><ReactBoard /></StrictMode>)
