import React from 'react'
import './App.css'

import '../fonts/ubuntu-v15-latin/index.css'
import '../fonts/ubuntu-mono-v10-latin/index.css'

import {
  Outlet,
} from 'react-router-dom'

export default function App() {

  return <div className={`app_wrapper`}>
    <header>
      <h1>💶 Money</h1>

      <a href="https://github.com/thomasrosen/money" target="_blank" rel="noreferrer">Sourcecode</a>
    </header>

    <main>
      <div className="middle_box">
        <p><strong>A very simple tool to keep track of some of your spendings.</strong></p>

        <p>The text recognition is handled on the server. But nothing is permanently stored there. All data is only on here in this browser on your computer. You can <strong>export and import</strong> the data to backup or move it to a different browser.</p>

        <p>
          The website is maintained by <a href="https://thomasrosen.me/" target="_blank" rel="noreferrer">Thomas Rosen</a>. You can contact me at <a href="mailto:money@thomasrosen.me">money@thomasrosen.me</a>.
        </p>
      </div>
      <br />
      <br />

      <Outlet />
    </main>

  </div>
}
