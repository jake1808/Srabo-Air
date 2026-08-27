import { useEffect, useMemo, useState } from 'react'
import { api } from './api'
import './Dashboard.css'

const PER_PAGE = 50

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

function Dashboard({ token, user, onLogout, onOpenAdmin, onNewAwb, onViewAwb }) {
  const [awbs, setAwbs] = useState([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // search input is debounced so we don't hit the API on every keystroke
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')

  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput.trim())
      setPage(1)
    }, 350)
    return () => clearTimeout(t)
  }, [searchInput])

  function applyDates(which, value) {
    if (which === 'from') setFromDate(value)
    else setToDate(value)
    setPage(1)
  }

  function clearFilters() {
    setSearchInput('')
    setFromDate('')
    setToDate('')
    setPage(1)
  }

  useEffect(() => {
    setLoading(true)
    // guard against out-of-order responses: when deps change, the previous
    // in-flight request is marked stale and its result is discarded
    let stale = false

    const params = new URLSearchParams({
      page: String(page),
      per_page: String(PER_PAGE),
    })
    if (search) params.set('q', search)
    if (fromDate) params.set('from', fromDate)
    if (toDate) params.set('to', toDate)

    api(`/api/?${params.toString()}`, { token })
      .then((data) => {
        if (stale) return
        setAwbs(data.airwaybills ?? [])
        setTotal(data.total ?? 0)
        setTotalPages(data.total_pages ?? 1)
        setError('')
        setLoading(false)
      })
      .catch((err) => {
        if (stale) return
        setError(err.message)
        setLoading(false)
      })

    return () => {
      stale = true
    }
  }, [token, page, search, fromDate, toDate])

  const filtersActive = search || fromDate || toDate
  const firstShown = total === 0 ? 0 : (page - 1) * PER_PAGE + 1
  const lastShown = Math.min(page * PER_PAGE, total)

  const pageButtons = useMemo(() => {
    // a compact window of page numbers around the current page
    const buttons = []
    const start = Math.max(1, page - 2)
    const end = Math.min(totalPages, start + 4)
    for (let p = start; p <= end; p++) buttons.push(p)
    return buttons
  }, [page, totalPages])

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
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search AWB no, consignee, airport, goods, contact…"
          />
        </label>

        <div className="dash-dates">
          <label>
            From
            <input
              type="date"
              value={fromDate}
              max={toDate || undefined}
              onChange={(e) => applyDates('from', e.target.value)}
            />
          </label>
          <label>
            To
            <input
              type="date"
              value={toDate}
              min={fromDate || undefined}
              onChange={(e) => applyDates('to', e.target.value)}
            />
          </label>
          {filtersActive && (
            <button type="button" className="dash-clear" onClick={clearFilters}>
              Clear
            </button>
          )}
        </div>
      </section>

      <div className="dash-tablebar">
        <p className="dash-count">
          {loading
            ? 'Loading…'
            : `Showing ${firstShown}–${lastShown} of ${total} air waybills`}
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

      {loading || error ? null : awbs.length === 0 ? (
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
              {awbs.map((a) => (
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
                    {a.nog}
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

      {totalPages > 1 && (
        <nav className="dash-pager" aria-label="Pagination">
          <button
            type="button"
            className="dash-page"
            disabled={page <= 1 || loading}
            onClick={() => setPage(1)}
          >
            « First
          </button>
          <button
            type="button"
            className="dash-page"
            disabled={page <= 1 || loading}
            onClick={() => setPage((p) => p - 1)}
          >
            ‹ Prev
          </button>
          {pageButtons.map((p) => (
            <button
              key={p}
              type="button"
              className={`dash-page${p === page ? ' current' : ''}`}
              disabled={loading}
              onClick={() => setPage(p)}
            >
              {p}
            </button>
          ))}
          <button
            type="button"
            className="dash-page"
            disabled={page >= totalPages || loading}
            onClick={() => setPage((p) => p + 1)}
          >
            Next ›
          </button>
          <button
            type="button"
            className="dash-page"
            disabled={page >= totalPages || loading}
            onClick={() => setPage(totalPages)}
          >
            Last »
          </button>
        </nav>
      )}
    </main>
  )
}

export default Dashboard
