import React, { useMemo } from 'react';
import { useDropzone } from 'react-dropzone';

const baseStyle = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  padding: '20px',
  width: '100%',
  transition: 'box-shadow .2s ease, background-color .2s ease',
}

const focusedStyle = {
  boxShadow: '0 0 0 5px var(--primary-color)',
}

const acceptStyle = {
  boxShadow: '0 0 0 5px var(--primary-color)',
}

const rejectStyle = {
  backgroundColor: 'var(--error-color)',
  boxShadow: '0 0 0 5px var(--error-color)',
}


function Dropzone({ onChange }) {
  const {
    getRootProps,
    getInputProps,
    isFocused,
    isDragAccept,
    isDragReject,
  } = useDropzone({
    maxFiles: 1,
    accept: {
      'image/*': ['.jpeg', '.png']
    },
    onDrop: onChange,
  })

  const style = useMemo(() => ({
    ...baseStyle,
    ...(isFocused ? focusedStyle : {}),
    ...(isDragAccept ? acceptStyle : {}),
    ...(isDragReject ? rejectStyle : {})
  }), [
    isFocused,
    isDragAccept,
    isDragReject
  ])

  return (
    <section className="container">
      <button class="primary" {...getRootProps({ style })}>
        <input {...getInputProps()} />
        {
          isDragReject
          ? <strong>Only JPG and PNG images are allowed!</strong>
          : <strong>Click or Drop an image here!</strong>
        }
      </button>
    </section>
  )
}

export default Dropzone
