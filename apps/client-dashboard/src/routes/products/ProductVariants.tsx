import { useEffect, useState } from "react"
import { errorMessage, sdk } from "../../lib/medusa"
import type { Product, ProductVariant } from "../../lib/medusa"
import { Dropdown } from "../../lib/ui/Dropdown"
import "../../lib/ui/product-editor.css"

type VariantForm = { title: string; sku: string; barcode: string; hs_code: string; weight: string; manage_inventory: boolean; allow_backorder: boolean; prices: { id?: string; currency_code: string; amount: string; min_quantity?: number | null; max_quantity?: number | null }[] }
const toForm = (variant: ProductVariant): VariantForm => ({ title: variant.title, sku: variant.sku || "", barcode: variant.barcode || "", hs_code: variant.hs_code || "", weight: variant.weight == null ? "" : String(variant.weight), manage_inventory: variant.manage_inventory ?? true, allow_backorder: variant.allow_backorder ?? false, prices: (variant.prices || []).filter(price => !price.price_list_id).map(price => ({ id: price.id, currency_code: price.currency_code, amount: String(price.amount), min_quantity: price.min_quantity, max_quantity: price.max_quantity })) })

export function ProductVariants({ product, canWrite, canWriteInventory, demo, onDirtyChange, onProductChange }: { product: Product; canWrite: boolean; canWriteInventory: boolean; demo: boolean; onDirtyChange: (dirty: boolean) => void; onProductChange: (product: Product) => void }) {
  const [editing, setEditing] = useState<ProductVariant | null>(null)
  const [form, setForm] = useState<VariantForm | null>(null)
  const [optionTitle, setOptionTitle] = useState("")
  const [optionValues, setOptionValues] = useState("")
  const [newTitle, setNewTitle] = useState("")
  const [newSku, setNewSku] = useState("")
  const [newCurrency, setNewCurrency] = useState("inr")
  const [newPrice, setNewPrice] = useState("")
  const [extraCurrency, setExtraCurrency] = useState("")
  const [extraAmount, setExtraAmount] = useState("")
  const [choices, setChoices] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const editChanged = Boolean(editing && form && JSON.stringify(form) !== JSON.stringify(toForm(editing)))
  const changed = Boolean(editChanged || extraCurrency || extraAmount || optionTitle || optionValues || newTitle || newSku || newPrice || Object.keys(choices).length)
  useEffect(() => { onDirtyChange(changed); return () => onDirtyChange(false) }, [changed, onDirtyChange])
  const complexPrices = Boolean(editing?.prices?.some(price => !price.price_list_id && ((price.price_rules?.length || 0) > 0 || price.min_quantity != null || price.max_quantity != null)))
  async function saveVariant() {
    if (!editing || !form || busy || !canWrite || demo) return
    if (!form.title.trim()) { setError("Enter a variant title."); return }
    if (form.weight && (!Number.isFinite(Number(form.weight)) || Number(form.weight) < 0)) { setError("Enter a valid weight."); return }
    if (form.prices.some(price => price.amount === "" || !Number.isFinite(Number(price.amount)) || Number(price.amount) < 0)) { setError("Enter a valid amount for each price."); return }
    const original = toForm(editing)
    const pricesChanged = JSON.stringify(form.prices) !== JSON.stringify(original.prices)
    if (pricesChanged && complexPrices) { setError("Conditional prices cannot be edited here yet."); return }
    setBusy(true); setError("")
    try {
      const result = await sdk.admin.product.updateVariant(product.id, editing.id, { title: form.title.trim(), sku: form.sku || null, barcode: form.barcode || null, hs_code: form.hs_code || null, weight: form.weight === "" ? null : Number(form.weight), ...(form.manage_inventory !== original.manage_inventory ? { manage_inventory: form.manage_inventory } : {}), ...(form.allow_backorder !== original.allow_backorder ? { allow_backorder: form.allow_backorder } : {}), ...(pricesChanged ? { prices: form.prices.map(price => ({ ...price, amount: Number(price.amount) })) } : {}) })
      onProductChange(result.product as Product); setEditing(null); setForm(null); setExtraCurrency(""); setExtraAmount("")
    } catch (failure) { setError(errorMessage(failure)) } finally { setBusy(false) }
  }
  function addPrice() {
    if (!form || complexPrices) return
    if (!/^[a-z]{3}$/.test(extraCurrency) || extraAmount === "" || !Number.isFinite(Number(extraAmount)) || Number(extraAmount) < 0 || form.prices.some(price => price.currency_code.toLowerCase() === extraCurrency)) { setError("Enter a unique three-letter currency and a valid amount."); return }
    setForm({ ...form, prices: [...form.prices, { currency_code: extraCurrency, amount: extraAmount }] }); setExtraCurrency(""); setExtraAmount(""); setError("")
  }
  async function addOption() {
    const values = optionValues.split(",").map(value => value.trim()).filter(Boolean)
    if (!optionTitle.trim() || !values.length || new Set(values).size !== values.length) { setError("Enter an option name and distinct comma-separated values."); return }
    setBusy(true); setError("")
    try {
      const result = await sdk.client.fetch<{ product: Product }>(`/admin/products/${product.id}/options/batch`, { method: "POST", body: { add: [{ title: optionTitle.trim(), values }] } })
      onProductChange(result.product); setOptionTitle(""); setOptionValues("")
    } catch (failure) { setError(errorMessage(failure)) } finally { setBusy(false) }
  }
  async function addVariant() {
    if (!newTitle.trim() || !/^[a-z]{3}$/.test(newCurrency) || newPrice === "" || !Number.isFinite(Number(newPrice)) || Number(newPrice) < 0 || (product.options || []).some(option => !choices[option.title])) { setError("Enter a title, three-letter currency, price and each option value."); return }
    setBusy(true); setError("")
    try {
      const result = await sdk.admin.product.createVariant(product.id, { title: newTitle.trim(), sku: newSku || null, options: choices, prices: [{ currency_code: newCurrency, amount: Number(newPrice) }] })
      onProductChange(result.product as Product); setNewTitle(""); setNewSku(""); setNewPrice(""); setChoices({})
    } catch (failure) { setError(errorMessage(failure)) } finally { setBusy(false) }
  }
  const disabled = !canWrite || demo || busy
  return <section className="panel form-panel product-variants"><div className="product-section-heading"><div><h2>Options &amp; variants</h2><p>Variant and option changes are saved separately from product details.</p></div></div>
    {error && <div className="login-error" role="alert">{error}</div>}
    {(product.variants || []).length ? <div className="variant-list">{product.variants!.map(variant => <div className="variant-row" key={variant.id}><div><strong>{variant.title}</strong><small>{variant.sku || "No SKU"}</small><small>{variant.prices?.filter(price => !price.price_list_id).map(price => `${price.currency_code.toUpperCase()} ${price.amount}`).join(" · ") || "No base prices"}</small></div><button type="button" className="button" disabled={disabled || Boolean(editing && changed)} onClick={() => { setEditing(variant); setForm(toForm(variant)); setError("") }}>Edit {variant.title}</button></div>)}</div> : <p className="product-media-empty">No variants yet. Add an option and create a variant below.</p>}
    {editing && form && <div className="variant-editor"><h3>Edit {editing.title}</h3><div className="variant-fields"><label>Variant title<input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} disabled={disabled} /></label><label>SKU<input value={form.sku} onChange={e => setForm({ ...form, sku: e.target.value })} disabled={disabled} /></label><label>Barcode<input value={form.barcode} onChange={e => setForm({ ...form, barcode: e.target.value })} disabled={disabled} /></label><label>HSN code<input value={form.hs_code} onChange={e => setForm({ ...form, hs_code: e.target.value })} disabled={disabled} /></label><label>Weight (g)<input type="number" min="0" value={form.weight} onChange={e => setForm({ ...form, weight: e.target.value })} disabled={disabled} /></label></div><label className="variant-check"><input type="checkbox" checked={form.manage_inventory} disabled={disabled || !canWriteInventory} onChange={e => setForm({ ...form, manage_inventory: e.target.checked })} /> Track inventory</label><label className="variant-check"><input type="checkbox" checked={form.allow_backorder} disabled={disabled || !canWriteInventory} onChange={e => setForm({ ...form, allow_backorder: e.target.checked })} /> Allow backorders</label>
      <h4>Base prices</h4>{complexPrices && <p>Conditional prices are shown but cannot be edited here.</p>}{form.prices.map((price, index) => <label key={price.id || index}>{price.currency_code.toUpperCase()} amount<input aria-label={`${price.currency_code.toUpperCase()} price for ${editing.title}`} type="number" min="0" step="0.01" value={price.amount} disabled={disabled || complexPrices} onChange={e => setForm({ ...form, prices: form.prices.map((item, i) => i === index ? { ...item, amount: e.target.value } : item) })} /></label>)}{!form.prices.length && <p>No base prices are configured for this variant.</p>}
      {!complexPrices && <div className="variant-fields"><label>Additional currency<input maxLength={3} value={extraCurrency} onChange={e => setExtraCurrency(e.target.value.toLowerCase())} disabled={disabled} placeholder="inr" /></label><label>Additional amount<input type="number" min="0" step="0.01" value={extraAmount} onChange={e => setExtraAmount(e.target.value)} disabled={disabled} /></label><button type="button" className="button" onClick={addPrice} disabled={disabled}>Add price</button></div>}
      <div className="variant-actions"><button type="button" className="button" onClick={() => { setEditing(null); setForm(null); setExtraCurrency(""); setExtraAmount(""); setError("") }} disabled={busy}>Cancel</button><button type="button" className="button primary" onClick={saveVariant} disabled={disabled || !editChanged || Boolean(extraCurrency || extraAmount)}>Save variant</button></div></div>}
    {canWrite && <details className="variant-add"><summary>Add option</summary><p>Options describe choices such as size or colour. Up to three options are supported here.</p><div className="variant-fields"><label>Option name<input value={optionTitle} onChange={e => setOptionTitle(e.target.value)} disabled={disabled} placeholder="Size" /></label><label>Values, separated by commas<input value={optionValues} onChange={e => setOptionValues(e.target.value)} disabled={disabled} placeholder="S, M, L" /></label></div><button type="button" className="button" onClick={addOption} disabled={disabled || (product.options || []).length >= 3}>Save option</button></details>}
    {canWrite && <details className="variant-add"><summary>Add variant</summary>{!canWriteInventory && <p>Creating variants requires inventory write access.</p>}<div className="variant-fields"><label>New variant title<input value={newTitle} onChange={e => setNewTitle(e.target.value)} disabled={disabled || !canWriteInventory} /></label><label>New variant SKU<input value={newSku} onChange={e => setNewSku(e.target.value)} disabled={disabled || !canWriteInventory} /></label><label>Currency code<input value={newCurrency} maxLength={3} onChange={e => setNewCurrency(e.target.value.toLowerCase())} disabled={disabled || !canWriteInventory} /></label><label>Base price<input type="number" min="0" step="0.01" value={newPrice} onChange={e => setNewPrice(e.target.value)} disabled={disabled || !canWriteInventory} /></label>{(product.options || []).map(option => <label key={option.id}>{option.title}<Dropdown label={`${option.title} value`} value={choices[option.title] || ""} placeholder={`Select ${option.title}`} disabled={disabled || !canWriteInventory} onValueChange={value => setChoices({ ...choices, [option.title]: value })} options={(option.values || []).map(value => ({ value: value.value, label: value.value }))} /></label>)}</div><button type="button" className="button" onClick={addVariant} disabled={disabled || !canWriteInventory}>Create variant</button></details>}
  </section>
}
