import { useEffect, useState } from 'react'
import { api } from './api'
import './AdminPanel.css'

const ROLES = ['admin', 'clerk']

function AdminPanel({ token, user, onBack }) {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [confirmId, setConfirmId] = useState(null)
  const [savingId, setSavingId] = useState(null)

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('clerk')
  const [formError, setFormError] = useState('')
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    api('/api/users', { token })
      .then((data) => {
        setUsers(data.users ?? [])
        setLoading(false)
      })
      .catch((err) => {
        setError(err.message)
        setLoading(false)
      })
  }, [token])

  function flash(message) {
    setNotice(message)
    setError('')
    setTimeout(() => setNotice(''), 4000)
  }

  function changeRole(u, newRole) {
    if (newRole === u.role) return
    setSavingId(u.id)
    api(`/api/users/${u.id}`, { method: 'PUT', body: { role: newRole }, token })
      .then(() => {
        setUsers((prev) =>
          prev.map((x) => (x.id === u.id ? { ...x, role: newRole } : x))
        )
        setSavingId(null)
        flash(`${u.name} is now ${newRole}`)
      })
      .catch((err) => {
        setSavingId(null)
        setError(err.message)
      })
  }

  function deleteUser(u) {
    api(`/api/users/${u.id}`, { method: 'DELETE', token })
      .then(() => {
        setUsers((prev) => prev.filter((x) => x.id !== u.id))
        setConfirmId(null)
        flash(`${u.name} was deleted`)
      })
      .catch((err) => {
        setError(err.message)
        setConfirmId(null)
      })
  }

  function handleCreate(e) {
    e.preventDefault()
    setFormError('')
    if (password.length < 6) {
      setFormError('Password must be at least 6 characters.')
      return
    }
    setCreating(true)
    api('/api/register', {
      method: 'POST',
      body: { name, email, password, role },
      token,
    })
      .then((data) => {
        setUsers((prev) => [...prev, data.user])
        setShowForm(false)
        setName('')
        setEmail('')
        setPassword('')
        setRole('clerk')
        setCreating(false)
        flash(`${data.user.name} was created`)
      })
      .catch((err) => {
        setFormError(err.message)
        setCreating(false)
      })
  }

  return (
    <main className="admin">
      <header className="admin-header">
        <div>
          <h1>User management</h1>
          <span className="admin-user">
            {user.name} ({user.role})
          </span>
        </div>
        <button className="admin-back" onClick={onBack}>
          ← Back to waybills
        </button>
      </header>

      <section className="admin-bar">
        <p className="admin-count">
          {loading ? 'Loading…' : `${users.length} user${users.length === 1 ? '' : 's'}`}
        </p>
        <button
          type="button"
          className="admin-new"
          onClick={() => setShowForm((v) => !v)}
        >
          {showForm ? 'Cancel' : '+ New user'}
        </button>
      </section>

      {notice && (
        <p className="admin-notice" role="status">
          {notice}
        </p>
      )}
      {error && (
        <p className="admin-error" role="alert">
          {error}
        </p>
      )}

      {showForm && (
        <form className="admin-form" onSubmit={handleCreate}>
          <h2>Create user</h2>
          <div className="admin-form-grid">
            <label>
              Name
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </label>
            <label>
              Email
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </label>
            <label>
              Password
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={6}
                required
              />
            </label>
            <label>
              Role
              <select value={role} onChange={(e) => setRole(e.target.value)}>
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </label>
          </div>
          {formError && <p className="admin-error">{formError}</p>}
          <button type="submit" className="admin-new" disabled={creating}>
            {creating ? 'Creating…' : 'Create user'}
          </button>
        </form>
      )}

      {loading ? null : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th className="actions-col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const isSelf = u.id === user.id
                return (
                  <tr key={u.id} className={isSelf ? 'self-row' : ''}>
                    <th scope="row" className="admin-name">
                      {u.name}
                      {isSelf && <span className="you-badge">you</span>}
                    </th>
                    <td data-label="Email" className="admin-email">
                      {u.email}
                    </td>
                    <td data-label="Role">
                      <select
                        className="role-select"
                        value={u.role}
                        disabled={isSelf || savingId === u.id}
                        onChange={(e) => changeRole(u, e.target.value)}
                      >
                        {ROLES.map((r) => (
                          <option key={r} value={r}>
                            {r}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td data-label="Actions" className="actions-col">
                      {isSelf ? (
                        <span className="admin-hint">can’t edit yourself</span>
                      ) : confirmId === u.id ? (
                        <span className="confirm-group">
                          <button
                            type="button"
                            className="admin-delete sure"
                            onClick={() => deleteUser(u)}
                          >
                            Delete for real
                          </button>
                          <button
                            type="button"
                            className="admin-cancel"
                            onClick={() => setConfirmId(null)}
                          >
                            Keep
                          </button>
                        </span>
                      ) : (
                        <button
                          type="button"
                          className="admin-delete"
                          onClick={() => setConfirmId(u.id)}
                        >
                          Delete
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </main>
  )
}

export default AdminPanel
