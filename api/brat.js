'use strict'

/**
 * GET /api/brat?text=Hello%20World&theme=white&blur=0
 *
 * Also reachable at /brat via the rewrite defined in vercel.json.
 */

const { generateBrat } = require('../lib/generateBrat')

module.exports = async (req, res) => {
  try {
    const query = req.query || {}
    const rawText = query.text

    if (!rawText || !String(rawText).trim()) {
      res.status(400).json({
        status: false,
        error: 'Missing required "text" query parameter.',
        example: '/brat?text=Hello%20World'
      })
      return
    }

    const buffer = await generateBrat({
      text: String(rawText),
      theme: query.theme ? String(query.theme) : 'white',
      blur: query.blur ? parseInt(query.blur, 10) : 0
    })

    res.setHeader('Content-Type', 'image/png')
    res.setHeader('Cache-Control', 'no-store')
    res.status(200).send(buffer)
  } catch (err) {
    res.status(500).json({ status: false, error: err.message })
  }
}
