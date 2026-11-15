import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Check, LoaderCircle } from "lucide-react";
import { api, errorMessage, sdk } from "../../lib/medusa";
import type { Product } from "../../lib/medusa";
import { PageHeading } from "../../lib/ui/PageHeading";
import { Dropdown } from "../../lib/ui/Dropdown";
import { ProductMedia } from "./ProductMedia";
import { ProductVariants } from "./ProductVariants";
import { ProductInventory } from "../../lib/ui/ProductInventory";

export function ProductEditor({
  product,
  demo,
  canWrite,
  canReadInventory,
  canWriteInventory,
  onDirty,
  onBack,
  onSaved,
  inDialog = false,
}: {
  product: Product;
  demo: boolean;
  canWrite: boolean;
  canReadInventory: boolean;
  canWriteInventory: boolean;
  onDirty: (v: boolean) => void;
  onBack: () => void;
  onSaved: () => void;
  inDialog?: boolean;
}) {
  const [form, setForm] = useState({
    title: product.title,
    handle: product.handle,
    description: product.description || "",
    status: product.status,
    collectionId: product.collection_id || product.collection?.id || "__none__",
    images: product.images || [],
    thumbnail: product.thumbnail || "",
  });
  const [detail, setDetail] = useState(product);
  const [collections, setCollections] = useState<{ id: string; title: string }[]>([]);
  const [collectionsError, setCollectionsError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [variantsDirty, setVariantsDirty] = useState(false);
  const [inventoryDirty, setInventoryDirty] = useState(false);
  const [original, setOriginal] = useState(form);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [id, setId] = useState(product.id);
  const [loading, setLoading] = useState(product.id !== "new" && !demo);
  const [loadFailed, setLoadFailed] = useState(false);
  useEffect(() => {
    if (product.id === "new" || demo) return;
    let active = true;
    api<{ product: Product }>(`/admin/products/${product.id}`)
      .then(({ product: p }) => {
        if (active) {
          const next = {
            title: p.title,
            handle: p.handle,
            description: p.description || "",
            status: p.status,
            collectionId: p.collection_id || p.collection?.id || "__none__",
            images: p.images || [],
            thumbnail: p.thumbnail || "",
          };
          setDetail(p);
          setForm(next);
          setOriginal(next);
        }
      })
      .catch((e) => {
        if (active) {
          setError(errorMessage(e));
          setLoadFailed(true);
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [product.id, demo]);
  useEffect(() => {
    if (demo) return;
    let active = true;
    api<{ collections: { id: string; title: string }[] }>("/admin/collections", { limit: 100 })
      .then(result => { if (active) setCollections(result.collections); })
      .catch(() => { if (active) setCollectionsError("Collections could not be loaded."); });
    return () => { active = false; };
  }, [demo]);
  const dirty = JSON.stringify(form) !== JSON.stringify(original);
  useEffect(() => onDirty(dirty || variantsDirty || inventoryDirty), [dirty, variantsDirty, inventoryDirty, onDirty]);
  const update = (key: "title" | "handle" | "description" | "status" | "collectionId" | "thumbnail", value: string) =>
    setForm((f) => ({ ...f, [key]: value }));
  const save = async (e: FormEvent) => {
    e.preventDefault();
    if (!canWrite || saving || loading || loadFailed || uploading) return;
    setSaving(true);
    setError("");
    try {
      if (!demo) {
        const { product: result } = await sdk.client.fetch<{
          product: Product;
        }>(id === "new" ? "/admin/products" : `/admin/products/${id}`, {
          method: "POST",
          body: {
            title: form.title,
            ...(id === "new" ? { options: [{ title: "Title", values: ["Default"] }] } : {}),
            description: form.description,
            status: id === "new" ? "draft" : form.status,
            handle: form.handle || undefined,
            ...(form.collectionId !== original.collectionId ? { collection_id: form.collectionId === "__none__" ? null : form.collectionId } : {}),
            ...(JSON.stringify(form.images) !== JSON.stringify(original.images) ? { images: form.images } : {}),
            ...(form.thumbnail !== original.thumbnail ? { thumbnail: form.thumbnail || null } : {}),
          },
        });
        setId(result.id);
        setDetail(result);
      }
      setOriginal(form);
      onSaved();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setSaving(false);
    }
  };
  return (
    <form onSubmit={save}>
      {!inDialog && <PageHeading
        title={id === "new" ? "Add product" : form.title || "Edit product"}
        description="Good products deserve good details."
        back={onBack}
      />}
      {error && (
        <div className="error-banner" role="alert">
          {error}
        </div>
      )}
      <div className="editor-grid">
        <div><section className="panel form-panel">
          <h2>Product details</h2>
          <label>
            Title
            <input
              aria-label="Title"
              required
              disabled={!canWrite || loading || loadFailed}
              value={form.title}
              onChange={(e) => update("title", e.target.value)}
              placeholder="e.g. Essential linen shirt"
            />
          </label>
          <label>
            Description
            <textarea
              aria-label="Description"
              rows={8}
              disabled={!canWrite || loading || loadFailed}
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
              placeholder="Tell your customer what makes it special."
            />
          </label>
          <div className="form-divider" />
          <h2>Search engine listing</h2>
          <label>
            URL handle
            <input
              aria-label="URL handle"
              value={form.handle}
              disabled={!canWrite || loading || loadFailed}
              onChange={(e) => update("handle", e.target.value)}
              placeholder="essential-linen-shirt"
              pattern="[a-zA-Z0-9_-]*"
            />
          </label>
          <p className="field-help">
            Use letters, numbers, hyphens or underscores.
          </p>
        </section>
        <ProductMedia images={form.images} thumbnail={form.thumbnail} onChange={images => setForm(current => ({ ...current, images }))} onThumbnail={value => update("thumbnail", value)} disabled={!canWrite || loading || loadFailed || saving} demo={demo} onBusyChange={setUploading} />
        {id !== "new" && !loading && !loadFailed && <ProductVariants product={detail} canWrite={canWrite} canWriteInventory={canWriteInventory} demo={demo} onDirtyChange={setVariantsDirty} onProductChange={setDetail} />}
        {id !== "new" && !loading && !loadFailed && <ProductInventory productId={id} canRead={canReadInventory} canWrite={canWriteInventory} demo={demo} onDirtyChange={setInventoryDirty} />}
        </div>
        <div>
          <section className="panel form-panel">
            <h2>Status</h2>
            <label>
              Product status
              <Dropdown
                label="Product status"
                disabled={!canWrite || id === "new" || loading || loadFailed}
                value={id === "new" ? "draft" : form.status}
                onValueChange={(value) => update("status", value)}
                options={[
                  { value: "draft", label: "Draft" },
                  { value: "published", label: "Active" },
                  { value: "rejected", label: "Rejected" },
                  { value: "proposed", label: "Proposed" },
                ]}
              />
            </label>
            <p className="field-help">
              New products are saved as drafts. Review their details before publishing.
            </p>
          </section>
          <section className="panel form-panel">
            <h2>Organisation</h2>
            <label>Collection<Dropdown label="Collection" value={form.collectionId} disabled={!canWrite || loading || loadFailed || Boolean(collectionsError)} onValueChange={value => update("collectionId", value)} options={[{ value: "__none__", label: "No collection" }, ...collections.map(collection => ({ value: collection.id, label: collection.title }))]} /></label>
            {collectionsError && <p role="alert">{collectionsError}</p>}
          </section>
        </div>
      </div>
      {dirty && (
        <div className="save-bar">
          <span>Unsaved changes</span>
          <div>
            <button
              className="button"
              type="button"
              disabled={saving}
              onClick={() => setForm(original)}
            >
              Discard
            </button>
            <button
              className="button primary"
              disabled={saving || loading || loadFailed || uploading}
              type="submit"
            >
              {saving ? (
                <LoaderCircle size={15} className="spin" />
              ) : (
                <Check size={15} />
              )}
              Save product
            </button>
          </div>
        </div>
      )}
    </form>
  );
}
