import { useEffect } from 'react'

import { useSelector, useDispatch } from 'react-redux'
import {
  fetchInvoices,
  selectInvoices,
} from '../../redux/slices/invoicesSlice.js'

export default function InvoiceList() {

  const dispatch = useDispatch()
  const invoices = useSelector(selectInvoices)

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
    <p><strong>A very simple tool to keep track of some of your spendings.</strong></p>

    <p>The text recognition is handled on the server. But nothing is permanently stored there. All data is only on here in this browser on your computer. You can <strong>export and import</strong> the data to backup or move it to a different browser.</p>

    <p>
      The website is maintained by <a href="https://thomasrosen.me/" target="_blank" rel="noreferrer">Thomas Rosen</a>. You can contact me at <a href="mailto:money@thomasrosen.me">money@thomasrosen.me</a>.
    </p>

    <br />
    </div>
    <div className="middle_box" style={{ margin: '0' }}>

    {
      invoices.length === 0
      ? <>
          <h2>Invoices</h2>
          <br />
          <a href="#/edit">
            <button className="primary">Add your first Invoice</button>
          </a>
        </>
      : <>
        <h2>Invoices</h2>
        <br />
        <a href="#/edit">
          <button className="primary">Add new Invoice</button>
        </a>

        {
          invoices.map(invoice => {
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

              <p>
                {(invoice.items || []).length} Items for {invoice.cost_sum || '??.??'} {invoice.cost_sum_currency || '?'} {invoice.place_address ?? `at ${invoice.place_address}`}.
              </p>
            </a>
          })
        }
      </>
    }
    </div>
  </div>
}
