import { useRef, useState } from "react"
import { ArrowDown, ArrowUp, ImagePlus, Trash2 } from "lucide-react"
import { errorMessage, sdk } from "../../lib/medusa"
import "../../lib/ui/product-editor.css"

export type ProductImage = { id?: string; url: string }

export function ProductMedia({ images, thumbnail, onChange, onThumbnail, disabled, demo, onBusyChange }: {
  images: ProductImage[]
  thumbnail: string
  onChange: (images: ProductImage[]) => void
  onThumbnail: (url: string) => void
  disabled: boolean
  demo: boolean
  onBusyChange: (busy: boolean) => void
}) {
  const input = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState("")
  async function upload(files: File[]) {
    if (!files.length) return
    if (demo) { setError("Uploads are unavailable in preview mode."); return }
    if (images.length + files.length > 15) { setError("A product can have at most 15 images."); return }
    if (files.some(file => !file.type.startsWith("image/"))) { setError("Choose image files only."); return }
    setUploading(true); onBusyChange(true); setError("")
    try {
      const result = await sdk.admin.upload.create({ files })
      const added = result.files.map(file => ({ url: file.url }))
      if (added.some(file => !file.url)) throw new Error("An uploaded file did not return a URL.")
      onChange([...images, ...added])
      if (!thumbnail && added[0]) onThumbnail(added[0].url)
    } catch (failure) { setError(errorMessage(failure)) }
    finally { setUploading(false); onBusyChange(false); if (input.current) input.current.value = "" }
  }
  function move(index: number, direction: number) {
    const target = index + direction
    if (target < 0 || target >= images.length) return
    const next = [...images]; [next[index], next[target]] = [next[target], next[index]]; onChange(next)
  }
  return <section className="panel form-panel product-media"><div className="product-section-heading"><div><h2>Media</h2><p>Add up to 15 images. Choose a cover and arrange their order.</p></div><button type="button" className="button" disabled={disabled || uploading} onClick={() => input.current?.click()}><ImagePlus size={16} />{uploading ? "Uploading…" : "Add images"}</button></div>
    <input ref={input} className="visually-hidden" type="file" accept="image/*" multiple disabled={disabled || uploading} onChange={event => void upload(Array.from(event.target.files || []))} />
    {error && <div className="login-error" role="alert">{error}</div>}
    {images.length ? <div className="product-media-grid">{images.map((image, index) => <div className="product-image" key={`${image.id || image.url}-${index}`}><img src={image.url} alt={`Product image ${index + 1}`} /><div className="product-image-controls"><label><input type="radio" name="product-thumbnail" checked={thumbnail === image.url} disabled={disabled} onChange={() => onThumbnail(image.url)} /> Cover</label><div><button type="button" aria-label={`Move image ${index + 1} earlier`} disabled={disabled || index === 0} onClick={() => move(index, -1)}><ArrowUp size={15} /></button><button type="button" aria-label={`Move image ${index + 1} later`} disabled={disabled || index === images.length - 1} onClick={() => move(index, 1)}><ArrowDown size={15} /></button><button type="button" aria-label={`Remove image ${index + 1}`} disabled={disabled} onClick={() => { const next = images.filter((_, i) => i !== index); onChange(next); if (thumbnail === image.url) onThumbnail(next[0]?.url || "") }}><Trash2 size={15} /></button></div></div></div>)}</div> : <p className="product-media-empty">No images yet. Upload product photos to show customers what you sell.</p>}
    <p className="field-help">Images upload immediately; save the product to attach your changes.</p>
  </section>
}
