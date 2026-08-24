import { useState } from 'react'
import Login from './Login'
import Dashboard from './Dashboard'
import AdminPanel from './AdminPanel'
import NewAirWayBill from './NewAirWayBill'
import './App.css'

function App() {
  const [token, setToken] = useState(() => localStorage.getItem('token'))
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('user')))
  const [view, setView] = useState('dashboard')
  const [awbRefresh, setAwbRefresh] = useState(0)

  function handleLogin(token, user) {
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(user))
    setToken(token)
    setUser(user)
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
    ) : (
      <Dashboard
        token={token}
        user={user}
        onLogout={handleLogout}
        onOpenAdmin={() => setView('admin')}
        onNewAwb={() => setView('new-awb')}
        refreshKey={awbRefresh}
      />
    )
  ) : (
    <Login onLogin={handleLogin} />
  )
}

export default App