import React from 'react'
import './App.css'

import '../fonts/ubuntu-v15-latin/index.css'
import '../fonts/ubuntu-mono-v10-latin/index.css'

import {
  Outlet,
} from 'react-router-dom'

import useMediaQuery from '@mui/material/useMediaQuery';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

export default function App() {
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');

  const theme = React.useMemo(
    () =>
      createTheme({
        palette: {
          mode: prefersDarkMode ? 'dark' : 'light',
        },
      }),
    [prefersDarkMode],
  );

  return <ThemeProvider theme={theme}>
    <CssBaseline />
    <div className={`app_wrapper`}>
    <header>
      <h1>💶 Money</h1>

      <a href="https://github.com/thomasrosen/money" target="_blank" rel="noreferrer">Sourcecode</a>
    </header>

    <main>
      <nav style={{
        display: 'flex',
        gap: '10px',
        justifyContent: 'center', // center in rows
        marginBlockEnd: '40px',
      }}>
        <a href="#/new">
          <button>Add new Invoice</button>
        </a>
        <a href="#/">
          <button>Overview</button>
        </a>
        <a href="#/ocr">
          <button>OCR</button>
        </a>
      </nav>

      <Outlet />
    </main>

  </div>
  </ThemeProvider>
}
