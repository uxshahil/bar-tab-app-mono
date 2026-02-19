import { io } from 'socket.io-client'

const getSocketURL = () => {
  // Specially handle direct access to app container on port 3000
  // Since the internal nginx in the app container doesn't proxy /socket.io,
  // we must point directly to the exposed API port 3001.
  if (window.location.port === '3000') {
     return `${window.location.protocol}//${window.location.hostname}:3001`
  }

  let url = import.meta.env.VITE_API_URL || 'http://localhost:3001'
  // If URL ends with /api, strip it to get the root origin for socket.io
  if (url.endsWith('/api')) {
    url = url.replace(/\/api$/, '')
  }
  // If url is empty string (because VITE_API_URL was just /api), 
  // ensure we return undefined so socket.io connects to window.location
  return url || undefined
}

const URL = getSocketURL()

export const socket = io(URL, {
  autoConnect: true,
  transports: ['websocket', 'polling']
})

socket.on('connect', () => {
    console.log('[Socket] Connected to server:', socket.id)
})

socket.on('disconnect', () => {
    console.log('[Socket] Disconnected from server')
})
