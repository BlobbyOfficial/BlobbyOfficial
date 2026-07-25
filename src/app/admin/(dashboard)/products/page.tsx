import { createClient } from "@/lib/supabase/server";
import { createProduct, updateProduct, deleteProduct } from "./actions";

const inputClass =
  "bg-transparent border border-border px-3 py-2 text-[12px] text-fg outline-none transition-colors focus:border-border-hover w-full";
const labelClass = "text-[9px] tracking-[0.14em] uppercase text-mid";

export default async function AdminProductsPage() {
  const supabase = await createClient();
  const { data: products } = await supabase
    .from("products")
    .select("*")
    .order("sort_order", { ascending: true });

  return (
    <div>
      <h1 className="font-display text-3xl tracking-[0.04em] mb-8">Products</h1>

      <form action={createProduct} className="border border-border p-6 mb-10 grid grid-cols-3 gap-4 max-md:grid-cols-1">
        <div className="flex flex-col gap-1.5">
          <label className={labelClass}>Slug</label>
          <input name="slug" required className={inputClass} placeholder="edge-reflect" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className={labelClass}>Name</label>
          <input name="name" required className={inputClass} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className={labelClass}>Price label</label>
          <input name="price_label" defaultValue="Free" className={inputClass} />
        </div>
        <div className="flex flex-col gap-1.5 col-span-3 max-md:col-span-1">
          <label className={labelClass}>Description</label>
          <textarea name="description" required rows={2} className={inputClass} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className={labelClass}>Tags (comma separated)</label>
          <input name="tags" className={inputClass} placeholder="DaVinci (free), Edits" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className={labelClass}>Preview image URL</label>
          <input name="preview_image_url" required className={inputClass} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className={labelClass}>Buy URL</label>
          <input name="buy_url" required className={inputClass} />
        </div>
        <div className="flex items-center gap-3 col-span-3 max-md:col-span-1">
          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>Sort order</label>
            <input name="sort_order" type="number" defaultValue={0} className={inputClass} />
          </div>
          <label className="flex items-center gap-2 text-[11px] text-mid mt-5">
            <input name="published" type="checkbox" defaultChecked /> Published
          </label>
          <button type="submit" className="btn-primary shrink-0 mt-5">
            Add product
          </button>
        </div>
      </form>

      <div className="flex flex-col gap-3">
        {(products ?? []).map((product) => (
          <form
            key={product.id}
            action={updateProduct.bind(null, product.id)}
            className="border border-border p-6 grid grid-cols-3 gap-4 max-md:grid-cols-1"
          >
            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>Slug</label>
              <input name="slug" defaultValue={product.slug} required className={inputClass} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>Name</label>
              <input name="name" defaultValue={product.name} required className={inputClass} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>Price label</label>
              <input name="price_label" defaultValue={product.price_label} className={inputClass} />
            </div>
            <div className="flex flex-col gap-1.5 col-span-3 max-md:col-span-1">
              <label className={labelClass}>Description</label>
              <textarea name="description" defaultValue={product.description} required rows={2} className={inputClass} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>Tags (comma separated)</label>
              <input name="tags" defaultValue={product.tags.join(", ")} className={inputClass} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>Preview image URL</label>
              <input name="preview_image_url" defaultValue={product.preview_image_url} required className={inputClass} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>Buy URL</label>
              <input name="buy_url" defaultValue={product.buy_url} required className={inputClass} />
            </div>
            <div className="flex items-center gap-3 col-span-3 max-md:col-span-1">
              <div className="flex flex-col gap-1.5">
                <label className={labelClass}>Sort order</label>
                <input name="sort_order" type="number" defaultValue={product.sort_order} className={inputClass} />
              </div>
              <label className="flex items-center gap-2 text-[11px] text-mid mt-5">
                <input name="published" type="checkbox" defaultChecked={product.published} /> Published
              </label>
              <button type="submit" className="btn-ghost mt-5">
                Save
              </button>
              <button
                type="submit"
                formAction={deleteProduct.bind(null, product.id)}
                className="text-[11px] text-red-400 uppercase tracking-[0.1em] mt-5"
              >
                Delete
              </button>
            </div>
          </form>
        ))}
        {(!products || products.length === 0) && (
          <p className="text-[12px] text-mid">No products yet - add one above.</p>
        )}
      </div>
    </div>
  );
}
