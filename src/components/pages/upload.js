import { useState, useCallback } from 'react'
import Dropzone from '../Dropzone.js'

const thumbsContainer = {
  display: 'flex',
  flexDirection: 'row',
  flexWrap: 'wrap',
  marginTop: 16
};

const thumb = {
  display: 'inline-flex',
  borderRadius: 2,
  border: '1px solid #eaeaea',
  marginBottom: 8,
  marginRight: 8,
  width: 100,
  height: 100,
  padding: 4,
  boxSizing: 'border-box'
};

const thumbInner = {
  display: 'flex',
  minWidth: 0,
  overflow: 'hidden'
};

const img = {
  display: 'block',
  width: 'auto',
  height: '100%'
};

export default function Upload() {

  const [files, setFiles] = useState([])

  const onChange = useCallback(acceptedFiles => {
    acceptedFiles = acceptedFiles.map(file => Object.assign(file, {
      preview: URL.createObjectURL(file)
    }))

    setFiles(acceptedFiles)
  }, [])

  return <div>
    <Dropzone onChange={onChange} />
    <br />
    <br />

    {
      files.length > 0
      ? <>
        <h4>Files</h4>
        <aside style={thumbsContainer}>
        {
          files
          .map(file => (
            <div style={thumb} key={file.name}>
              <div style={thumbInner}>
                <img
                  alt={`${file.path} - ${file.size} bytes`}
                  title={`${file.path} - ${file.size} bytes`}
                  src={file.preview}
                  style={img}
                  // Revoke data uri after image is loaded
                  onLoad={() => { URL.revokeObjectURL(file.preview) }}
                />
              </div>
            </div>
          ))
        }
        </aside>
      </>
      : null
    }

  </div>
}
