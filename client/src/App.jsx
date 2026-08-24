import { useEffect, useState } from 'react'
import Login from './Login'
import Dashboard from './Dashboard'
import AdminPanel from './AdminPanel'
import NewAirWayBill from './NewAirWayBill'
import AwbDetail from './AwbDetail'
import { setUnauthorizedHandler } from './api'
import './App.css'

function App() {
  const [token, setToken] = useState(() => localStorage.getItem('token'))
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('user')))
  const [view, setView] = useState('dashboard')
  const [awbRefresh, setAwbRefresh] = useState(0)
  const [selectedAwb, setSelectedAwb] = useState(null)
  const [sessionExpired, setSessionExpired] = useState(false)

  // any 401 from the API ends the session and returns to login
  useEffect(() => {
    setUnauthorizedHandler(() => {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      setToken(null)
      setUser(null)
      setSelectedAwb(null)
      setView('dashboard')
      setSessionExpired(true)
    })
  }, [])

  function handleLogin(token, user) {
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(user))
    setToken(token)
    setUser(user)
    setSessionExpired(false)
  }

  function handleLogout() {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setToken(null)
    setUser(null)
  }

  return token ? (
    view === 'admin' && user.role === 'admin' ? (
      <AdminPanel
        token={token}
        user={user}
        onBack={() => setView('dashboard')}
        onLogout={handleLogout}
      />
    ) : view === 'new-awb' ? (
      <NewAirWayBill
        token={token}
        onBack={() => setView('dashboard')}
        onCreated={() => {
          setAwbRefresh((n) => n + 1)
          setView('dashboard')
        }}
      />
    ) : view === 'awb-detail' && selectedAwb ? (
      <AwbDetail
        awb={selectedAwb}
        onBack={() => {
          setSelectedAwb(null)
          setView('dashboard')
        }}
      />
    ) : (
      <Dashboard
        token={token}
        user={user}
        onLogout={handleLogout}
        onOpenAdmin={() => setView('admin')}
        onNewAwb={() => setView('new-awb')}
        onViewAwb={(awb) => {
          setSelectedAwb(awb)
          setView('awb-detail')
        }}
        refreshKey={awbRefresh}
      />
    )
  ) : (
    <Login
      onLogin={handleLogin}
      notice={sessionExpired ? 'Your session expired — please sign in again.' : ''}
    />
  )
}

export default App