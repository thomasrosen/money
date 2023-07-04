import path from 'path'
import { fileURLToPath } from 'url' // used to get the directory name of the current file

import { readFile, writeFile } from 'fs/promises'
import { existsSync } from 'fs'
import fs from 'fs'

import fetch from 'node-fetch'
import { createOCRClient } from 'tesseract-wasm/node'
import sharp from 'sharp'

import express from 'express'

import { ask_openai } from './ask_openai.js'

// const isDevEnvironment = process.env.environment === 'dev' || false

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function log_path() {
  console.info('directory-name 👉️', __dirname);

  console.info(process.cwd())
  console.info(' ')

  // list all files in the directory
  fs.readdir(__dirname, (err, files) => {
    if (err) {
      throw err
    }

    // files object contains all files names
    // log them on console
    files.forEach(file => {
      console.info(file)
    })
  })
  console.info(' ')

}



// // checkif ./cache/ exists
// if (!fs.existsSync('./cache/')) {
//   fs.mkdirSync('./cache/', { recursive: true })
// }


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

  let { width, height, orientation } = await image_bw.metadata()
  console.info('width, height, orientation', width, height, orientation)

  if (orientation === 6 || orientation === 8) {
    // swap width and height if orientation is 6 or 8
    // source: https://web.archive.org/web/20180622174614/http://www.impulseadventure.com/photo/exif-orientation.html
    const tmp = width
    width = height
    height = tmp
  }

  const image_blurred = await sharp(await image_bw.clone().toBuffer())
    .median(61) // median-blur // 30px is the line-height sweet-spot for tesseract. so 61px as a median blur should remove most of the lines
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
    // .threshold(180) // 220 // only full white or full black
    .ensureAlpha() // add alpha channel if not already present


  // // save image to disk for debugging
  // // checkif ./images/ exists
  // use_cache()
  // if (!fs.existsSync('./cache/images/')) {
  //   fs.mkdirSync('./cache/images/', { recursive: true })
  // }
  // await image_better.toFile(`./cache/images/debug.png`)

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

app.get('/api', (req, res) => {
  log_path()

  const path = `/api/item/item_id`;
  res.setHeader('Content-Type', 'text/html');
  res.setHeader('Cache-Control', 's-max-age=1, stale-while-revalidate');
  res.end(`Hello! Go to item: <a href="${path}">${path}</a>`);
});

app.get('/api/item/:slug', (req, res) => {
  const { slug } = req.params;
  res.end(`Item: ${slug}`);
});



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



const static_files_path = path.join(__dirname, '../frontend/build/')
app.use(express.static(static_files_path))



const port = process.env.PORT || 13151 // the word money as its letter positions in the abc = 13 15 14 5 25
const host = '0.0.0.0' // Uberspace wants 0.0.0.0 instead of localhost
app.listen(port, host, () => {
  console.info(`Server listening at http://${host}:${port}`)
})
