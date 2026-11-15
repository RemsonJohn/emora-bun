import { useEffect, useState } from "react"
import type { FormEvent } from "react"
import { Plus } from "lucide-react"
import { api, errorMessage, sdk } from "../../lib/medusa"
import { Badge } from "../../lib/ui/Badge"
import { Empty } from "../../lib/ui/Empty"
import { TableLoading } from "../../lib/ui/TableLoading"
import { Pagination } from "../../lib/ui/Pagination"
import { SelectableTable } from "../../lib/ui/SelectableTable"
import { PanelDialog } from "../../lib/ui/Dialog"
import { Dropdown } from "../../lib/ui/Dropdown"
import { Button } from "../../lib/ui/button"
import { Input } from "../../lib/ui/input"
import "./discounts.css"

type Promotion = {
  id: string; code: string; status: string; type: string; is_automatic: boolean
  limit?: number | null; used?: number | null
  application_method?: { type?: string; value?: number; target_type?: string; currency_code?: string | null; target_rules?: unknown[]; buy_rules?: unknown[] } | null
  rules?: unknown[]; campaign?: { name?: string } | null
}
type DiscountKind = "percent" | "fixed" | "shipping"

function describe(promotion: Promotion) {
  const method = promotion.application_method
  if (!method) return "Details unavailable"
  if (promotion.type !== "standard" || method.target_rules?.length || method.buy_rules?.length || promotion.rules?.length) return "Custom promotion"
  if (method.target_type === "shipping_methods" && method.type === "percentage" && Number(method.value) === 100) return "Free shipping"
  if (method.target_type !== "order") return "Custom promotion"
  if (method.type === "percentage") return `${method.value}% off order`
  if (method.type === "fixed") return `${String(method.currency_code || "").toUpperCase()} ${method.value} off order`
  return "Custom promotion"
}

