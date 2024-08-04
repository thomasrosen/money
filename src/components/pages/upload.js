import { useCallback, useState } from 'react'
import Dropzone from '../Dropzone.js'

// import '../../db.js'

const thumbsContainer = {
  display: 'flex',
  flexDirection: 'row',
  flexWrap: 'wrap',
  marginTop: '16px',
}

const thumb = {
  border: '1px solid #eaeaea',
  marginBottom: '8px',
  marginRight: '8px',
  width: 'auto',
  height: '100px',
  padding: '4px',
}

const img = {
  display: 'block',
  width: 'auto',
  height: '100%',
}

// function file_to_image(file) {
//   return new Promise((resolve, reject) => {
//     const reader  = new FileReader()
//     // it's onload event and you forgot (parameters)
//     reader.onload = function(e)  {
//         console.log('e.target.result', e.target.result)
//         var image = document.createElement('img')
//         // the result image data
//         image.src = e.target.result
//       document.body.appendChild(image)
//       console.log('image', image)
//         resolve()
//      }
//      reader.onerror = function(e) {
//       reject()
//      }
//      // you have to declare the file loading
//      reader.readAsDataURL(file)
//   })
//  }

export default function Upload() {

  const [files, setFiles] = useState([])
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)

  const onChange = useCallback(acceptedFiles => {
    console.log('onChange-acceptedFiles', acceptedFiles)

    acceptedFiles = acceptedFiles.map(file => Object.assign(file, {
      preview: URL.createObjectURL(file)
    }))

    setFiles(acceptedFiles)
  }, [])

  const send_files = useCallback(async () => {
    ; (async () => {
      setLoading(true)
    })()
    console.log('send_files-files', files)
    if (files.length === 0) {
      throw new Error('No files selected')
    }

    const file = files[0]
    console.log('send_files-file', file)

    // const data_url = file_to_image(file)

    // // get image-blob-content from the file
    // const imageResponse = await fetch(file.preview)
    // const imageBlob = await imageResponse.blob()

    // create a formdata object
    const formData = new FormData()
    formData.append('file', file)
    console.log('send_files-formData', formData)

    // send the formdata to the server at /api/ocr using fetch
    const url = `${window.urls.api}ocr`
    console.log('url', url)
    const response = await fetch(url, {
      method: 'POST',
      body: formData
    })
    const json = await response.json()
    console.log('send_files-json', json)
    setLoading(false)
    setResult(json)


    // setResult({
    //   hello: 'world'
    // })

  }, [files])

  return <div>
    <div className="middle_box">
      <h1>Hello</h1>
      <Dropzone onChange={onChange} />
      <br />
      {
        files.length > 0
          ? <>
            <h4>Selected Images</h4>
            <aside style={thumbsContainer}>
              {
                files
                  .map(file => (
                    <div style={thumb} key={file.name}>
                      <img
                        alt={`${file.path} - ${file.size} bytes`}
                        title={`${file.path} - ${file.size} bytes`}
                        src={file.preview}
                        style={img}
                        // Revoke data uri after image is loaded
                        onLoad={() => { URL.revokeObjectURL(file.preview) }}
                      />
                    </div>
                  ))
              }
            </aside>
            <button onClick={send_files}>Send one file</button>
            {
              loading ? <div>Loading...</div> : null
            }
          </>
          : null
      }
      {
        result !== null
          ? <>
            <br />
            <br />
            <pre><code>{JSON.stringify(result, null, 2)}</code></pre>
          </>
          : null
      }
    </div>
  </div>
}
