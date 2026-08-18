'use strict'

/**
 * Brat API - Standalone Server
 * -----------------------------------------------------------------------
 * Plain Node.js HTTP server (no framework dependency) used for:
 *   - Local development ("npm start")
 *   - Any host that isn't Vercel (Railway, Render, a VPS, Docker, etc.)
 *
 * Routes:
 *   GET /                    -> Tutorial / preview homepage (public/index.html)
 *   GET /brat?text=...       -> PNG image
 *   GET /bratvideo?text=...  -> MP4/GIF video
 * -----------------------------------------------------------------------
 */

const http = require('http')
const url = require('url')
const path = require('path')
const fs = require('fs')

const { generateBrat } = require('./lib/generateBrat')
const { generateBratVideo } = require('./lib/generateBratVideo')

const PORT = process.env.PORT || 3000
const PUBLIC_DIR = path.join(__dirname, 'public')

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.gif': 'image/gif',
  '.mp4': 'video/mp4'
}

function sendJSON(res, status, payload) {
  const body = JSON.stringify(payload, null, 2)
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' })
  res.end(body)
}

function serveStatic(res, pathname) {
  const safePath = path.normalize(pathname === '/' ? '/index.html' : pathname)
  const filePath = path.join(PUBLIC_DIR, safePath)

  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403)
    res.end('Forbidden')
    return
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' })
      res.end('404 Not Found')
      return
    }
    const ext = path.extname(filePath)
    res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' })
    res.end(data)
  })
}

const server = http.createServer(async (req, res) => {
  const parsed = url.parse(req.url, true)
  const pathname = parsed.pathname
  const query = parsed.query

  try {
    // ---- Image endpoint: /brat?text=... ----
    if (pathname === '/brat' || pathname === '/api/brat') {
      const text = query.text
      if (!text || !String(text).trim()) {
        return sendJSON(res, 400, {
          status: false,
          error: 'Missing required "text" query parameter.',
          example: '/brat?text=Hello%20World'
        })
      }
      const buffer = await generateBrat({
        text: String(text),
        theme: query.theme ? String(query.theme) : 'white',
        blur: query.blur ? parseInt(query.blur, 10) : 0
      })
      res.writeHead(200, { 'Content-Type': 'image/png', 'Cache-Control': 'no-store' })
      return res.end(buffer)
    }

    // ---- Video endpoint: /bratvideo?text=... ----
    if (pathname === '/bratvideo' || pathname === '/api/bratvideo') {
      const text = query.text
      if (!text || !String(text).trim()) {
        return sendJSON(res, 400, {
          status: false,
          error: 'Missing required "text" query parameter.',
          example: '/bratvideo?text=Hello%20World'
        })
      }
      const result = await generateBratVideo({
        text: String(text),
        theme: query.theme ? String(query.theme) : 'white',
        blur: query.blur ? parseInt(query.blur, 10) : 0,
        format: query.format === 'gif' ? 'gif' : 'mp4'
      })
      res.writeHead(200, { 'Content-Type': result.mimeType, 'Cache-Control': 'no-store' })
      return res.end(result.buffer)
    }

    // ---- Everything else: serve the static homepage / assets ----
    return serveStatic(res, pathname)
  } catch (err) {
    return sendJSON(res, 500, { status: false, error: err.message })
  }
})

server.listen(PORT, () => {
  console.log(`Brat API is running -> http://localhost:${PORT}`)
  console.log(`Try:   http://localhost:${PORT}/brat?text=Hello%20World`)
  console.log(`Try:   http://localhost:${PORT}/bratvideo?text=Hello%20World`)
})
