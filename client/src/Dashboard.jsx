import { useEffect, useMemo, useState } from 'react'
import { api } from './api'
import './Dashboard.css'

function formatDate(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString(undefined, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function Dashboard({ token, user, onLogout, onOpenAdmin, onNewAwb, onViewAwb, refreshKey }) {
  const [awbs, setAwbs] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')

  useEffect(() => {
    api('/api/', { token })
      .then((data) => {
        setAwbs(data.airwaybills ?? [])
        setLoading(false)
      })
      .catch((err) => {
        setError(err.message)
        setLoading(false)
      })
  }, [token, refreshKey])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    const from = fromDate ? new Date(fromDate) : null
    const to = toDate ? new Date(toDate) : null
    if (to) to.setHours(23, 59, 59, 999)

    return awbs.filter((a) => {
      if (q) {
        const haystack = [a.awb_no, a.consignee, a.airport, a.nops, a.contact]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
        if (!haystack.includes(q)) return false
      }
      const d = a.flight_date ? new Date(a.flight_date) : null
      if (d) {
        if (from && d < from) return false
        if (to && d > to) return false
      }
      return true
    })
  }, [awbs, search, fromDate, toDate])

  const filtersActive = search || fromDate || toDate

  return (
    <main className="dash">
      <header className="dash-header">
        <div>
          <h1>Air Waybills</h1>
          <span className="dash-user">
            {user.name} ({user.role})
          </span>
        </div>
        {user.role === 'admin' && (
          <button className="dash-add" onClick={onOpenAdmin}>
            Add new user
          </button>
        )}
        <button className="dash-logout" onClick={onLogout}>
          Log out
        </button>
      </header>

      <section className="dash-toolbar">
        <label className="dash-search">
          <span className="visually-hidden">Search</span>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search AWB no, consignee, airport…"
          />
        </label>

        <div className="dash-dates">
          <label>
            From
            <input
              type="date"
              value={fromDate}
              max={toDate || undefined}
              onChange={(e) => setFromDate(e.target.value)}
            />
          </label>
          <label>
            To
            <input
              type="date"
              value={toDate}
              min={fromDate || undefined}
              onChange={(e) => setToDate(e.target.value)}
            />
          </label>
          {filtersActive && (
            <button
              type="button"
              className="dash-clear"
              onClick={() => {
                setSearch('')
                setFromDate('')
                setToDate('')
              }}
            >
              Clear
            </button>
          )}
        </div>
      </section>

      <div className="dash-tablebar">
        <p className="dash-count">
          {loading
            ? 'Loading…'
            : `Showing ${filtered.length} of ${awbs.length} air waybills`}
        </p>
        <button className="dash-new" onClick={onNewAwb}>
          + New air waybill
        </button>
      </div>

      {error && (
        <p className="dash-error" role="alert">
          {error}
        </p>
      )}

      {loading || error ? null : filtered.length === 0 ? (
        <p className="dash-empty">
          {filtersActive
            ? 'No air waybills match your search or filters.'
            : 'No air waybills yet.'}
        </p>
      ) : (
        <div className="dash-table-wrap">
          <table className="dash-table">
            <thead>
              <tr>
                <th>AWB No.</th>
                <th>Consignee</th>
                <th>Airport</th>
                <th>Flight date</th>
                <th className="num">Gross wt</th>
                <th className="num">Charg. wt</th>
                <th className="num">Rate</th>
                <th className="num">Total</th>
                <th>Goods</th>
                <th>Contact</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((a) => (
                <tr
                  key={a.id}
                  className="dash-row"
                  tabIndex={0}
                  title="View details"
                  onClick={() => onViewAwb(a)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') onViewAwb(a)
                  }}
                >
                  <th scope="row" className="awb-no">
                    {a.awb_no}
                  </th>
                  <td data-label="Consignee">{a.consignee}</td>
                  <td data-label="Airport">{a.airport}</td>
                  <td data-label="Flight date">{formatDate(a.flight_date)}</td>
                  <td data-label="Gross wt" className="num">
                    {a.gross_weight}
                  </td>
                  <td data-label="Charg. wt" className="num">
                    {a.chargeable_weight}
                  </td>
                  <td data-label="Rate" className="num">
                    {a.rate}
                  </td>
                  <td data-label="Total" className="num">
                    {a.total} {a.currency}
                  </td>
                  <td data-label="Goods" className="goods">
                    {a.nops}
                  </td>
                  <td data-label="Contact" className="contact">
                    {a.contact}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  )
}

export default Dashboard
