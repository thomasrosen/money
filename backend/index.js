import { readFile, writeFile } from 'fs/promises'
import { existsSync } from 'fs'
import fs from 'fs'

import fetch from 'node-fetch'
import { createOCRClient } from 'tesseract-wasm/node'
import sharp from 'sharp'

import express from 'express'


// checkif ./cache/ exists
if (!fs.existsSync('./cache/')) {
  fs.mkdirSync('./cache/', { recursive: true })
}


async function loadImage(buffer) {
  // I use the idea from the following answer to remove the shadows: https://stackoverflow.com/questions/44047819/increase-image-brightness-without-overflow/44054699#44054699

  const image_bw = await sharp(buffer)
    .flatten({ background: '#FFF' })
    .rotate()
    .recomb([
      [0.333, 0.333, 0.333],
      [0.333, 0.333, 0.333],
      [0.333, 0.333, 0.333],
    ])
    .normalise()

  let { width, height, orientation } = await image_bw.metadata()
  // console.log('width, height, orientation', width, height, orientation)

  if (orientation === 6 || orientation === 8) {
    // swap width and height if orientation is 6 or 8
    // source: https://web.archive.org/web/20180622174614/http://www.impulseadventure.com/photo/exif-orientation.html
    const tmp = width
    width = height
    height = tmp
  }

  const image_blurred = await sharp(await image_bw.clone().toBuffer())
    .median(61) // 30px is the line-height sweet-spot for tesseract. so 61px as a median blur should remove most of the lines
    .blur(1) // TODO is this extra blur necessary?
    .normalise()

  const bw_buffer = await image_bw.extractChannel('red').raw().toBuffer()

  const new_grayscale = await image_blurred.extractChannel('red').raw().toBuffer()
    .then(blurred_buffer => {
      const rgb = []
      for (let i = 0; i < blurred_buffer.length; i += 1) {
        const new_value = 255 - (blurred_buffer[i] - bw_buffer[i])
        // apply a threshold
        if (new_value < 20) {
          rgb.push(0)
        } else if (new_value > 200) {
          rgb.push(255)
        } else {
          rgb.push(new_value)
        }
      }
      return rgb
    })

  const image_better = await sharp(Buffer.from(new_grayscale), {
    raw: {
      width,
      height,
      channels: 1,
    }
  })
    .normalise()
    // .threshold(180) // 220
    .ensureAlpha()


  // checkif ./images/ exists
  if (!fs.existsSync('./cache/images/')) {
    fs.mkdirSync('./cache/images/', { recursive: true })
  }

  // save image to disk for debugging
  await image_better.toFile(`./cache/images/image.png`)

  return {
    data: await image_better.raw().toBuffer(),
    width,
    height,
  }
}

async function loadModel(options) {

  let {
    lang = 'eng',
    type = 'fast',
  } = options || {}

  if (type !== 'fast' && type !== 'best') {
    type = 'fast'
  }

  let modelPath = null
  switch (lang) {
    case 'deu':
      modelPath = 'deu.traineddata'
      break
    default: // case 'eng':
      modelPath = 'eng.traineddata'
  }

  const save_path = `./cache/${type}-${modelPath}`

  if (!existsSync(save_path)) {
    console.info('Downloading text recognition model...')
    const modelURL = `https://github.com/tesseract-ocr/tessdata_${type}/raw/main/${modelPath}`
    const response = await fetch(modelURL)
    if (!response.ok) {
      process.stderr.write(`Failed to download model from ${modelURL}`)
      process.exit(1)
    }
    const data = await response.arrayBuffer()
    await writeFile(save_path, new Uint8Array(data))
  }
  return readFile(save_path)
}

async function readRequestBody(request) {
  const chunks = []
  for await (let chunk of request) {
    chunks.push(chunk)
  }
  return Buffer.concat(chunks)
}

console.info('Initializing server...')

const app = express()

const ocr_client_cache = {}
async function get_ocr_client(options) {

  let {
    lang = 'eng',
    type = 'fast',
  } = options || {}

  if (type !== 'fast' && type !== 'best') {
    type = 'fast'
  }

  const key = `${type}-${lang}`

  if (!ocr_client_cache[key]) {

    // Start a new OCR worker. In this simple demo app we do this for every
    // request. In a real application you may want to create a pool of clients
    // which can be re-used across requests, to save needing to re-initialize
    // the worker for each request.
    const client = createOCRClient()

    // Load model concurrently with reading image.
    const model = await loadModel(options)
    await client.loadModel(model)
    ocr_client_cache[key] = client
  }

  return ocr_client_cache[key]
}

app.post('/ocr', async (req, res) => {

  const client = await get_ocr_client({
    lang: 'deu',
    type: 'fast',
  })

  try {

    const imageData = await readRequestBody(req)
    const image = await loadImage(imageData)

    if (false) {
      throw new Error('test')
    }

    await client.loadImage(image)
    const text = await client.getText()
    console.log('text\n\n', text)


    // // write hocr to disk for debugging
    // const hocr = (await client.getHOCR())
    //   .replace('</body>', '<script src="https://unpkg.com/hocrjs"></script></body>')
    // await writeFile('./hocr.html', hocr)

    res.setHeader('Content-Type', 'application/json')
    res.writeHead(200)

    const body = { text }
    res.end(JSON.stringify(body, null, 2))
  } catch (err) {
    res.writeHead(500)
    res.end(JSON.stringify({ error: err.message }))
  } finally {
    // Shut down the OCR worker thread.
    client.destroy()
  }
})

const port = 13151 // the word money as its letter positions in the abc = 13 15 14 5 25
const host = '0.0.0.0' // Uberspace wants 0.0.0.0
app.listen(port, host, () => {
  console.info(`Server listening \n at http://${host}:${port} \n and http://localhost:${port}`)
})
