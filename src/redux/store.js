import { configureStore } from '@reduxjs/toolkit'
// import filterReducer from './slices/filterSlice.js'
// import resourcesReducer from './slices/resourcesSlice.js'
import invoicesReducer from './slices/invoicesSlice.js'

export default configureStore({
  reducer: {
    // filter: filterReducer,
    // resources: resourcesReducer,
    invoices: invoicesReducer,
  },
})
