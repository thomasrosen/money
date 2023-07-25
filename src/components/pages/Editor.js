import { useState, useEffect } from 'react'

import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';
import InputAdornment from '@mui/material/InputAdornment';

import { useSelector, useDispatch } from 'react-redux'
import {
  fetchInvoices,
  selectInvoices,
  addInvoices,
  new_empty_invoice,
} from '../../redux/slices/invoicesSlice.js'

import { v4 as uuidv4 } from 'uuid'
import { useParams } from 'react-router-dom'

const currency_label = '€ / $ / …'
const labels = {
  date_created: 'Date Created',
  date_modified: 'Date Modified',
  data_issued: 'Date Issued',
  place_name: 'Place Name',
  place_address: 'Place Address',
  cost_sum: 'Cost Sum',
  cost_sum_currency: currency_label,
  amount_of_tip: 'Amount of Tip',
  amount_of_tip_currency: currency_label,
  way_of_payment: 'Way of Payment',
  items: 'Items',
  images: 'Images',
}

const editor_types = {
  id: 'hidden',
  date_created: 'hidden',
  date_modified: 'hidden',
  data_issued: 'date',
  place_name: 'string',
  place_address: 'string',
  cost_sum: 'money',
  // cost_sum_currency: 'string',
  amount_of_tip: 'money',
  // amount_of_tip_currency: 'string',
  way_of_payment: 'string',
  items: 'item',
  // images: 'image',
}

function Input ({ label, ...props }) {
  return <Autocomplete
    {...props}
    freeSolo
    disableClearable
    options={props.options}
    renderInput={params => (
      <TextField
        {...params}
        label={label || ''}
        InputProps={{
          ...params.InputProps,
          type: 'text',
        }}
      />
    )}
  />
}

function MoneyAmountInput({
  label,
  amount,
  currency,
  currency_options = '€$',
  onAmountChange,
  onCurrencyChange,
}) {
  const currency_label = '€ / $ / …'
  return <div style={{ display: 'flex', gap: '8px' }}>
    <Input
      style={{ width: '100px' }}
      label={currency_label}
      inputValue={currency}
      options={
        currency_options
        .split('')
        .map(title => ({
          title: title,
          firstLetter: (
            typeof title === 'string' && title.length > 0
              ? title[0].toUpperCase()
              : '?'
          )
        }))
        .sort((a, b) => -b.title.localeCompare(a.title))
      }
      getOptionLabel={option => option.title || ''}
      // groupBy={option => option.firstLetter || '?'}
      onInputChange={(_, newValue) => {
        onCurrencyChange(newValue)
      }}
    />
    <TextField
      fullWidth
      label={label}
      InputProps={{
        // type: 'number',
        // step: '0.01',
        inputMode: 'numeric',
        pattern: '[0-9,.]*',
      }}
      defaultValue={amount}
      onChange={event => {
        const newValue = event.target.value
        onAmountChange(newValue)
      }}
    />
  </div>
}

function get_item_options(invoices, key) {
  return [...new Set(invoices
    .flatMap(invoice => invoice?.items || [])
    .map(option => String(option[key] || ''))
    .filter(Boolean)
  )]
    .map(title => ({
      title: title,
      firstLetter: (
        typeof title === 'string' && title.length > 0
          ? title[0].toUpperCase()
          : '?'
      )
    }))
    .sort((a, b) => -b.title.localeCompare(a.title))
}

function ItemEditor ({
  style,
  defaultValue,
  onChange,
}) {
  const [value, setValue] = useState(defaultValue || {})

  const invoices = useSelector(selectInvoices)

  return <div style={style}>
    <div style={{ display: 'flex', gap: '8px', marginBlockEnd: '16px' }}>
      <TextField
        style={{ width: '100px' }}
        label="Quantity"
        InputProps={{
          // type: 'number',
          // step: '0.01',
          inputMode: 'numeric',
          pattern: '[0-9,.]*',
        }}
        defaultValue={value?.quantity}
        onChange={event => {
          const newQuantity = event.target.value
          const newValue = {
            ...value,
            quantity: newQuantity,
          }
          setValue(newValue)
          onChange(newValue)
        }}
      />
      <Input
        fullWidth
        label="Name"
        inputValue={value.item_name || ''}
        options={get_item_options(invoices, 'item_name')}
        getOptionLabel={option => option.item_name || ''}
        groupBy={option => option.firstLetter || '?'}
        onInputChange={(_, newItemName) => {
          const newValue = {
            ...value,
            item_name: newItemName,
          }
          setValue(newValue)
          onChange(newValue)
        }}
      />
    </div>
    <MoneyAmountInput
      label="Total Price"
      amount={value?.price_total || ''}
      currency={value?.price_total_currency || ''}
      onAmountChange={newPriceTotal => {
        const newValue = {
          ...value,
          price_total: newPriceTotal,
        }
        setValue(newValue)
        onChange(newValue)
      }}
      onCurrencyChange={newPriceTotalCurrency => {
        const newValue = {
          ...value,
          price_total_currency: newPriceTotalCurrency,
        }
        setValue(newValue)
        onChange(newValue)
      }}
    />
  </div>
}

