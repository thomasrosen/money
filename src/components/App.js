import React from 'react'
import './App.css'

import '../fonts/ubuntu-v15-latin/index.css'
import '../fonts/ubuntu-mono-v10-latin/index.css'

import {
  Outlet,
} from 'react-router-dom'

export default function App() {

  const [error, setError] = React.useState(null)

  return <div className={`app_wrapper`}>
    <header>

      <h1>🏳️‍🌈 QR</h1>

      <a href="https://github.com/thomasrosen/money" target="_blank" rel="noreferrer">Sourcecode</a>
    </header>

    <main>
      <h1>🏳️‍🌈 Queer Resources</h1>

      <br />

      <p>A collection of resources for queer people. You're of course also welcome to look through the information if you are an ally.</p>

      <p>You can filter the links via your location and some tags.</p>

      <p>
        The website is maintained by <a href="https://thomasrosen.me/" target="_blank" rel="noreferrer">Thomas Rosen</a>.<br />
        Send an email to <a href="mailto:money@thomasrosen.me">money@thomasrosen.me</a> if you want to add a resource.
      </p>

      <br />
      <br />

      {error && <p>Error: {error}</p>}

      <Outlet />
    </main>

  </div>
}