function DiscountDialog({ selected, canWrite, onClose, onChanged }: { selected: Promotion | null; canWrite: boolean; onClose: () => void; onChanged: () => void }) {
  const [promotion, setPromotion] = useState<Promotion | null>(selected)
  const [code, setCode] = useState(selected?.code || "")
  const [status, setStatus] = useState(selected?.status || "draft")
  const [method, setMethod] = useState("code")
  const [kind, setKind] = useState<DiscountKind>("percent")
  const [amount, setAmount] = useState("")
  const [limit, setLimit] = useState("")
  const [loading, setLoading] = useState(Boolean(selected))
  const [loadFailed, setLoadFailed] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  useEffect(() => {
    if (!selected) return
    let active = true
    api<{ promotion: Promotion }>(`/admin/promotions/${selected.id}`).then(({ promotion: value }) => { if (active) { setPromotion(value); setCode(value.code); setStatus(value.status); setAmount(value.application_method?.value == null ? "" : String(value.application_method.value)) } }).catch(failure => { if (active) { setError(errorMessage(failure)); setLoadFailed(true) } }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [selected])
  const appMethod = promotion?.application_method
  const canEditValue = Boolean(selected && promotion?.type === "standard" && !promotion.rules?.length && !promotion.campaign && appMethod?.target_type === "order" && !appMethod.target_rules?.length && !appMethod.buy_rules?.length && (appMethod.type === "percentage" || (appMethod.type === "fixed" && appMethod.currency_code === "inr")))
  const valueChanged = Boolean(canEditValue && amount !== String(appMethod?.value ?? ""))
  const dirty = selected ? code !== promotion?.code || status !== promotion?.status || valueChanged : Boolean(code || amount || limit || method !== "code" || kind !== "percent" || status !== "draft")
  const close = () => { if (!busy && (!dirty || window.confirm("Discard unsaved discount changes?"))) onClose() }
  async function save(event: FormEvent) {
    event.preventDefault()
    if (!canWrite || busy || loading || loadFailed || !code.trim()) return
    const value = Number(amount)
    const usage = Number(limit)
    if (!selected && kind !== "shipping" && (!amount.trim() || !Number.isFinite(value) || value <= 0 || (kind === "percent" && value > 100))) { setError(kind === "percent" ? "Enter a percentage greater than 0 and no more than 100." : "Enter an amount greater than 0."); return }
    if (selected && valueChanged && (!amount.trim() || !Number.isFinite(value) || value <= 0 || (appMethod?.type === "percentage" && value > 100))) { setError("Enter a valid discount value."); return }
    if (!selected && method === "code" && limit && (!Number.isSafeInteger(usage) || usage < 1)) { setError("Enter a whole-number usage limit of at least 1."); return }
    setBusy(true); setError("")
    try {
      if (selected) {
        await sdk.admin.promotion.update(selected.id, { code: code.trim(), status: status as "draft" | "active" | "inactive", ...(valueChanged ? { application_method: { value } } : {}) })
      } else {
        const application_method = kind === "shipping" ? { type: "percentage" as const, target_type: "shipping_methods" as const, allocation: "across" as const, value: 100 } : kind === "percent" ? { type: "percentage" as const, target_type: "order" as const, value } : { type: "fixed" as const, target_type: "order" as const, currency_code: "inr", value }
        await sdk.admin.promotion.create({ code: code.trim(), type: "standard", status: status as "draft" | "active" | "inactive", is_automatic: method === "automatic", application_method, ...(method === "code" && limit ? { limit: usage } : {}) })
      }
      onChanged(); onClose()
    } catch (failure) { setError(errorMessage(failure)) } finally { setBusy(false) }
  }
  async function remove() {
    if (!selected || !canWrite || busy || loadFailed || !window.confirm(`Delete discount “${selected.code}”? Customers will no longer be able to use it.`)) return
    setBusy(true); setError("")
    try { await sdk.admin.promotion.delete(selected.id); onChanged(); onClose() } catch (failure) { setError(errorMessage(failure)); setBusy(false) }
  }
  return <PanelDialog className="discount-dialog" title={selected ? "Manage discount" : "Create discount"} description={selected ? "Review and update this promotion." : "Create a standard promotion for your store."} onClose={close}>
    {error && <p className="login-error" role="alert">{error}</p>}
    {loading ? <p>Loading discount…</p> : <form className="discount-form" onSubmit={save}>
      <label>Discount code<Input aria-label="Discount code" value={code} onChange={event => setCode(event.target.value)} required disabled={!canWrite || busy || loadFailed} placeholder="e.g. WELCOME10" /></label>
      <label>Status<Dropdown label="Discount status" value={status} onValueChange={setStatus} disabled={!canWrite || busy || loadFailed} options={[{ value: "draft", label: "Draft" }, { value: "active", label: "Active" }, { value: "inactive", label: "Inactive" }]} /></label>
      {selected && promotion ? <><div className="discount-summary"><strong>{describe(promotion)}</strong><p>{promotion.is_automatic ? "Automatic promotion" : "Discount code"}{promotion.limit ? ` · Limit ${promotion.limit} uses` : ""}{promotion.used != null ? ` · ${promotion.used} used` : ""}</p><p>Existing promotion rules and settings are preserved.{!canEditValue && " This promotion’s value cannot be edited here."}</p></div>{canEditValue && <label>{appMethod?.type === "percentage" ? "Percentage" : "Amount (₹)"}<Input aria-label={appMethod?.type === "percentage" ? "Percentage" : "Amount in INR"} type="number" min="0.01" max={appMethod?.type === "percentage" ? "100" : undefined} step="0.01" value={amount} required disabled={!canWrite || busy} onChange={event => setAmount(event.target.value)} /></label>}</> : !selected && <>
        <label>Method<Dropdown label="Discount method" value={method} onValueChange={value => { setMethod(value); if (value === "automatic") setLimit("") }} disabled={!canWrite || busy} options={[{ value: "code", label: "Discount code" }, { value: "automatic", label: "Automatic" }]} /></label>
        {method === "automatic" && <p className="discount-help">The code identifies this promotion internally; eligible customers do not need to enter it.</p>}
        <label>Discount type<Dropdown label="Discount type" value={kind} onValueChange={value => setKind(value as DiscountKind)} disabled={!canWrite || busy} options={[{ value: "percent", label: "Percentage off order" }, { value: "fixed", label: "Fixed amount off order (INR)" }, { value: "shipping", label: "Free shipping" }]} /></label>
        {kind !== "shipping" && <label>{kind === "percent" ? "Percentage" : "Amount (₹)"}<Input aria-label={kind === "percent" ? "Percentage" : "Amount in INR"} type="number" min="0.01" max={kind === "percent" ? "100" : undefined} step="0.01" value={amount} required disabled={!canWrite || busy} onChange={event => setAmount(event.target.value)} /></label>}
        {method === "code" && <label>Maximum uses <span className="discount-optional">(optional)</span><Input aria-label="Maximum uses" type="number" min="1" step="1" value={limit} disabled={!canWrite || busy} onChange={event => setLimit(event.target.value)} placeholder="No limit" /></label>}
        <p className="discount-help">This promotion applies to all eligible orders{kind === "shipping" ? "' shipping charges" : ""}. Product restrictions and schedules are not configured here. Keep it in draft until it is ready.</p>
      </>}
      <div className="discount-actions">{selected && canWrite && <Button type="button" variant="outline" className="button discount-delete" disabled={busy || loadFailed} onClick={remove}>Delete discount</Button>}{canWrite && <Button type="submit" className="button primary" disabled={busy || loadFailed || !code.trim() || (Boolean(selected) && !dirty)}>{busy ? "Saving…" : selected ? "Save changes" : "Create discount"}</Button>}</div>
    </form>}
  </PanelDialog>
}

export function DiscountsPage({ demo, canWrite }: { demo: boolean; canWrite: boolean }) {
  const [promotions, setPromotions] = useState<Promotion[]>([])
  const [selected, setSelected] = useState<Promotion | "new" | null>(null)
  const [offset, setOffset] = useState(0)
  const [count, setCount] = useState(0)
  const [revision, setRevision] = useState(0)
  const [loading, setLoading] = useState(!demo)
  const [error, setError] = useState("")
  useEffect(() => {
    if (demo) return
    let active = true
    api<{ promotions: Promotion[]; count: number }>("/admin/promotions", { limit: 25, offset }).then(result => { if (active) { setPromotions(result.promotions); setCount(result.count); setError("") } }).catch(failure => { if (active) setError(errorMessage(failure)) }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [demo, offset, revision])
  return <><section className="panel"><div className="panel-heading"><h2>Discounts</h2>{!demo && canWrite && <Button type="button" className="button primary" onClick={() => setSelected("new")}><Plus size={15} /> Create discount</Button>}</div>
    {error && <p className="login-error" role="alert">{error}</p>}
    {loading ? <TableLoading /> : promotions.length ? <><div className="table-scroll"><SelectableTable name="Discounts"><table><thead><tr><th>Code</th><th>Discount</th><th>Status</th><th>Method</th><th>Actions</th></tr></thead><tbody>{promotions.map(promotion => <tr key={promotion.id}><td>{promotion.code}</td><td>{describe(promotion)}</td><td><Badge value={promotion.status} /></td><td>{promotion.is_automatic ? "Automatic" : "Discount code"}</td><td><Button type="button" variant="outline" className="button" aria-label={`Manage discount ${promotion.code}`} onClick={() => setSelected(promotion)}>Manage</Button></td></tr>)}</tbody></table></SelectableTable></div><Pagination totalCount={count} offset={offset} onOffsetChange={setOffset} /></> : <Empty title="Your next promotion starts here">{demo ? "Discounts are unavailable in preview mode." : "Create a discount to give customers a reason to return."}</Empty>}
  </section>{selected && <DiscountDialog key={selected === "new" ? "new" : selected.id} selected={selected === "new" ? null : selected} canWrite={canWrite} onClose={() => setSelected(null)} onChanged={() => { setOffset(0); setRevision(value => value + 1) }} />}</>
}
