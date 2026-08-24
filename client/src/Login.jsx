import { useState } from 'react'
import { api } from './api'
import staboLogo from './assets/stabo-logo.png'
import './Login.css'

function Login({ onLogin, notice = '' }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      const data = await api('/api/login', {
        method: 'POST',
        body: { email, password },
      })
      onLogin(data.token, data.user)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="login-page">
      <form className="login-card" onSubmit={handleSubmit}>
        <img className="login-logo" src={staboLogo} alt="Stabo Air" />

        {notice && (
          <p className="login-notice" role="status">
            {notice}
          </p>
        )}

        <h1>Sign in</h1>
        <p className="login-sub">Access your air waybill dashboard</p>

        <label className="login-field">
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            placeholder="you@stabo.aero"
            required
          />
        </label>

        <label className="login-field">
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
        </label>

        {error && (
          <p className="login-error" role="alert">
            {error}
          </p>
        )}

        <button className="login-submit" type="submit" disabled={busy}>
          {busy ? 'Signing in…' : 'Sign in'}
        </button>

        <p className="login-footer">Stabo Air · Air Waybill Management</p>
      </form>
    </div>
  )
}

export default Login
