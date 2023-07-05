import path from 'path'
import { fileURLToPath } from 'url' // used to get the directory name of the current file

import { readFile, writeFile } from 'fs/promises'
import { existsSync } from 'fs'
import fs from 'fs'

import fetch from 'node-fetch'
import { createOCRClient } from 'tesseract-wasm/node'
import sharp from 'sharp'
import jimp from 'jimp'
import { cv } from 'opencv-wasm'

import express from 'express'
import cors from 'cors'

import { ask_openai } from './ask_openai.js'

// const isDevEnvironment = process.env.environment === 'dev' || false

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// // checkif ./cache/ exists
// if (!fs.existsSync('./cache/')) {
//   fs.mkdirSync('./cache/', { recursive: true })
// }


function checkOrigin(origin) {
  let isAllowed = false

  if (typeof origin === 'string') {
    if (
      // allow from main domain
      origin === 'money.thomasrosen.me'
      || origin.endsWith('://money.thomasrosen.me')

      // allow from subdomains
      || origin.endsWith('.thomasrosen.me')

      // allow for localhost
      || origin.endsWith('localhost:3000')
      || origin.endsWith('localhost:13151')
      || origin.endsWith('0.0.0.0:3000')
      || origin.endsWith('0.0.0.0:13151')
    ) {
      isAllowed = true
    }
  }

  return isAllowed
}

async function ocr_result_to_structured_json (ocr_result_text) {
  console.info('sending to gpt-3')

  const prompt = `
${ocr_result_text}

Strictly return as JSON:
- place_name (as one string)
- place_address (as one string)
- datetime (yyyy-MM-dd HH:mm:ss Z)
- cost_sum (as string with currency and 000.00)
- amount_of_tip (as string with currency and 000.00)
- way_of_payment (Visa, Cash, or so on) (as one string)
- as an array: items (name, quantity, price_per_quantity and price_total (as string with currency and 000.00))

Currency is in euros (€) if not specified otherwise.
Be precise with all the values.
`

  try {
    let max_tokens = ocr_result_text.length // TODO: find a better way to set this (but this should be enough for now)
    if (max_tokens > 2000) {
      max_tokens = 2000
    }

    const result_json_text = await ask_openai(
      [
        // {
        //   role: 'system',
        //   // content: 'Only answer truthfully. Do not lie. Only cite the text. Strictly return as JSON.',
        //   content: 'Answer as truthfully as possible.',
        // },
        {
          role: 'user',
          content: prompt,
        }
      ],
      {
        max_tokens,
        temperature: 0.5,
      }
    )

    if (result_json_text === null) {
      return null
    }

    const result_structured = JSON.parse(result_json_text)
    return result_structured
  } catch (error) {
    console.error('error', error)
  }

  return null
}

/*
async function image_to_foreground(sharp_image) {
  try {
  const photoBuffer = await jimp.read(await sharp_image.toBuffer())
  const src = cv.matFromImageData(photoBuffer.bitmap)

  // const jimpBuffer = await jimp.read(image_buffer)
  // const src = cv.matFromImageData(jimpBuffer.bitmap)
    console.log('src', src)
  cv.cvtColor(src, src, cv.COLOR_RGBA2RGB, 0);
  let mask = new cv.Mat();
  let bgdModel = new cv.Mat();
  let fgdModel = new cv.Mat();
  let rect = new cv.Rect(50, 50, 260, 280);
    console.log('rect', rect)
  cv.grabCut(src, mask, rect, bgdModel, fgdModel, 1, cv.GC_INIT_WITH_RECT);
  console.log('after grab cut')
  // draw foreground
  for (let i = 0; i < src.rows; i++) {
    console.log('i', i)
    for (let j = 0; j < src.cols; j++) {
      if (mask.ucharPtr(i, j)[0] === 0 || mask.ucharPtr(i, j)[0] === 2) {
        src.ucharPtr(i, j)[0] = 0;
        src.ucharPtr(i, j)[1] = 0;
        src.ucharPtr(i, j)[2] = 0;
      }
    }
  }
  // draw grab rect
  let color = new cv.Scalar(0, 0, 255);
  let point1 = new cv.Point(rect.x, rect.y);
  let point2 = new cv.Point(rect.x + rect.width, rect.y + rect.height);
    console.log('point2', point2)
  cv.rectangle(src, point1, point2, color);
  // cv.imshow('canvasOutput', src);
  console.log('src', src)
    const foreground_buffer = Buffer.from(src) // convert to buffer
    console.log('foreground_buffer', foreground_buffer)

  // clean up
  src.delete();
  mask.delete();
  bgdModel.delete();
  fgdModel.delete();

    return foreground_buffer

} catch (error) {
  console.error('f-error', error)
}

return null
}
*/

async function save_debug_image(sharp_image, filename) {
  // save image to disk for debugging
  // checkif ./images/ exists
  // use_cache()
  if (!fs.existsSync('./cache/images/')) {
    fs.mkdirSync('./cache/images/', { recursive: true })
  }
  await sharp_image.toFile(`./cache/images/debug_${filename}.png`)
  console.log('saved debug image')
}

