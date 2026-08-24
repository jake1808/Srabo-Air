import { useMemo, useState } from 'react'
import { reportUnauthorized } from './api'
import './NewAirWayBill.css'

const MAX_PDF_MB = 16

// ISO 4217 active currencies
const CURRENCIES = [
  ['AED', 'UAE Dirham'],
  ['AFN', 'Afghani'],
  ['ALL', 'Lek'],
  ['AMD', 'Armenian Dram'],
  ['ANG', 'Netherlands Antillean Guilder'],
  ['AOA', 'Kwanza'],
  ['ARS', 'Argentine Peso'],
  ['AUD', 'Australian Dollar'],
  ['AWG', 'Aruban Florin'],
  ['AZN', 'Azerbaijan Manat'],
  ['BAM', 'Convertible Mark'],
  ['BBD', 'Barbados Dollar'],
  ['BDT', 'Taka'],
  ['BGN', 'Bulgarian Lev'],
  ['BHD', 'Bahraini Dinar'],
  ['BIF', 'Burundi Franc'],
  ['BMD', 'Bermudian Dollar'],
  ['BND', 'Brunei Dollar'],
  ['BOB', 'Boliviano'],
  ['BRL', 'Brazilian Real'],
  ['BSD', 'Bahamian Dollar'],
  ['BTN', 'Ngultrum'],
  ['BWP', 'Pula'],
  ['BYN', 'Belarusian Ruble'],
  ['BZD', 'Belize Dollar'],
  ['CAD', 'Canadian Dollar'],
  ['CDF', 'Congolese Franc'],
  ['CHF', 'Swiss Franc'],
  ['CLP', 'Chilean Peso'],
  ['CNY', 'Yuan Renminbi'],
  ['COP', 'Colombian Peso'],
  ['CRC', 'Costa Rican Colón'],
  ['CUP', 'Cuban Peso'],
  ['CVE', 'Escudo Caboverdiano'],
  ['CZK', 'Czech Koruna'],
  ['DJF', 'Djibouti Franc'],
  ['DKK', 'Danish Krone'],
  ['DOP', 'Dominican Peso'],
  ['DZD', 'Algerian Dinar'],
  ['EGP', 'Egyptian Pound'],
  ['ERN', 'Nakfa'],
  ['ETB', 'Ethiopian Birr'],
  ['EUR', 'Euro'],
  ['FJD', 'Fiji Dollar'],
  ['FKP', 'Falkland Islands Pound'],
  ['GBP', 'Pound Sterling'],
  ['GEL', 'Lari'],
  ['GHS', 'Ghanaian Cedi'],
  ['GIP', 'Gibraltar Pound'],
  ['GMD', 'Dalasi'],
  ['GNF', 'Guinean Franc'],
  ['GTQ', 'Quetzal'],
  ['GYD', 'Guyana Dollar'],
  ['HKD', 'Hong Kong Dollar'],
  ['HNL', 'Lempira'],
  ['HTG', 'Gourde'],
  ['HUF', 'Forint'],
  ['IDR', 'Rupiah'],
  ['ILS', 'New Israeli Sheqel'],
  ['INR', 'Indian Rupee'],
  ['IQD', 'Iraqi Dinar'],
  ['IRR', 'Iranian Rial'],
  ['ISK', 'Iceland Króna'],
  ['JMD', 'Jamaican Dollar'],
  ['JOD', 'Jordanian Dinar'],
  ['JPY', 'Yen'],
  ['KES', 'Kenyan Shilling'],
  ['KGS', 'Som'],
  ['KHR', 'Riel'],
  ['KMF', 'Comorian Franc'],
  ['KPW', 'North Korean Won'],
  ['KRW', 'Won'],
  ['KWD', 'Kuwaiti Dinar'],
  ['KYD', 'Cayman Islands Dollar'],
  ['KZT', 'Tenge'],
  ['LAK', 'Lao Kip'],
  ['LBP', 'Lebanese Pound'],
  ['LKR', 'Sri Lanka Rupee'],
  ['LRD', 'Liberian Dollar'],
  ['LSL', 'Loti'],
  ['LYD', 'Libyan Dinar'],
  ['MAD', 'Moroccan Dirham'],
  ['MDL', 'Moldovan Leu'],
  ['MGA', 'Malagasy Ariary'],
  ['MKD', 'Denar'],
  ['MMK', 'Kyat'],
  ['MNT', 'Tugrik'],
  ['MOP', 'Pataca'],
  ['MRU', 'Ouguiya'],
  ['MUR', 'Mauritius Rupee'],
  ['MVR', 'Rufiyaa'],
  ['MWK', 'Malawi Kwacha'],
  ['MXN', 'Mexican Peso'],
  ['MYR', 'Malaysian Ringgit'],
  ['MZN', 'Mozambique Metical'],
  ['NAD', 'Namibia Dollar'],
  ['NGN', 'Naira'],
  ['NIO', 'Córdoba Oro'],
  ['NOK', 'Norwegian Krone'],
  ['NPR', 'Nepalese Rupee'],
  ['NZD', 'New Zealand Dollar'],
  ['OMR', 'Rial Omani'],
  ['PAB', 'Balboa'],
  ['PEN', 'Sol'],
  ['PGK', 'Kina'],
  ['PHP', 'Philippine Peso'],
  ['PKR', 'Pakistan Rupee'],
  ['PLN', 'Złoty'],
  ['PYG', 'Guaraní'],
  ['QAR', 'Qatari Rial'],
  ['RON', 'Romanian Leu'],
  ['RSD', 'Serbian Dinar'],
  ['RUB', 'Russian Ruble'],
  ['RWF', 'Rwanda Franc'],
  ['SAR', 'Saudi Riyal'],
  ['SBD', 'Solomon Islands Dollar'],
  ['SCR', 'Seychelles Rupee'],
  ['SDG', 'Sudanese Pound'],
  ['SEK', 'Swedish Krona'],
  ['SGD', 'Singapore Dollar'],
  ['SHP', 'Saint Helena Pound'],
  ['SLE', 'Leone'],
  ['SOS', 'Somali Shilling'],
  ['SRD', 'Surinam Dollar'],
  ['SSP', 'South Sudanese Pound'],
  ['STN', 'Dobra'],
  ['SVC', 'El Salvador Colón'],
  ['SYP', 'Syrian Pound'],
  ['SZL', 'Lilangeni'],
  ['THB', 'Baht'],
  ['TJS', 'Somoni'],
  ['TMT', 'Turkmenistan New Manat'],
  ['TND', 'Tunisian Dinar'],
  ['TOP', 'Pa’anga'],
  ['TRY', 'Turkish Lira'],
  ['TTD', 'Trinidad and Tobago Dollar'],
  ['TWD', 'New Taiwan Dollar'],
  ['TZS', 'Tanzanian Shilling'],
  ['UAH', 'Hryvnia'],
  ['UGX', 'Uganda Shilling'],
  ['USD', 'US Dollar'],
  ['UYU', 'Peso Uruguayo'],
  ['UZS', 'Uzbekistan Sum'],
  ['VES', 'Bolívar Soberano'],
  ['VND', 'Dong'],
  ['VUV', 'Vatu'],
  ['WST', 'Tala'],
  ['XAF', 'CFA Franc BEAC'],
  ['XCD', 'East Caribbean Dollar'],
  ['XOF', 'CFA Franc BCEAO'],
  ['XPF', 'CFP Franc'],
  ['YER', 'Yemeni Rial'],
  ['ZAR', 'Rand'],
  ['ZMW', 'Zambian Kwacha'],
  ['ZWL', 'Zimbabwe Dollar'],
]

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
  const [created, setCreated] = useState(null)

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

      const res = await fetch('/api/create_awb', {
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
        if (res.status === 401) reportUnauthorized()
        throw new Error(
          payload?.error || payload?.message || `Request failed (${res.status})`
        )
      }
      setCreated(payload?.awb?.awb_no ?? form.awb_no)
      setSubmitting(false)
    } catch (err) {
      setError(err.message)
      setSubmitting(false)
    }
  }

  function handleCreateAnother() {
    setForm(INITIAL)
    setFile(null)
    setFileError('')
    setError('')
    setCreated(null)
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
        <button
          type="button"
          className="awb-back"
          onClick={() => (created ? onCreated() : onBack())}
        >
          ← Back to waybills
        </button>
      </header>

      {created ? (
        <section className="awb-success">
          <div className="awb-success-icon" aria-hidden="true">
            ✓
          </div>
          <h2>Air waybill created</h2>
          <p>
            <strong>{created}</strong> was saved successfully.
          </p>
          <div className="awb-actions awb-success-actions">
            <button type="button" className="awb-cancel" onClick={handleCreateAnother}>
              + Create another
            </button>
            <button type="button" className="awb-submit" onClick={onCreated}>
              Back to dashboard
            </button>
          </div>
        </section>
      ) : (
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
              <select
                value={form.currency}
                onChange={(e) => set('currency', e.target.value)}
                required
              >
                {CURRENCIES.map(([code, name]) => (
                  <option key={code} value={code}>
                    {code} — {name}
                  </option>
                ))}
              </select>
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
      )}
    </main>
  )
}

export default NewAirWayBill