export default function Editor() {
  const { invoiceId } = useParams()
  const [loading, setLoading] = useState(true)
  const [isNew, setIsNew] = useState(true)

  const [invoice, setInvoice] = useState({})

  const dispatch = useDispatch()
  const invoices = useSelector(selectInvoices)

  useEffect(() => {
    if (typeof invoiceId === 'string' && invoiceId.length > 0) {
      const new_invoice = new_empty_invoice()
      console.log('new_invoice', new_invoice)
      new_invoice.id = invoiceId
      new_invoice.place_name = 'hello_' + invoiceId
      setInvoice(new_invoice)
      setLoading(false)
      setIsNew(false)
    } else {
      const new_invoice = new_empty_invoice()
      setInvoice(new_invoice)
      setLoading(false)
      setIsNew(true)
    }
  }, [invoiceId, setInvoice, setLoading])

  useEffect(() => {
    dispatch(fetchInvoices())
  }, [dispatch])

  if (loading === true) {
    return <div className="middle_box">
      <nav style={{
        display: 'flex',
        gap: '10px',
        marginBlockEnd: '40px',
      }}>
        <a href="#/">
          <button> ⬅️ Overview</button>
        </a>
      </nav>

      <p>Loading…</p>
    </div>
  }

  return <div className="middle_box">
    <nav style={{
      display: 'flex',
      gap: '10px',
      marginBlockEnd: '40px',
    }}>
      <a href="#/">
        <button> ⬅️ Overview</button>
      </a>
      <button
        className="primary"
        onClick={() => {
          console.log('invoice', invoice)
          dispatch(addInvoices([invoice]))
        }}
      >
        Save Invoice
      </button>
    </nav>

    <h2>
      {
        isNew
          ? 'Add new Invoice'
          : 'Edit Invoice'
      }
    </h2>
    <br />

    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {
      Object.keys(editor_types).map(key => {
        const label = labels[key] || key

        if (editor_types[key] === 'number') {
          return <div key={key}>
            <TextField
              fullWidth
              label={label}
              InputProps={{
                // type: 'number',
                // step: '0.01',
                inputMode: 'numeric',
                pattern: '[0-9,.]*',
              }}
              defaultValue={invoice[key] || ''}
              onChange={event => {
                const newValue = event.target.value
                setInvoice({
                  ...invoice,
                  [key]: newValue || '',
                })
              }}
            />
          </div>
        }

        if (editor_types[key] === 'date') {

          let now = new Date()
          now.setUTCHours(0, 0, 0, 0)
          now = now
            .toISOString()
            .slice(0, 16)

          return <div key={key}>
            <TextField
              fullWidth
              label={label}
              InputProps={{
                type: 'datetime-local',
                startAdornment: <InputAdornment style={{ margin: '0' }} position="start"></InputAdornment>,
              }}
              defaultValue={invoice[key] || now}
              onChange={event => {
                const newValue = event.target.value
                console.log('newValue', newValue)
                setInvoice({
                  ...invoice,
                  [key]: newValue || '',
                })
              }}
            />
          </div>
        }

        if (editor_types[key] === 'money') {
          const key_currency = key + '_currency'
          return <MoneyAmountInput
            key={key}
            label={label}
            amount={invoice[key] || ''}
            currency={invoice[key_currency] || ''}
            onAmountChange={newValue => {
              setInvoice({
                ...invoice,
                [key]: newValue || '',
              })
            }}
            onCurrencyChange={newValue => {
              setInvoice({
                ...invoice,
                [key_currency]: newValue || '',
              })
            }}
          />
        }

        if (editor_types[key] === 'item') {
          const items = (invoice[key] || [])
          return <div key={key}>
            <br />
            <h3>Items</h3>
            {
              items?.map((item, index) => {
                return <ItemEditor
                  style={{
                    marginBlockStart: '32px',
                  }}
                  key={item.id || index}
                  defaultValue={item}
                  onChange={newValue => {
                    console.log('ItemEditor onchange', newValue)

                    const new_items = items
                    const index = new_items.findIndex(item => item.id === newValue.id)
                    if (index !== -1) {
                      new_items[index] = newValue
                    } else {
                      new_items.push(newValue)
                    }

                    setInvoice({
                      ...invoice,
                      [key]: new_items,
                    })
                  }}
                />
              })
            }
            <button
              style={{
                marginBlockStart: '32px',
              }}
              onClick={() => {
                const new_value = [
                  ...items,
                  {
                    id: uuidv4()
                  }
                ]

                setInvoice({
                  ...invoice,
                  [key]: new_value,
                })
              }}
            >
              Add Item
            </button>
            <br />
            <br />
          </div>
        }

        /*
        if (editor_types[key] === 'image') {
          const images = (invoice[key] || [])
          return <div key={key}>
            <br />
            <h3>Images</h3>
            {
              images?.map((image, index) => {
                return <ImageEditor value={image} />
              })
            }
            <button
              style={{
                marginBlockStart: '32px',
              }}
              className="primary"
              onClick={() => {
                const new_value = [
                  ...images,
                  {
                    id: uuidv4()
                  }
                ]

                setInvoice({
                  ...invoice,
                  [key]: new_value,
                })
              }}
            >
              Add Item
            </button>
            <br />
            <br />
          </div>
        }
        */

        if (editor_types[key] === 'hidden') {
          return null
        }

        if (editor_types[key] !== 'string') {
          return null
        }

        return <div key={key}>
          <Input
            label={label}
            inputValue={invoice[key] || ''}
            options={
              [...new Set(invoices
                .map(option => String(option[key] || ''))
                .filter(Boolean)
              )]
                .map(title => ({
                  title: title,
                  firstLetter: (
                    typeof title === 'string' && title.length > 0
                      ? title[0].toUpperCase()
                      : '?'
                  )
                }))
                .sort((a, b) => -b.title.localeCompare(a.title))
            }
            getOptionLabel={option => option.title || ''}
            groupBy={option => option.firstLetter || '?'}
            onInputChange={(_, newValue) => {
              console.log(newValue);
              setInvoice({
                ...invoice,
                [key]: newValue || '',
              })
            }}
          />
        </div>
      })
      .filter(Boolean)
      }
    </div>

  </div>
}