async function loadImage(buffer) {
  // I use the idea from the following answer to remove the shadows: https://stackoverflow.com/questions/44047819/increase-image-brightness-without-overflow/44054699#44054699

  const image_bw = await sharp(buffer)
    .flatten({ background: '#FFF' }) // replace alpha channel with white background
    .rotate() // auto rotate based on EXIF data
    .recomb([ // grayscale
      [0.333, 0.333, 0.333],
      [0.333, 0.333, 0.333],
      [0.333, 0.333, 0.333],
    ])
    .normalise() // full range 0 to 255
  console.log('checked rotation of image + converted to grayscale')



  let { width, height, orientation } = await image_bw.metadata()
  console.info('width, height, orientation', width, height, orientation)

  if (orientation === 6 || orientation === 8) {
    // swap width and height if orientation is 6 or 8
    // source: https://web.archive.org/web/20180622174614/http://www.impulseadventure.com/photo/exif-orientation.html
    const tmp = width
    width = height
    height = tmp
  }




  // const foreground_buffer = await image_to_foreground(image_bw)
  // console.log('foreground_buffer', foreground_buffer)
  // const foreground_buffer_image = await sharp(foreground_buffer, {
  //   raw: {
  //     width,
  //     height,
  //     channels: 4,
  //   }
  // })
  // console.log('got foreground sharp image')


  // throw new Error('stop here')

  // START dialate
  const photoBuffer = await jimp.read(await image_bw.toBuffer())
  const src = cv.matFromImageData(photoBuffer.bitmap)
  let dst = new cv.Mat()
  let M = cv.Mat.ones(7, 7, cv.CV_8U) // 7x7 kernel with all 1's
  let anchor = new cv.Point(-1, -1)
  cv.dilate(src, dst, M, anchor, 1, cv.BORDER_CONSTANT, cv.morphologyDefaultBorderValue())
  const image_dilated = Buffer.from(dst.data)
  console.log('image dilated')
  // END dialate

  const image_blurred = await sharp(image_dilated, {
    raw: {
      width,
      height,
      channels: 4,
    }
  }) // await sharp(await image_bw.clone().toBuffer())
    .median(21) // median-blur // 30px is the line-height sweet-spot for tesseract. so 61px as a median blur should remove most of the lines BUT the stackoverflow-article suggests 21px as a good value. i guess this is 3x the kernel size of the dialation
    .normalise()
  console.log('image blurred')

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
  console.log('removed shadows from image')

  const image_better = await sharp(Buffer.from(new_grayscale), {
    raw: {
      width,
      height,
      channels: 1,
    }
  })
    .normalise()
    // .threshold(180) // 220 // only full white or full black
    .ensureAlpha() // add alpha channel if not already present







  // save image to disk for debugging
  // checkif ./images/ exists
  // use_cache()
  if (!fs.existsSync('./cache/images/')) {
    fs.mkdirSync('./cache/images/', { recursive: true })
  }
  await image_better.toFile(`./cache/images/debug.png`)
  console.log('saved debug image')

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

  const save_folder = `${__dirname}/tesseract-data/`
  const save_path = `${save_folder}${type}-${modelPath}`

  if (!fs.existsSync(save_folder)) {
    fs.mkdirSync(save_folder, { recursive: true })
  }

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
app.use(cors())
app.use(function (req, res, next) {
  console.log('app.use - request url:', req.url)

  // const origin = req.get('origin')
  const origin = req.header('Origin')
  if (checkOrigin(origin)) {
    req.is_subdomain = true
    req.origin = origin
    res.setHeader('Access-Control-Allow-Origin', origin)
    res.setHeader('Access-Control-Allow-Credentials', true)
  } else {
    req.is_subdomain = false
  }

  next()
})

app.use('/', express.static('../build/', { fallthrough: true }))

app.get('/api', (req, res) => {
  res.setHeader('Content-Type', 'text/html')
  res.setHeader('Cache-Control', 's-max-age=1, stale-while-revalidate')
  res.end('The api is under /api/ocr')
})



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

app.post('/api/ocr', async (req, res) => {
  console.log('/api/ocr')


  const client = await get_ocr_client({
    lang: 'deu',
    type: 'fast',
  })
  console.info('initialized ocr client')

  try {

    const imageData = await readRequestBody(req)
    console.info(imageData.length, 'bytes of image data received')
    const image = await loadImage(imageData)
    console.info('loaded image')

    await client.loadImage(image)
    console.info('loaded image into ocr client')

    const text = await client.getText()
    console.info('got text from ocr client')

    const invoice_result = await ocr_result_to_structured_json(text)

    // // write hocr to disk for debugging
    // const hocr = (await client.getHOCR())
    //   .replace('</body>', '<script src="https://unpkg.com/hocrjs"></script></body>')
    // await writeFile('./hocr.html', hocr)

    res.setHeader('Content-Type', 'application/json')
    res.writeHead(200)

    const body = {
      text,
      invoice_result,
    }
    res.end(JSON.stringify(body, null, 2))
  } catch (err) {
    console.error('error in /api/ocr', err)
    res.writeHead(500)
    res.end(JSON.stringify({ error: err.message }))
  }
  // finally {
  //   // Shut down the OCR worker thread.
  //   client.destroy()
  // }
})



// const save_folder = `${__dirname}/build/`
const static_files_path = path.join(__dirname, '../build/')
app.use(express.static(static_files_path))

app.get('*', (req, res) => {
  // console.log('index.html fallcack - request url:', req.url)
  res.sendFile('index.html', { root: '../build/' })
})

const port = process.env.PORT || 13151 // the word money as its letter positions in the abc = 13 15 14 5 25
const host = '0.0.0.0' // Uberspace wants 0.0.0.0 instead of localhost
app.listen(port, host, () => {
  console.info(`Server listening at http://${host}:${port}`)
})
