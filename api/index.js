import cors from 'cors';
import express from 'express';
import jimp from 'jimp';
import multer from 'multer';
import { cv } from 'opencv-wasm';
import path from 'path';
import sharp from 'sharp';
import { fileURLToPath } from 'url'; // used to get the directory name of the current file
import { ask_openai } from './ask_openai.js';
import { genID } from './genID.js';
import { getSha512Hash } from './getSha512Hash.js';
import { checkFileExistsByPath, createOrUpdateFileContents, initOctokit, text2base64 } from './git.js';

// const isDevEnvironment = process.env.environment === 'dev' || false

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// // checkif ./cache/ exists
// if (!fs.existsSync('./cache/')) {
//   fs.mkdirSync('./cache/', { recursive: true })
// }


// Configure multer storage
const storage = multer.memoryStorage(); // Store files in memory as Buffer objects
const multer_upload = multer({ storage: storage });


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

async function image_to_structured_json(base64image) {
  console.info('sending to gpt-4o-mini')

  const possible_categories = 'other beverages coffee tea juice soda beer wine bakery_items loaf_of_bread pastries doughnuts cakes muffins croissants small_bread dairy_products milk cheese yogurt butter cream fruits_and_vegetables apples bananas carrots lettuce tomatoes potatoes meat_and_seafood chicken beef pork fish shrimp snacks chips chocolate nuts candy popcorn prepared_foods pizza sandwiches salads sushi burgers pantry_items rice pasta canned_beans flour sugar household_items paper_towels dish_soap laundry_detergent trash_bags cleaning_supplies personal_care shampoo soap toothpaste deodorant lotion frozen_foods ice_cream frozen_pizza frozen_vegetables frozen_meals pet_supplies dog_food cat_food pet_treats pet_toys transportation bus_fare train_ticket taxi_ride fuel tickets concert_ticket movie_ticket flight_ticket event_ticket entertainment books movies music_games sports_gear toys health_and_wellness medicine vitamins fitness_equipment medical_supplies technology_and_electronics gadgets computers mobile_phones accessories chargers headphones clothing_and_accessories mens_clothing womens_clothing neutral_clothing shoes bags jewelry home_and_garden furniture kitchenware garden_tools home_decor office_supplies stationery printer_ink office_furniture notebooks automotive car_maintenance car_parts tires car_cleaning_supplies services repairs cleaning_services professional_services legal consulting subscriptions magazines online_services education books tuition_fees online_courses school_supplies travel accommodation travel_insurance tour_packages car_rental miscellaneous gifts donations miscellaneous_fees bank_fees late_fees craft_supplies home_improvement tools paint electrical_supplies plumbing_supplies outdoor_gear camping_gear fishing_equipment cycling_gear photography cameras lenses photography_accessories baby_supplies diapers baby_food baby_clothes childcare_services party_supplies decorations party_favors balloons office_equipment desks chairs computers printers seasonal_items christmas_decorations halloween_costumes summer_gear winter_clothing gardening_plants seeds soil fertilizers beauty_and_cosmetics makeup skincare products haircare products nail_care spa_services groceries fresh_produce meats seafood dairy bakery_items pantry_staples cleaning_services home_cleaning laundry_services dry_cleaning child_care babysitting daycare tutoring tutoring_services test_preparation language_classes pet_services grooming veterinary_services pet_sitting'.split(' ')

  const prompt = `
You are an OCR reader for invoices. You’ll get one or more images from one single invoice and you return the following information.

Precisely list which items were bought, the price of each item, and the bought quantity.
**IMPORTANT**: Item names might span multiple lines. If an item name spans multiple lines, **combine all lines** to form the complete item name. **Combine all related lines into one item name**. Do not split an item into separate entries.
**Repeat**: Combine multiple lines into one item name if necessary. Each item should be listed only once with its complete name. **Do not list parts of the same item separately**.
Be cautious to list the correct items. The items normally have a price directly next to them.

Also output the date and time of the transaction as an ISO datetime.
And output the precise location of the store.
Also output the tax_id, brand of the store, and additional information about the store mentioned in the example JSON.

Do not use python.
Output as JSON.

Example JSON
  {
  items: [
  {
  name: string (EXACTLY what’s written on the invoice. DO NOT change anything. think precisely about handwritten. Combine multiple lines into one item if necessary. replace line breaks with whitespace)
  corrected_name: string (the name WITH CORRECTED letter casing, spelling, correct umlaute, without abbreviations and WITHOUT liter (1L / 0.4 / …) or kilo amounts. add missing letters)
  short_name: string (a really short but presize name for the item. think about the most important part of the item. LEAVE OUT out ANY additional infos or unconventionell naming/prefix-words/suffix-words. multiple items can have the same short_name. NOT ONLY the categorie.)
  categories: [string] (list of categories the item belongs to. apply all the fit. use only the following categories: [${possible_categories.join(', ')}]. include categories from the list that are transaltions, synonyms, or related to the item.)
  price_total: string (only the number) (summed price of this item)
  price_single: string (only the number) (price of one quantity of this item)
  currency: string (EUR, USD, …)
  quantity: number (the amount of items bought)
  amount: number (specify the liter or kilo amount if known, extracted from the food name if available; otherwise, leave as 0)
  amount_unit: string (specify the unit for the amount-value such as "kilo", "liter", etc.; leave empty if not known)
  }
  ]
  datetime: string (iso datetime YYYY-MM-DDThh:mm)
  total_cost: string (total amount paid, only the number)
  total_cost_currency: string (EUR, USD, …)
  payment_method: string (unknown, cash, card)
  card_provider: string (lowercase, empty if not known or not used)
  store: {
  name: string
  tax_id: string
  phone: string
  email: string
  website: string
  opening_hours: string (use the OSM standard. leave empty if not known. example: "Mo-Fr 08:00-12:00,13:00-17:30; Sa 08:00-12:00")
  address: {
  formatted: string (EXACT address AS ON the invoice. nothing more. NO CORRECTIONS. pay attention and look at the image with precision. replace linebreaks with whitespace)
  city_geo: { (best guess for the cities geo location)
    lat: number
    lng: number
    r_km: integer number (radius in km of the city from city_geo. the whole city should be the circle)
  }
  housenumber, postalcode, street, city, country: string (everything you know or can SAFELY assume. you are allowed to assume here. correct spellings, add missing letters BER -> Berlin, add missing parts FamMain -> Frankfurt am Main, add missing whitespace, CORRECT umlaute, normal casing BERLIN -> Berlin, …)
  }
  }
  }

Currency is in euros (€) if not specified otherwise.
Do NOT assume any data. Only when mentioned in the JSON example.
Do NOT output markdown code boundaries. ONLY OUTPUT VALID JSON.  

**REMEMBER**: Combine multiple lines into one item name if it is one item. Each item should be listed only once with its complete name. Ingredients or extras may be listed in multiple lines. Combine them into one item name. **Combine all lines that describe an item into one entry. Do not split related lines into separate items**.
`

  try {
    const result_json_text = await ask_openai(
      [
        {
          role: 'system',
          content: prompt,
        },
        {
          "role": "user",
          "content": [
            {
              "type": "image_url",
              "image_url": {
                "url": base64image,
                "detail": "high"
              }
            }
          ]
        }
      ],
      {
        max_tokens: 4096,
        temperature: 0.8,
        response_format: { type: 'json_object' },
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
    .rotate() // auto rotate based on EXIF data
    .flatten({ background: '#FFF' }) // replace alpha channel with white background
    .recomb([ // grayscale
      [0.333, 0.333, 0.333],
      [0.333, 0.333, 0.333],
      [0.333, 0.333, 0.333],
    ])
    .normalise() // full range 0 to 255
  // console.info('checked rotation of image + converted to grayscale + resized')

  // await image_bw.toFile(`./cache/images/image_bw.png`)


  let { width, height, orientation, size } = await image_bw.metadata()
  // console.info('width, height, orientation', width, height, orientation, size)

  if (orientation === 6 || orientation === 8) {
    // swap width and height if orientation is 6 or 8
    // source: https://web.archive.org/web/20180622174614/http://www.impulseadventure.com/photo/exif-orientation.html
    const tmp = width
    width = height
    height = tmp
  }


  // START dialate
  const photoBuffer = await jimp.read(await image_bw.toBuffer())
  const src = cv.matFromImageData(photoBuffer.bitmap)
  let dst = new cv.Mat()
  let M = cv.Mat.ones(7, 7, cv.CV_8U) // 7x7 kernel with all 1's
  let anchor = new cv.Point(-1, -1)
  cv.dilate(src, dst, M, anchor, 1, cv.BORDER_CONSTANT, cv.morphologyDefaultBorderValue())
  const image_dilated = Buffer.from(dst.data)
  console.info('image dilated')
  // END dialate


  // const image_dilated_tmp = await sharp(image_dilated, {
  //   raw: {
  //     width,
  //     height,
  //     channels: 4,
  //   }
  // })
  // await image_dilated_tmp.toFile(`./cache/images/image_dilated_tmp.png`)


  // const image_median_tmp = await sharp(image_dilated, {
  //   raw: {
  //     width,
  //     height,
  //     channels: 4,
  //   }
  // })
  //   .median(21)
  // await image_median_tmp.toFile(`./cache/images/image_median_tmp.png`)

  const image_blurred = await sharp(image_dilated, {
    raw: {
      width,
      height,
      channels: 4,
    }
  }) // await sharp(await image_bw.clone().toBuffer())
    .median(21) // median-blur // 30px is the line-height sweet-spot for tesseract. so 61px as a median blur should remove most of the lines BUT the stackoverflow-article suggests 21px as a good value. i guess this is 3x the kernel size of the dialation
    .normalise()
  console.info('image blurred')

  // await image_blurred.toFile(`./cache/images/image_blurred.png`)

  const bw_buffer = await image_bw.extractChannel('red').raw().toBuffer()

  const new_grayscale = await image_blurred.extractChannel('red').raw().toBuffer()
    .then(blurred_buffer => {
      const rgb = []
      for (let i = 0; i < blurred_buffer.length; i += 1) {
        const new_value = 255 - (blurred_buffer[i] - bw_buffer[i])
        // const inverted_value = 255 - new_value
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
  console.info('removed shadows from image')


  // const image_bw_buffer = await new_grayscale.extractChannel('red').raw().toBuffer()
  const image_better = await sharp(Buffer.from(new_grayscale), {
    raw: {
      width,
      height,
      channels: 1,
    }
  })
    .normalise()
    // .threshold(180) // 220 // only full white or full black
    // .ensureAlpha() // add alpha channel if not already present
    .trim({
      background: '#fff',
      threshold: 127,
      // lineArt: true
    })
    // .negate()
    // .linear(1.5, 0) // Increase contrast and slightly darken
    // .linear(1.5, -10) // Increase contrast and slightly darken
    // .gamma(1.8) // Adjust gamma to further enhance contrast
    .resize({ width: 600, fit: 'inside' }) // resize to max 1400px on the largest side
    .jpeg({
      quality: 60,
      // chromaSubsampling: '4:4:4',
    })


  // save image to disk for debugging
  // checkif ./images/ exists
  // use_cache()
  // if (!fs.existsSync('./cache/images/')) {
  //   fs.mkdirSync('./cache/images/', { recursive: true })
  // }
  // await image_better.toFile(`./cache/images/debug.jpg`)
  // console.info('saved debug image')


  return {
    mimetype: 'image/jpeg',
    data: await image_better.toBuffer(),
    width,
    height,
  }
}

console.info('Initializing server...')

const app = express()
app.use(cors())
app.use(function (req, res, next) {
  // console.info('app.use - request url:', req.url)

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

function sortObjectKeysRecursively(obj) {
  if (Array.isArray(obj)) {
    // If the object is an array, map over its elements and sort any objects within it
    return obj.map(item => sortObjectKeysRecursively(item));
  } else if (obj !== null && typeof obj === 'object') {
    // If the object is not an array and is an object, sort its keys
    const sortedKeys = Object.keys(obj).sort();
    const sortedObj = {};
    sortedKeys.forEach((key) => {
      sortedObj[key] = sortObjectKeysRecursively(obj[key]);
    });
    return sortedObj;
  }
  // Return the value if it's neither an object nor an array
  return obj;
}

app.post('/api/ocr', multer_upload.any(), async (req, res) => {
  // console.info('/api/ocr')

  try {
    // check if we even got files
    if (!req.files || req.files.length === 0) {
      return res.status(400).send('No file was uploaded.');
    }

    // start connection to github
    const octokit = initOctokit()
    const defaultProps = {
      octokit,
      owner: 'thomasrosen',
      repo: 'money-data',
    }

    // convert image to bw + remove shadows + crop
    const file = req.files[0]
    const parsedImage = await loadImage(file.buffer)
    const base64String = parsedImage.data.toString('base64');
    const dataUrl = `data:${parsedImage.mimetype};base64,${base64String}`;
    console.info(file.size, 'bytes of image data received')

    // get the hash of the image to only save and parse once
    const imageHash = getSha512Hash(base64String) // sha512 so there are really few collisions

    // check if image already exists. if yes: stop
    const fileDoesExists = await checkFileExistsByPath({
      ...defaultProps,
      path: `images/${imageHash}.jpg`,
    })
    if (fileDoesExists) {
      throw new Error('image was already uploaded')
    }

    // upload the image
    await createOrUpdateFileContents({
      ...defaultProps,
      path: `images/${imageHash}.jpg`,
      base64content: base64String,
    })

    // parse the image with an LLM and get the content as json
    let invoice_result = await image_to_structured_json(dataUrl)
    const invoice_id = genID()
    invoice_result.id = invoice_id // save the id in the file (and later use it as the filename)
    invoice_result.images = [imageHash] // add reference to the image
    // console.info('got json structure from text')

    // sort the json object
    invoice_result = sortObjectKeysRecursively(invoice_result)

    // save the json to github
    await createOrUpdateFileContents({
      ...defaultProps,
      path: `data/${invoice_id}.json`,
      base64content: text2base64(JSON.stringify(invoice_result, null, 2)),
    })

    // return the json to the user
    res.setHeader('Content-Type', 'application/json')
    res.writeHead(200)
    res.end(JSON.stringify({
      result: invoice_result,
    }, null, 2))
  } catch (err) {
    console.error('error in /api/ocr', err)
    res.setHeader('Content-Type', 'application/json')
    res.writeHead(500)
    res.end(JSON.stringify({ error: err.message }))
  }
})



// const save_folder = `${__dirname}/build/`
const static_files_path = path.join(__dirname, '../build/')
app.use(express.static(static_files_path))

app.get('*', (req, res) => {
  res.sendFile('index.html', { root: '../build/' })
})

const port = process.env.PORT || 13151 // the word money as its letter positions in the abc = 13 15 14 5 25
const host = '0.0.0.0' // Uberspace wants 0.0.0.0 instead of localhost
app.listen(port, host, () => {
  console.info(`Server listening at http://${host}:${port}`)
})
