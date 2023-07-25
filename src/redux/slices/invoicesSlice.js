import {
  db_row_add,
  // db_row_delete,
  // db_row_get,
  db_row_get_all,
  // db_row_update,
} from '../../db.js'

import { v4 as uuidv4 } from 'uuid'

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'

export const invoicesSlice = createSlice({
  name: 'invoices',
  initialState: {
    invoices: [],
    photos: [],
  },
  reducers: {
    setInvoices: (state, action) => {
      state.invoices = action.payload
    },
    setPhotos: (state, action) => {
      state.photos = action.payload
    },
  }
})


export const {
  setInvoices,
  setPhotos,
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

export const empty_photo = {

  // Images:
  //   - id[uuid]
  //   // - date_created [iso date]
  //   // - date_modified [iso date]
  //   - filename[string]
  //   - extracted_text[string]
  //   - original_image[blob]
  // - corrected_image [blob]

  id: '',
  date_created: '',
  date_modified: '',
  filename: '',
  extracted_text: '',
  original_image: null,
}

export function new_empty_invoice () {
  return {
    ...empty_invoice,
    id: uuidv4(),
    date_created: new Date(),
    date_modified: new Date(),
    data_issued: new Date(),
  }
}

export function new_empty_photo() {
  return {
    ...empty_photo,
    id: uuidv4(),
    date_created: new Date(),
    date_modified: new Date(),
  }
}

export const addInvoices = createAsyncThunk('invoices/addInvoices', async (newInvoices, thunkApi) => {
  if (Array.isArray(newInvoices)) {
    const {
      dispatch,
      getState,
    } = thunkApi || {}

    for (const newInvoice of newInvoices) {
      await db_row_add('invoices', newInvoice)
    }

    const state = getState()

    dispatch(setInvoices([
      ...state.invoices,
      ...newInvoices,
    ]))
  }
})

export const addPhotos = createAsyncThunk('invoices/addPhotos', async (newPhotos, thunkApi) => {
  if (Array.isArray(newPhotos)) {
    const {
      dispatch,
      getState,
    } = thunkApi || {}

    for (const newPhoto of newPhotos) {
      await db_row_add('photos', newPhoto)
    }

    const state = getState()

    dispatch(setPhotos([
      ...state.photos,
      ...newPhotos,
    ]))
  }
})

export const fetchInvoices = createAsyncThunk('invoices/fetchInvoices', async (value, thunkApi) => {

  const {
    dispatch,
    // getState,
  } = thunkApi || {}

  const invoices = await db_row_get_all('invoices')
  dispatch(setInvoices(invoices))

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

export const fetchPhotos = createAsyncThunk('invoices/fetchPhotos', async (value, thunkApi) => {

  const {
    dispatch,
    // getState,
  } = thunkApi || {}

  const photos = await db_row_get_all('photos')
  dispatch(setPhotos(photos))
})

export const selectInvoices = state => state.invoices.invoices
export const selectPhotos = state => state.invoices.photos

export default invoicesSlice.reducer
