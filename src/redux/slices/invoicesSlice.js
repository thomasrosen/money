// import '../../db.js'

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'

export const invoicesSlice = createSlice({
  name: 'invoices',
  initialState: {
    invoices: [],
  },
  reducers: {
    setInvoices: (state, action) => {
      state.invoices = action.payload
    },
    addInvoices: (state, action) => {
      state.invoices = [
        ...state.invoices,
        ...action.payload,
      ]
    },
  }
})


export const {
  setInvoices,
  addInvoices,
} = invoicesSlice.actions


export const empty_invoice = {
  id: '',
  date_created: '',
  date_modified: '',

  data_issued: '',
  place_name: '',
  place_address: '',
  cost_sum: '',
  cost_sum_currency: '',
  // amount_of_tip: '',
  // amount_of_tip_currency: '',
  // way_of_payment: '',
  items: [],
  images: [],
}

export const fetchInvoices = createAsyncThunk('invoices/fetchInvoices', async (value, thunkApi) => {
  console.log('fetchInvoices')
  const {
    dispatch,
    // getState,
  } = thunkApi || {}

  const data = [
    {
      ...empty_invoice,
      id: '1',
      place_name: 'Rewe',
      place_address: 'streetname 42, 12345 city',
      amount: 42.94,
      amount_currency: '€',
    },
    {
      ...empty_invoice,
      id: '2',
      place_name: 'Edeka',
      place_address: 'streetname 42, 12345 city',
      amount: 42.3,
      amount_currency: '€',
    }
  ]

  dispatch(setInvoices(data))

  // const { filter } = getState()

  // const {
  //   selectedTags,
  //   queryText,
  // } = filter || {}

  // const search_params_data = {}

  // const filtered_selectedTags = selectedTags.filter(Boolean)
  // if (Array.isArray(filtered_selectedTags) && filtered_selectedTags.length > 0) {
  //   search_params_data.tags = filtered_selectedTags.join(',')
  // }

  // if (typeof queryText === 'string' && queryText.length > 0) {
  //   search_params_data.q = queryText
  // }

  // const search_params = new URLSearchParams(search_params_data).toString()

  // const url = `${window.urls.api}invoices.json${search_params.length > 0 ? '?' + search_params : ''}`;

  // console.log('url', url)

  // fetch(url)
  //   .then(response => response.json())
  //   .then(data => {
  //     console.log('data', data)
  //     dispatch(setInvoices(data.invoices))
  //   })
})

export const selectInvoices = state => state.invoices.invoices

export default invoicesSlice.reducer
