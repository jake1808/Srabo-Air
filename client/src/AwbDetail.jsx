import { useEffect, useState } from 'react'
import './AwbDetail.css'

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

function base64ToBlobUrl(b64) {
  const byteChars = atob(b64)
  const byteArray = new Uint8Array(byteChars.length)
  for (let i = 0; i < byteChars.length; i++) {
    byteArray[i] = byteChars.charCodeAt(i)
  }
  return URL.createObjectURL(new Blob([byteArray], { type: 'application/pdf' }))
}

function Field({ label, value, wide }) {
  return (
    <div className={`detail-field${wide ? ' wide' : ''}`}>
      <span className="detail-label">{label}</span>
      <span className="detail-value">{value ?? '—'}</span>
    </div>
  )
}

function AwbDetail({ awb, onBack }) {
  const [pdfUrl, setPdfUrl] = useState(null)
  const [pdfError, setPdfError] = useState('')

  const hasPdf = Boolean(awb?.pdf)

  useEffect(() => {
    return () => {
      if (pdfUrl) URL.revokeObjectURL(pdfUrl)
    }
  }, [pdfUrl])

  function toggleViewPdf() {
    setPdfError('')
    if (pdfUrl) {
      URL.revokeObjectURL(pdfUrl)
      setPdfUrl(null)
      return
    }
    try {
      setPdfUrl(base64ToBlobUrl(awb.pdf))
    } catch {
      setPdfError('Could not decode the stored PDF.')
    }
  }

  function downloadPdf() {
    setPdfError('')
    try {
      const url = pdfUrl || base64ToBlobUrl(awb.pdf)
      const a = document.createElement('a')
      a.href = url
      a.download = `${awb.awb_no}.pdf`
      document.body.appendChild(a)
      a.click()
      a.remove()
      if (url !== pdfUrl) setTimeout(() => URL.revokeObjectURL(url), 60000)
    } catch {
      setPdfError('Could not decode the stored PDF.')
    }
  }

  if (!awb) return null

  return (
    <main className="detail">
      <header className="detail-header">
        <div>
          <h1>{awb.awb_no}</h1>
          <span className="detail-sub">{awb.consignee}</span>
        </div>
        <button type="button" className="detail-back" onClick={onBack}>
          ← Back to waybills
        </button>
      </header>

      <div className="detail-body">
        <section className="detail-card">
          <h2>Shipment</h2>
          <div className="detail-grid">
            <Field label="AWB number" value={awb.awb_no} />
            <Field label="Consignee" value={awb.consignee} />
            <Field label="Airport" value={awb.airport} />
            <Field label="Flight date" value={formatDate(awb.flight_date)} />
            <Field label="Currency" value={awb.currency} />
          </div>
        </section>

        <section className="detail-card">
          <h2>Weights &amp; charges</h2>
          <div className="detail-grid">
            <Field label="Gross weight (kg)" value={awb.gross_weight} />
            <Field label="Chargeable weight (kg)" value={awb.chargeable_weight} />
            <Field label="Rate (per kg)" value={awb.rate} />
            <Field label="Pieces" value={awb.nog} />
            <Field label="Total" value={`${awb.total} ${awb.currency}`} />
            <Field label="Goods description" value={awb.nops} wide />
          </div>
        </section>

        <section className="detail-card">
          <h2>Billing</h2>
          <div className="detail-grid">
            <Field label="Total prepaid" value={awb.total_prepaid} />
            <Field label="Total collect" value={awb.total_collect} />
            <Field label="CCCDC" value={awb.cccdc} />
          </div>
        </section>

        <section className="detail-card">
          <h2>Contact &amp; validity</h2>
          <div className="detail-grid">
            <Field label="Contact" value={awb.contact} />
            <Field label="Expiry date" value={formatDate(awb.expiry_date)} />
          </div>
        </section>

        <section className="detail-card">
          <h2>Document</h2>
          {hasPdf ? (
            <div className="detail-pdf">
              <p className="detail-pdf-note">
                A PDF is attached to this air waybill.
              </p>
              <div className="detail-pdf-actions">
                <button
                  type="button"
                  className="detail-btn view"
                  onClick={toggleViewPdf}
                >
                  {pdfUrl ? 'Hide PDF' : 'View PDF'}
                </button>
                <button
                  type="button"
                  className="detail-btn download"
                  onClick={downloadPdf}
                >
                  Download PDF
                </button>
              </div>
              {pdfUrl && (
                <iframe
                  className="detail-pdf-frame"
                  src={pdfUrl}
                  title={`PDF for ${awb.awb_no}`}
                />
              )}
            </div>
          ) : (
            <p className="detail-pdf-none">
              No PDF is attached to this air waybill.
            </p>
          )}
          {pdfError && (
            <p className="detail-pdf-error" role="alert">
              {pdfError}
            </p>
          )}
        </section>
      </div>
    </main>
  )
}

export default AwbDetail
