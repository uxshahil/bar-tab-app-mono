import { io } from 'socket.io-client'

const getSocketURL = () => {
  // Specially handle direct access to app container on port 3000
  // Since the internal nginx in the app container doesn't proxy /socket.io,
  // we must point directly to the exposed API port 3001.
  if (globalThis.location?.port === '3000') {
    return `${globalThis.location.protocol}//${globalThis.location.hostname}:3001`
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
  transports: ['websocket', 'polling'],
})

socket.on('connect', () => {
  // connection established
})

socket.on('disconnect', () => {
  // connection lost
})
