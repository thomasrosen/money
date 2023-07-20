import { useState, useEffect } from 'react'

import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';
import InputAdornment from '@mui/material/InputAdornment';

import { useSelector, useDispatch } from 'react-redux'
import {
  fetchInvoices,
  selectInvoices,
  addInvoices,
  empty_invoice,
} from '../../redux/slices/invoicesSlice.js'

import { v4 as uuidv4 } from 'uuid'

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
  images: 'ids',
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
  return <div style={{ display: 'flex', gap: '10px' }}>
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

function ItemEditor ({
  items = [],
  style,
  deafultValue,
  onChange,
}) {
  const [value, setValue] = useState(deafultValue || {})

  function get_item_options (items, key) {
    return [...new Set(items
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

  return <div style={style}>

    <Input
      label="Item Name"
      inputValue={value.title || ''}
      options={get_item_options(items, 'title')}
      getOptionLabel={option => option.title || ''}
      groupBy={option => option.firstLetter || '?'}
      onInputChange={(_, newTitle) => {
        const newValue = {
          ...value,
          title: newTitle,
        }
        setValue(newValue)
        onChange(newValue)
      }}
    />

    <MoneyAmountInput
      label="Price of Item"
      amount={value?.amount || ''}
      currency={value?.currency || ''}
      onAmountChange={newAmount => {
        const newValue = {
          ...value,
          amount: newAmount,
        }
        setValue(newValue)
        onChange(newValue)
      }}
      onCurrencyChange={newCurrency => {
        const newValue = {
          ...value,
          currency: newCurrency,
        }
        setValue(newValue)
        onChange(newValue)
      }}
    />
  </div>
}

export default function Editor() {

  const [invoice, setInvoice] = useState({
    ...empty_invoice,
    id: uuidv4(),
  });

  const dispatch = useDispatch()
  const invoices = useSelector(selectInvoices)

  useEffect(() => {
    dispatch(fetchInvoices())
  }, [dispatch])

  return <div className="middle_box">
    <h2>Add new Invoice</h2>
    <br />

    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {
      Object.keys(invoice).map(key => {
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
                    marginBlockStart: '16px',
                    marginBlockEnd: '16px',
                  }}
                  key={item.id || index}
                  deafultValue={item}
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
            <br />
            <button
              className="primary"
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

      <button
        className="primary"
        onClick={() => {
          console.log('invoice', invoice)
          dispatch(addInvoices([invoice]))
        }}
      >
        Save Invoice
      </button>
    </div>

  </div>
}
