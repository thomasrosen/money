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
  items: 'ids',
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

export default function Editor() {

  const [value, setValue] = useState(empty_invoice);

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
      Object.keys(value).map(key => {
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
              defaultValue={value[key] || ''}
              onChange={event => {
                const newValue = event.target.value
                setValue({
                  ...value,
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
              defaultValue={value[key] || now}
              onChange={event => {
                const newValue = event.target.value
                console.log('newValue', newValue)
                setValue({
                  ...value,
                  [key]: newValue || '',
                })
              }}
            />
          </div>
        }

        if (editor_types[key] === 'money') {
          const key_currency = key + '_currency'
          const label_currency = labels[key_currency] || key_currency

          return <div key={key} style={{ display: 'flex', gap: '10px' }}>
            <Input
              style={{ width: '100px' }}
              label={label_currency}
              inputValue={value[key_currency] || ''}
              options={
                [...new Set(invoices
                  .map(option => String(option[key_currency] || ''))
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
                setValue({
                  ...value,
                  [key_currency]: newValue || '',
                })
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
              defaultValue={value[key] || ''}
              onChange={event => {
                const newValue = event.target.value
                setValue({
                  ...value,
                  [key]: newValue || '',
                })
              }}
            />
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
            inputValue={value[key] || ''}
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
              setValue({
                ...value,
                [key]: newValue || '',
              })
            }}
          />
        </div>
      })
      .filter(Boolean)
    }

    <button
      onClick={() => {
        console.log('value', value)
          dispatch(addInvoices(value))
      }}
    >
      Add
    </button>
    </div>

  </div>
}
