import {
  createHashRouter,
} from 'react-router-dom'

import App from './App.js'
import Upload from './pages/upload.js'

export const router = createHashRouter([
  {
    path: '/',
    element: <App />,
    children: [
      {
        path: '/',
        element: <Upload />,
      },
      {
        path: '*',
        element: <Upload />,
      },
    ]
  },
]);
