import { useCallback, useEffect, useState } from "react"
import { api, errorMessage, sdk } from "../medusa"
import { Dropdown } from "./Dropdown"
import "./product-editor.css"

type Level = { id: string; location_id: string; stocked_quantity: number; reserved_quantity: number; available_quantity?: number; stock_locations?: { name?: string } | null }
type InventoryProduct = { variants?: { id: string; title: string; inventory_items?: { inventory_item_id: string; inventory?: { location_levels?: Level[] } | null }[] }[] }
type Row = { key: string; variant: string; itemId: string; level: Level }
type Item = { id: string; variant: string; locationIds: string[] }

export function ProductInventory({ productId, canRead, canWrite, demo, onDirtyChange }: { productId: string; canRead: boolean; canWrite: boolean; demo: boolean; onDirtyChange: (dirty: boolean) => void }) {
  const [rows, setRows] = useState<Row[]>([])
  const [items, setItems] = useState<Item[]>([])
  const [locations, setLocations] = useState<{ id: string; name: string }[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [editing, setEditing] = useState<Row | null>(null)
  const [quantity, setQuantity] = useState("")
  const [busy, setBusy] = useState(false)
  const [addItem, setAddItem] = useState("")
  const [addLocation, setAddLocation] = useState("")
  const [addQuantity, setAddQuantity] = useState("")
  const load = useCallback(async () => {
    setLoading(true); setError("")
    try {
      const [result, stock] = await Promise.all([api<{ product: InventoryProduct }>(`/admin/products/${productId}`, { fields: "+variants.inventory_items.inventory_item_id,+variants.inventory_items.inventory.location_levels.*,+variants.inventory_items.inventory.location_levels.stock_locations.name" }), api<{ stock_locations: { id: string; name: string }[] }>("/admin/stock-locations", { limit: 100 })])
      setRows((result.product.variants || []).flatMap(variant => (variant.inventory_items || []).flatMap(item => (item.inventory?.location_levels || []).map(level => ({ key: `${item.inventory_item_id}:${level.location_id}`, variant: variant.title, itemId: item.inventory_item_id, level })))))
      setItems((result.product.variants || []).flatMap(variant => (variant.inventory_items || []).map(item => ({ id: item.inventory_item_id, variant: variant.title, locationIds: (item.inventory?.location_levels || []).map(level => level.location_id) }))))
      setLocations(stock.stock_locations)
    } catch (failure) { setError(errorMessage(failure)) } finally { setLoading(false) }
  }, [productId])
  useEffect(() => { if (canRead && !demo) void load() }, [canRead, demo, load])
  const dirty = Boolean((editing && quantity !== String(editing.level.stocked_quantity)) || addItem || addLocation || addQuantity)
  useEffect(() => { onDirtyChange(dirty); return () => onDirtyChange(false) }, [dirty, onDirtyChange])
  async function save() {
    if (!editing || busy || !canWrite) return
    const value = Number(quantity)
    if (!quantity.trim() || !Number.isSafeInteger(value) || value < 0) { setError("Enter a non-negative whole number."); return }
    setBusy(true); setError("")
    try {
      await sdk.admin.inventoryItem.updateLevel(editing.itemId, editing.level.location_id, { stocked_quantity: value })
      setEditing(null); setQuantity(""); await load()
    } catch (failure) { setError(errorMessage(failure)) } finally { setBusy(false) }
  }
  async function createLevel() {
    const value = Number(addQuantity)
    if (!addItem || !addLocation || !addQuantity.trim() || !Number.isSafeInteger(value) || value < 0) { setError("Choose a variant and location, then enter a non-negative whole number."); return }
    setBusy(true); setError("")
    try {
      await sdk.client.fetch(`/admin/inventory-items/${addItem}/location-levels`, { method: "POST", body: { location_id: addLocation, stocked_quantity: value } })
      setAddItem(""); setAddLocation(""); setAddQuantity(""); await load()
    } catch (failure) { setError(errorMessage(failure)) } finally { setBusy(false) }
  }
  if (!canRead) return <section className="panel form-panel"><h2>Inventory</h2><p>You don't have permission to view inventory.</p></section>
  const locationName = (level: Level) => level.stock_locations?.name || locations.find(location => location.id === level.location_id)?.name || `Location ${level.location_id}`
  return <section className="panel form-panel"><div className="product-section-heading"><div><h2>Inventory</h2><p>Stocked and reserved quantities by variant and location.</p></div>{!demo && <button type="button" className="button" onClick={() => void load()} disabled={loading || busy || Boolean(editing)}>Refresh</button>}</div>
    {error && <div className="login-error" role="alert">{error}</div>}
    {demo ? <p className="product-media-empty">Inventory is unavailable in preview mode.</p> : loading ? <p className="product-media-empty">Loading inventory…</p> : rows.length ? <div className="variant-list">{rows.map(row => <div className="variant-row" key={row.key}><div><strong>{row.variant}</strong><small>{locationName(row.level)}</small><small>{row.level.stocked_quantity} stocked · {row.level.reserved_quantity} reserved</small></div>{canWrite && <button type="button" className="button" disabled={busy || Boolean(editing)} onClick={() => { setEditing(row); setQuantity(String(row.level.stocked_quantity)); setError("") }}>Edit stock</button>}</div>)}</div> : <p className="product-media-empty">No inventory levels found for this product. A stock location and inventory level are needed first.</p>}
    {editing && <div className="variant-editor"><h3>Set stock for {editing.variant}</h3><p>Location: {locationName(editing.level)}</p><label>Stocked quantity<input aria-label={`Stocked quantity for ${editing.variant}`} type="number" min="0" step="1" value={quantity} onChange={e => setQuantity(e.target.value)} disabled={busy} /></label><p className="field-help">This sets the stocked quantity for this location; reserved stock is managed separately.</p><div className="variant-actions"><button type="button" className="button" disabled={busy} onClick={() => { setEditing(null); setQuantity(""); setError("") }}>Cancel</button><button type="button" className="button primary" disabled={busy || !dirty} onClick={save}>{busy ? "Saving…" : "Save stock"}</button></div></div>}
    {canWrite && !demo && !loading && items.length > 0 && <details className="variant-add"><summary>Add inventory at a location</summary><div className="variant-fields"><label>Variant<Dropdown label="Inventory variant" value={addItem} onValueChange={value => { setAddItem(value); setAddLocation("") }} placeholder="Select variant" options={items.map(item => ({ value: item.id, label: item.variant }))} disabled={busy || Boolean(editing)} /></label><label>Stock location<Dropdown label="Stock location" value={addLocation} onValueChange={setAddLocation} placeholder="Select location" options={locations.filter(location => !items.find(item => item.id === addItem)?.locationIds.includes(location.id)).map(location => ({ value: location.id, label: location.name }))} disabled={busy || !addItem || Boolean(editing)} /></label><label>Starting quantity<input type="number" min="0" step="1" value={addQuantity} onChange={e => setAddQuantity(e.target.value)} disabled={busy || Boolean(editing)} /></label></div><button type="button" className="button" disabled={busy || Boolean(editing)} onClick={createLevel}>Add stock</button></details>}
  </section>
}
