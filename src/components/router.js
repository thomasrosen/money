import {
  createHashRouter,
} from 'react-router-dom'

import Editor from './pages/Editor.js'
import InvoiceList from './pages/InvoiceList.js'
import Upload from './pages/Upload.js'

export const router = createHashRouter([
  {
    path: '/',
    // element: <App />,
    element: <Upload />,
    children: [
      {
        path: '/edit',
        element: <Editor />,
      },
      {
        path: '/edit/:invoiceId',
        element: <Editor />,
      },
      {
        path: '/ocr',
        element: <Upload />,
      },
      {
        path: '/',
        element: <InvoiceList />,
      },
      {
        path: '*',
        element: <InvoiceList />,
      },
    ]
  },
]);
