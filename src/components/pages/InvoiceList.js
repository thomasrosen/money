import { useEffect } from 'react'

import { useSelector, useDispatch } from 'react-redux'
import {
  fetchInvoices,
  selectInvoices,
} from '../../redux/slices/invoicesSlice.js'

const rowStyle = {
  display: 'flex',
  flexDirection: 'row',
  flexWrap: 'wrap',
  marginTop: '16px',
  gap: '8px',
}

export default function InvoiceList() {

  const dispatch = useDispatch()
  const invoices = useSelector(selectInvoices)

  useEffect(() => {
    dispatch(fetchInvoices())
  }, [dispatch])

  return <div>
    <div className="middle_box">
      <p><strong>A very simple tool to keep track of some of your spendings.</strong></p>

      <p>The text recognition is handled on the server. But nothing is permanently stored there. All data is only on here in this browser on your computer. You can <strong>export and import</strong> the data to backup or move it to a different browser.</p>

      <p>
        The website is maintained by <a href="https://thomasrosen.me/" target="_blank" rel="noreferrer">Thomas Rosen</a>. You can contact me at <a href="mailto:money@thomasrosen.me">money@thomasrosen.me</a>.
      </p>
    </div>
    <br />
    <br />


    {
      invoices.length === 0
      ? <>
          <h2>Invoices</h2>
          <p>No invoices found.</p>
        </>
      : <>
        <h2>Invoices</h2>
        {
          invoices.map(invoice => {
            return <div style={rowStyle} key={invoice.id}>
              {/*<img src={invoice.image} alt={invoice.name} />*/}
              <strong>{invoice.place_name}</strong>
              <span>{invoice.place_address}</span>
            </div>
          })
        }
      </>
    }
  </div>
}
