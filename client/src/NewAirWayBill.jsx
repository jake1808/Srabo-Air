import { useMemo, useState } from 'react'
import './NewAirWayBill.css'

const MAX_PDF_MB = 16

const INITIAL = {
  awb_no: '',
  consignee: '',
  airport: '',
  flight_date: '',
  currency: 'USD',
  nops: '',
  gross_weight: '',
  chargeable_weight: '',
  rate: '',
  nog: '',
  contact: '',
  total_prepaid: '',
  total_collect: '0',
  cccdc: '0',
  expiry_date: '',
}

function NewAirWayBill({ token, onBack, onCreated }) {
  const [form, setForm] = useState(INITIAL)
  const [file, setFile] = useState(null)
  const [fileError, setFileError] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const total = useMemo(() => {
    const cw = parseFloat(form.chargeable_weight)
    const r = parseFloat(form.rate)
    if (Number.isNaN(cw) || Number.isNaN(r)) return ''
    return (cw * r).toFixed(2)
  }, [form.chargeable_weight, form.rate])

  function set(key, value) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  function acceptFile(f) {
    setFileError('')
    if (!f) {
      setFile(null)
      return
    }
    const isPdf =
      f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf')
    if (!isPdf) {
      setFileError('Only PDF files are accepted.')
      setFile(null)
      return
    }
    if (f.size > MAX_PDF_MB * 1024 * 1024) {
      setFileError(`File is too large (max ${MAX_PDF_MB} MB).`)
      setFile(null)
      return
    }
    setFile(f)
  }

  function handleFilePick(e) {
    acceptFile(e.target.files[0])
  }

  function handleDrop(e) {
    e.preventDefault()
    acceptFile(e.dataTransfer.files[0])
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setFileError('')
    setSubmitting(true)
    try {
      // multipart/form-data: JSON can't carry the file
      const data = new FormData()
      Object.entries(form).forEach(([k, v]) => {
        if (v !== '') data.append(k, v)
      })
      data.append('total', total)
      if (file) data.append('pdf', file)

      const res = await fetch('/api/awbs', {
        method: 'POST',
        headers: { 'x-access-token': token }, // no Content-Type: browser sets it
        body: data,
      })
      let payload = null
      try {
        payload = await res.json()
      } catch {
        /* not JSON */
      }
      if (!res.ok) {
        throw new Error(payload?.error || `Request failed (${res.status})`)
      }
      onCreated()
    } catch (err) {
      setError(err.message)
      setSubmitting(false)
    }
  }

  return (
    <main className="awbpage">
      <header className="awb-header">
        <div>
          <h1>New air waybill</h1>
          <span className="awb-sub">
            Fill in the shipment details and attach the PDF
          </span>
        </div>
        <button type="button" className="awb-back" onClick={onBack}>
          ← Back to waybills
        </button>
      </header>

      <form className="awb-form" onSubmit={handleSubmit}>
        <fieldset>
          <legend>Shipment</legend>
          <div className="awb-grid">
            <label>
              AWB number
              <input
                type="text"
                value={form.awb_no}
                onChange={(e) => set('awb_no', e.target.value)}
                placeholder="583-10023549"
                required
              />
            </label>
            <label>
              Consignee
              <input
                type="text"
                value={form.consignee}
                onChange={(e) => set('consignee', e.target.value)}
                placeholder="Company GmbH"
                required
              />
            </label>
            <label>
              Airport
              <input
                type="text"
                value={form.airport}
                onChange={(e) => set('airport', e.target.value)}
                placeholder="FRA"
                required
              />
            </label>
            <label>
              Flight date
              <input
                type="date"
                value={form.flight_date}
                onChange={(e) => set('flight_date', e.target.value)}
                required
              />
            </label>
            <label>
              Currency
              <input
                type="text"
                value={form.currency}
                onChange={(e) => set('currency', e.target.value)}
                list="awb-currencies"
                required
              />
              <datalist id="awb-currencies">
                <option value="USD" />
                <option value="EUR" />
                <option value="GBP" />
                <option value="ZMW" />
                <option value="ZAR" />
              </datalist>
            </label>
          </div>
        </fieldset>

        <fieldset>
          <legend>Weights &amp; charges</legend>
          <div className="awb-grid">
            <label>
              Gross weight (kg)
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.gross_weight}
                onChange={(e) => set('gross_weight', e.target.value)}
                required
              />
            </label>
            <label>
              Chargeable weight (kg)
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.chargeable_weight}
                onChange={(e) => set('chargeable_weight', e.target.value)}
                required
              />
            </label>
            <label>
              Rate (per kg)
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.rate}
                onChange={(e) => set('rate', e.target.value)}
                required
              />
            </label>
            <label>
              Pieces
              <input
                type="number"
                min="0"
                step="1"
                value={form.nog}
                onChange={(e) => set('nog', e.target.value)}
                required
              />
            </label>
            <label>
              Goods description
              <input
                type="text"
                value={form.nops}
                onChange={(e) => set('nops', e.target.value)}
                placeholder="cartons, machinery parts"
                required
              />
            </label>
          </div>
          <p className="awb-total">
            Total (chargeable × rate):{' '}
            <strong>{total ? `${total} ${form.currency}` : '—'}</strong>
          </p>
        </fieldset>

        <fieldset>
          <legend>Billing</legend>
          <div className="awb-grid">
            <label>
              Total prepaid
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.total_prepaid}
                onChange={(e) => set('total_prepaid', e.target.value)}
                placeholder={total || '0.00'}
              />
              <span className="awb-hint">Leave empty to use the total</span>
            </label>
            <label>
              Total collect
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.total_collect}
                onChange={(e) => set('total_collect', e.target.value)}
              />
            </label>
            <label>
              CCCDC
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.cccdc}
                onChange={(e) => set('cccdc', e.target.value)}
              />
            </label>
          </div>
        </fieldset>

        <fieldset>
          <legend>Contact &amp; validity</legend>
          <div className="awb-grid">
            <label>
              Contact
              <input
                type="text"
                value={form.contact}
                onChange={(e) => set('contact', e.target.value)}
                placeholder="ops@company.com"
                required
              />
            </label>
            <label>
              Expiry date
              <input
                type="date"
                value={form.expiry_date}
                onChange={(e) => set('expiry_date', e.target.value)}
                required
              />
            </label>
          </div>
        </fieldset>

        <fieldset>
          <legend>Document</legend>
          <label
            className="awb-file"
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
          >
            <input type="file" accept="application/pdf" onChange={handleFilePick} />
            {file ? (
              <span>
                <strong>{file.name}</strong> (
                {(file.size / 1024 / 1024).toFixed(2)} MB)
              </span>
            ) : (
              <span>Click to choose a PDF, or drag it here — optional, max {MAX_PDF_MB} MB</span>
            )}
          </label>
          {fileError && <p className="awb-error">{fileError}</p>}
        </fieldset>

        {error && (
          <p className="awb-error" role="alert">
            {error}
          </p>
        )}

        <div className="awb-actions">
          <button type="button" className="awb-cancel" onClick={onBack}>
            Cancel
          </button>
          <button type="submit" className="awb-submit" disabled={submitting}>
            {submitting ? 'Saving…' : 'Create air waybill'}
          </button>
        </div>
      </form>
    </main>
  )
}

export default NewAirWayBill
