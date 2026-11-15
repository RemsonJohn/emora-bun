import { useState } from "react"
import { Download, FileSpreadsheet, Upload } from "lucide-react"
import { api, errorMessage, sdk } from "../../lib/medusa"
import type { Product } from "../../lib/medusa"
import { PanelDialog } from "../../lib/ui/Dialog"
import { Button } from "../../lib/ui/button"
import "./product-transfer.css"

const csvCell = (value: unknown) => {
  let text = String(value ?? "")
  if (/^[\s]*[=+\-@\t\r]/.test(text)) text = `'${text}`
  return `"${text.replaceAll('"', '""')}"`
}
function downloadCsv(filename: string, csv: string) {
  const url = URL.createObjectURL(new Blob(["\ufeff", csv], { type: "text/csv;charset=utf-8" }))
  const link = document.createElement("a"); link.href = url; link.download = filename; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function ProductTransferDialog({ canImport, onClose, onImported }: { canImport: boolean; onClose: () => void; onImported: () => void }) {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<{ transaction_id: string; summary: { toCreate: number; toUpdate: number } } | null>(null)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")

  async function prepareImport() {
    if (!file || !canImport || busy) return
    if (!file.name.toLowerCase().endsWith(".csv")) { setError("Choose a CSV file."); return }
    setBusy(true); setError(""); setMessage("")
    try {
      const upload = new File([file], file.name, { type: file.type || "text/csv" })
      const result = await sdk.admin.product.createImport({ file: upload })
      setPreview(result)
    } catch (failure) { setError(errorMessage(failure)) } finally { setBusy(false) }
  }

  async function confirmImport() {
    if (!preview || !canImport || busy) return
    setBusy(true); setError("")
    try {
      await sdk.admin.product.confirmImport(preview.transaction_id)
      setPreview(null); setFile(null)
      setMessage("Import submitted for background processing. Submission does not confirm that every product was imported; refresh the product list later and check the results.")
      onImported()
    } catch (failure) { setError(errorMessage(failure)) } finally { setBusy(false) }
  }

  async function exportSummary() {
    if (busy) return
    setBusy(true); setError(""); setMessage("")
    try {
      const products: Product[] = []
      let offset = 0
      while (true) {
        const result = await api<{ products: Product[]; count: number }>("/admin/products", { limit: 100, offset })
        products.push(...result.products)
        offset += result.products.length
        if (!result.products.length || offset >= result.count) break
      }
      const rows = products.flatMap(product => (product.variants?.length ? product.variants : [null]).map(variant => [product.id, product.title, product.handle, product.status, variant?.id, variant?.title, variant?.sku]))
      const csv = [["Product ID", "Product", "Handle", "Status", "Variant ID", "Variant", "SKU"], ...rows].map(row => row.map(csvCell).join(",")).join("\r\n")
      downloadCsv("products-summary.csv", csv)
      setMessage(`Exported ${products.length} products as a summary.`)
    } catch (failure) { setError(errorMessage(failure)) } finally { setBusy(false) }
  }

  return <PanelDialog className="product-transfer-dialog" title="Import / export products" description="Move product information using CSV files." onClose={() => { if (!busy) onClose() }}>
    {error && <p className="login-error transfer-notice" role="alert">{error}</p>}
    {message && <p className="transfer-notice transfer-success" role="status">{message}</p>}
    <section className="transfer-section" aria-labelledby="transfer-import-title">
      <div className="transfer-section-heading">
        <div><h3 id="transfer-import-title">Import products</h3><p>Upload a product CSV and review the changes before importing.</p></div>
        <button type="button" className="button transfer-template" disabled={busy} onClick={() => downloadCsv("product-import-template.csv", "Product Handle,Product Title,Product Status,Variant Title,Variant Sku,Variant Option 1 Name,Variant Option 1 Value,Variant Price INR\r\n")}><Download size={15} aria-hidden="true" /> Download blank template</button>
      </div>
      {!canImport ? <p className="transfer-permission">Product and inventory edit permissions are required to import.</p> : <>
        <label className={`transfer-file${busy || preview ? " is-disabled" : ""}`}>
          <span className="transfer-file-icon"><FileSpreadsheet size={20} aria-hidden="true" /></span>
          <span className="transfer-file-copy"><strong>{file ? file.name : "Choose a CSV file"}</strong><span>{file ? "Ready to review" : "Use a Medusa-format product CSV"}</span></span>
          <span className="button transfer-file-button"><Upload size={15} aria-hidden="true" /> Browse</span>
          <input aria-label="Product CSV" type="file" accept=".csv,text/csv" disabled={busy || Boolean(preview)} onChange={event => { setFile(event.target.files?.[0] || null); setError(""); setMessage("") }} />
        </label>
        {!preview ? <div className="transfer-actions"><button type="button" className="button primary" disabled={!file || busy} onClick={prepareImport}>{busy ? "Preparing…" : "Review import"}</button></div> : <div className="transfer-preview"><p>Ready to create <strong>{preview.summary.toCreate}</strong> and update <strong>{preview.summary.toUpdate}</strong> products.</p><div className="transfer-actions"><button type="button" className="button" disabled={busy} onClick={() => setPreview(null)}>Choose another file</button><button type="button" className="button primary" disabled={busy} onClick={confirmImport}>{busy ? "Submitting…" : "Start import"}</button></div></div>}
      </>}
    </section>
    <section className="transfer-section transfer-export" aria-labelledby="transfer-export-title"><div><h3 id="transfer-export-title">Export product summary</h3><p>Download product and variant IDs, handles, status and SKUs. Prices and images are not included; this file cannot be imported.</p></div><Button type="button" variant="outline" className="button" disabled={busy} onClick={exportSummary}><Download size={15} aria-hidden="true" /> {busy ? "Working…" : "Download CSV"}</Button></section>
  </PanelDialog>
}
