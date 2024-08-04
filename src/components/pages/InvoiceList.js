import { useCallback, useEffect, useState } from 'react'

import { useDispatch, useSelector } from 'react-redux'
import {
  fetchInvoices,
  selectInvoices,
  selectLatestTenPhotos,
} from '../../redux/slices/invoicesSlice.js'

import Dropzone from '../Dropzone.js'



const thumbsContainer = {
  display: 'flex',
  flexDirection: 'row',
  flexWrap: 'wrap',
  gap: '8px',
  padding: '16px',
  marginBlockEnd: '16px',
}

const thumb = {
  border: '1px solid #eaeaea',
  width: 'auto',
  height: '100px',
  padding: '4px',
  borderRadius: '8px',
}

const img = {
  display: 'block',
  width: 'auto',
  height: '100%',
  borderRadius: '4px',
}



export default function InvoiceList() {

  const dispatch = useDispatch()
  const invoices = useSelector(selectInvoices)
  const latestTenPhotos = useSelector(selectLatestTenPhotos)

  const [files, setFiles] = useState([])

  const onDropzoneChange = useCallback(acceptedFiles => {
    acceptedFiles = acceptedFiles.map(file => Object.assign(file, {
      preview: URL.createObjectURL(file)
    }))

    setFiles(acceptedFiles)
  }, [])

  const savePhotos = useCallback(() => {
    console.log('files', files)

    // setFiles([])
  }, [files])

  useEffect(() => {
    dispatch(fetchInvoices())
  }, [dispatch])

  return <div style={{
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
    justifyContent: 'center',
    gap: '0 32px',
  }}>
    <div className="middle_box" style={{ margin: '0' }}>
      {/* <h1 style={{ fontSize: '56px' }}>THIS IS NOT A WORKING PRODUCT!!!</h1> */}
      {/* <br /> */}

      <p><strong>A very simple tool to keep track of some of your spendings.</strong></p>

      <p>The text recognition is handled on the server. But nothing is permanently stored there. All data is only on here in this browser on your computer. You can <strong>export and import</strong> the data to backup or move it to a different browser.</p>

      <p>
        The website is maintained by <a href="https://thomasrosen.me/" target="_blank" rel="noreferrer">Thomas Rosen</a>. You can contact me at <a href="mailto:money@thomasrosen.me">money@thomasrosen.me</a>.
      </p>

      <nav>
        <button>Export</button>
        <button>Import</button>
      </nav>

      <br />
    </div>
    <div className="middle_box" style={{ margin: '0' }}>

      <h2>🧾 Detect Invoices</h2>

      {
        files.length > 0
          ? <>
            <div title="Selected Images." className="invoiceCard" style={thumbsContainer}>
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
            </div>
            <p>The photos will be temporarily uploaded and processed on the server. Once you receive the results, both the photos and any associated data will be stored only on your computer and completely deleted from the server.</p>
            <button className="primary" onClick={savePhotos}>Save Photos</button>
            <br />
            <br />
          </>
          : <>
            <br />
            <Dropzone onChange={onDropzoneChange} />
          </>
      }


      {
        latestTenPhotos.length > 0
          ? <div className="invoiceCard">
            {
              latestTenPhotos.map(photo => {
                return <a
                  key={photo.id}
                  href={`#/photo/${photo.id}`}
                >
                  <img alt="" src={photo.original_image} />
                </a>
              })
            }
          </div>
          : null
      }
      <br />
      <br />

      <h2>Invoices</h2>
      <br />
      {
        invoices.length === 0
          ? <nav>
            <a href="#/edit">
              <button className="primary">Add your first Invoice</button>
            </a>
          </nav>
          : <>
            <nav>
              <a href="#/edit">
                <button className="primary">Add new Invoice</button>
              </a>
            </nav>

            {
              invoices.map(invoice => {
                const items_count = (invoice.items || []).length
                return <a
                  key={invoice.id}
                  href={`#/edit/${invoice.id}`}
                  className="invoiceCard"
                >
                  {/*<img src={invoice.image} alt={invoice.name} />*/}

                  <span>
                    <h3 style={{ display: 'inline' }}>{invoice.place_name}</h3>
                    {invoice.data_issued && ` • ${invoice.data_issued}`}
                  </span>

                  {invoice.place_address ?? <p style={{ display: 'inline' }}>{invoice.place_address}</p>}

                  <p style={{
                    display: 'flex',
                    gap: '8px',
                    justifyContent: 'space-between',
                  }}>
                    <span>{items_count === 1 ? `1 Item` : `${items_count} Items`} for</span>
                    <span>{invoice.cost_sum || '??.??'} {invoice.cost_sum_currency || '?'}</span>
                  </p>
                </a>
              })
            }
          </>
      }
    </div>
  </div>
}
