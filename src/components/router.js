import {
  createHashRouter,
} from 'react-router-dom'

import App from './App.js'
import Upload from './pages/Upload.js'
import InvoiceList from './pages/InvoiceList.js'
import Editor from './pages/Editor.js'

export const router = createHashRouter([
  {
    path: '/',
    element: <App />,
    children: [
      {
        path: '/new',
        element: <Editor />,
      },
      {
        path: '/upload',
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
