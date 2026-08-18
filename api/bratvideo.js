'use strict'

/**
 * GET /api/bratvideo?text=Hello%20World&theme=white&blur=0&format=mp4
 *
 * Also reachable at /bratvideo via the rewrite defined in vercel.json.
 *
 * NOTE: Video rendering shells out to ffmpeg (bundled via the
 * "ffmpeg-static" package) and is heavier than the image endpoint.
 * On some serverless hosts (e.g. Vercel Hobby plan) this may run close
 * to the execution time / deployment size limits - see README.md for
 * recommended hosting options for the video endpoint.
 */

const { generateBratVideo } = require('../lib/generateBratVideo')

module.exports = async (req, res) => {
  try {
    const query = req.query || {}
    const rawText = query.text

    if (!rawText || !String(rawText).trim()) {
      res.status(400).json({
        status: false,
        error: 'Missing required "text" query parameter.',
        example: '/bratvideo?text=Hello%20World'
      })
      return
    }

    const result = await generateBratVideo({
      text: String(rawText),
      theme: query.theme ? String(query.theme) : 'white',
      blur: query.blur ? parseInt(query.blur, 10) : 0,
      format: query.format === 'gif' ? 'gif' : 'mp4'
    })

    res.setHeader('Content-Type', result.mimeType)
    res.setHeader('Cache-Control', 'no-store')
    res.status(200).send(result.buffer)
  } catch (err) {
    res.status(500).json({ status: false, error: err.message })
  }
}
