import { useCallback, useEffect, useState } from "react"
import { Plus, Search } from "lucide-react"
import { api, errorMessage, sdk } from "../../lib/medusa"
import { Empty } from "../../lib/ui/Empty"
import { Pagination } from "../../lib/ui/Pagination"
import { SelectableTable } from "../../lib/ui/SelectableTable"
import { TableLoading } from "../../lib/ui/TableLoading"
import { PanelDialog } from "../../lib/ui/Dialog"
import { Button } from "../../lib/ui/button"
import { Input } from "../../lib/ui/input"
import "./collections.css"

type Collection = { id: string; title: string; handle: string }
type Product = { id: string; title: string; handle: string; collection_id?: string | null }

function CollectionDialog({ initial, canWrite, onClose, onChanged }: { initial: Collection | null; canWrite: boolean; onClose: () => void; onChanged: () => void }) {
  const [collection, setCollection] = useState(initial)
  const [title, setTitle] = useState(initial?.title || "")
  const [handle, setHandle] = useState(initial?.handle || "")
  const [assigned, setAssigned] = useState<Product[] | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [query, setQuery] = useState("")
  const [offset, setOffset] = useState(0)
  const [count, setCount] = useState(0)
  const [busy, setBusy] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const dirty = title !== (collection?.title || "") || handle !== (collection?.handle || "")
  const close = () => { if (!busy && (!dirty || window.confirm("Discard unsaved collection changes?"))) onClose() }
  const loadAssigned = useCallback(async () => {
    if (!collection) return
    const result = await api<{ collection: { products?: Product[] } }>(`/admin/collections/${collection.id}`, { fields: "+products.id,+products.title,+products.handle" })
    setAssigned(result.collection.products || [])
  }, [collection])
  useEffect(() => {
    if (!collection) return
    let active = true
    queueMicrotask(() => { if (active) setLoading(true) })
    Promise.all([api<{ collection: { products?: Product[] } }>(`/admin/collections/${collection.id}`, { fields: "+products.id,+products.title,+products.handle" }), api<{ products: Product[]; count: number }>("/admin/products", { limit: 20, offset, ...(query.trim() ? { q: query.trim() } : {}) })])
      .then(([one, list]) => { if (active) { setAssigned(one.collection.products || []); setProducts(list.products); setCount(list.count) } })
      .catch(failure => { if (active) setError(errorMessage(failure)) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [collection, offset, query])
  async function save(event: React.FormEvent) {
    event.preventDefault()
    if (!canWrite || busy || !title.trim()) return
    setBusy(true); setError("")
    try {
      const data = { title: title.trim(), ...(handle.trim() ? { handle: handle.trim() } : {}) }
      const result = collection ? await sdk.admin.productCollection.update(collection.id, data) : await sdk.admin.productCollection.create(data)
      setCollection(result.collection); setTitle(result.collection.title); setHandle(result.collection.handle); onChanged()
    } catch (failure) { setError(errorMessage(failure)) } finally { setBusy(false) }
  }
  async function changeProduct(product: Product, remove: boolean) {
    if (!collection || !canWrite || busy) return
    if (!remove && product.collection_id && product.collection_id !== collection.id && !window.confirm(`Move ${product.title} from its current collection to ${collection.title}?`)) return
    setBusy(true); setError("")
    try {
      await sdk.admin.productCollection.updateProducts(collection.id, remove ? { remove: [product.id] } : { add: [product.id] })
      await loadAssigned()
      setProducts(current => current.map(item => item.id === product.id ? { ...item, collection_id: remove ? null : collection.id } : item))
      onChanged()
    } catch (failure) { setError(errorMessage(failure)) } finally { setBusy(false) }
  }
  async function removeCollection() {
    if (!collection || !canWrite || busy || !window.confirm(`Delete “${collection.title}”? Its products will remain in your catalogue.`)) return
    setBusy(true); setError("")
    try { await sdk.admin.productCollection.delete(collection.id); onChanged(); onClose() } catch (failure) { setError(errorMessage(failure)); setBusy(false) }
  }
  return <PanelDialog className="collection-dialog" title={initial ? "Manage collection" : "Create collection"} description="Organise products for your store." onClose={close}>
    {error && <p className="login-error" role="alert">{error}</p>}
    <form className="collection-form" onSubmit={save}>
      <label>Collection name<Input aria-label="Collection name" value={title} maxLength={255} required disabled={!canWrite || busy} onChange={event => setTitle(event.target.value)} placeholder="e.g. Team jerseys" /></label>
      <label>URL handle<Input aria-label="URL handle" value={handle} pattern="[a-zA-Z0-9_-]*" required={Boolean(collection)} disabled={!canWrite || busy} onChange={event => setHandle(event.target.value)} placeholder="Generated automatically if left blank" /></label>
      <div className="collection-form-actions">{collection && canWrite && <Button type="button" variant="outline" className="button collection-delete" disabled={busy} onClick={removeCollection}>Delete collection</Button>}{canWrite && <Button type="submit" className="button primary" disabled={busy || !title.trim() || (Boolean(collection) && !dirty)}>{busy ? "Saving…" : collection ? "Save changes" : "Create collection"}</Button>}</div>
    </form>
    {collection && <section className="collection-products"><h3>Products in this collection</h3><p>Products can belong to one collection at a time.</p>
      {assigned === null ? <p>Loading products…</p> : assigned.length ? <ul className="collection-product-list">{assigned.map(product => <li key={product.id}><span><strong>{product.title}</strong><small>{product.handle}</small></span>{canWrite && <Button type="button" variant="outline" className="button" disabled={busy} onClick={() => changeProduct(product, true)}>Remove</Button>}</li>)}</ul> : <p>No products in this collection yet.</p>}
      {canWrite && <><div className="collection-search-heading"><h3>Add products</h3><p>Search the catalogue to add products to this collection.</p></div><label className="collection-search"><Search size={16} aria-hidden="true" /><Input aria-label="Search products to add" value={query} onChange={event => { setQuery(event.target.value); setOffset(0) }} placeholder="Search products" /></label>
        {loading ? <p>Loading products…</p> : <><ul className="collection-product-list">{products.map(product => { const included = assigned?.some(item => item.id === product.id); return <li key={product.id}><span><strong>{product.title}</strong><small>{product.handle}</small></span><Button type="button" variant="outline" className="button" disabled={busy || included} onClick={() => changeProduct(product, false)}>{included ? "Added" : "Add"}</Button></li> })}</ul>{!products.length && <p>No products found.</p>}<Pagination totalCount={count} offset={offset} pageSize={20} disabled={busy} onOffsetChange={setOffset} /></>}
      </>}
    </section>}
  </PanelDialog>
}

export function CollectionsPage({ demo, canWrite }: { demo: boolean; canWrite: boolean }) {
  const [collections, setCollections] = useState<Collection[]>([])
  const [selected, setSelected] = useState<Collection | "new" | null>(null)
  const [offset, setOffset] = useState(0)
  const [count, setCount] = useState(0)
  const [revision, setRevision] = useState(0)
  const [loading, setLoading] = useState(!demo)
  const [error, setError] = useState("")
  useEffect(() => {
    if (demo) return
    let active = true
    sdk.admin.productCollection.list({ limit: 25, offset }).then(result => { if (active) { setCollections(result.collections); setCount(result.count); setError("") } }).catch(failure => { if (active) setError(errorMessage(failure)) }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [demo, offset, revision])
  return <><section className="panel"><div className="panel-heading"><h2>Collections</h2>{!demo && canWrite && <Button type="button" className="button primary" onClick={() => setSelected("new")}><Plus size={15} /> Create collection</Button>}</div>
    {error && <p className="login-error" role="alert">{error}</p>}
    {loading ? <TableLoading /> : collections.length ? <><div className="table-scroll"><SelectableTable name="Collections"><table><thead><tr><th>Collection</th><th>Handle</th><th>Actions</th></tr></thead><tbody>{collections.map(collection => <tr key={collection.id}><td>{collection.title}</td><td>{collection.handle}</td><td><Button type="button" variant="outline" className="button" aria-label={`Manage collection ${collection.title}`} onClick={() => setSelected(collection)}>Manage</Button></td></tr>)}</tbody></table></SelectableTable></div><Pagination totalCount={count} offset={offset} onOffsetChange={setOffset} /></> : <Empty title="Bring your products together">{demo ? "Collections are unavailable in preview mode." : "Create a collection to organise your catalogue."}</Empty>}
  </section>{selected && <CollectionDialog key={selected === "new" ? "new" : selected.id} initial={selected === "new" ? null : selected} canWrite={canWrite} onClose={() => setSelected(null)} onChanged={() => { setOffset(0); setRevision(value => value + 1) }} />}</>
}
