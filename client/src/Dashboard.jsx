import { useEffect, useState } from 'react'
import { api } from './api'

function Dashboard({ token, user, onLogout }) {
  const [message, setMessage] = useState('')

  useEffect(() => {
    api('/api/', { token })
      .then((data) => setMessage(data.message))
      .catch((err) => setMessage(err.message))
  }, [token])

  return (
    <main>
      <header>
        <span>
          {user.name} ({user.role})
        </span>
        <button onClick={onLogout}>Log out</button>
      </header>
      <p>{message || 'Loading…'}</p>
    </main>
  )
}

export default Dashboard