import { useState } from "react";
import { Link } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { useCategories } from "@/hooks/useBudgetData";
import {
  addCategory,
  renameCategory,
  setCategoryArchived,
} from "@/lib/db";
import { BUCKET_META, BUCKETS, type Bucket, type Category } from "@/types";
import { BUCKET_COLORS } from "@/lib/charts";
import { CATEGORY_ICON_CHOICES } from "@/lib/defaults";
import { Modal } from "@/components/ui/Modal";
import {
  ArchiveIcon,
  ChevronLeft,
  PencilIcon,
  PlusIcon,
} from "@/components/ui/Icons";

export function Categories() {
  const all = useCategories(true);
  const [editing, setEditing] = useState<Category | null>(null);
  const [adding, setAdding] = useState<Bucket | null>(null);

  return (
    <AppLayout title="Categories" subtitle="Organize where your money goes" showMonth={false}>
      <div className="mb-4">
        <Link to="/settings" className="btn-ghost -ml-2">
          <ChevronLeft width={18} height={18} /> Back to settings
        </Link>
      </div>

      <div className="space-y-5">
        {BUCKETS.map((bucket) => {
          const items = all.filter((c) => c.bucket === bucket);
          return (
            <section key={bucket} className="card p-4">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="flex items-center gap-2 font-semibold text-slate-800">
                  <span
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: BUCKET_COLORS[bucket] }}
                  />
                  {BUCKET_META[bucket].emoji} {BUCKET_META[bucket].label}
                </h2>
                <button
                  className="btn-ghost text-blue-600"
                  onClick={() => setAdding(bucket)}
                >
                  <PlusIcon width={18} height={18} /> Add
                </button>
              </div>

              <ul className="divide-y divide-slate-100">
                {items.map((c) => (
                  <li
                    key={c.id}
                    className={`flex items-center gap-3 py-2.5 ${
                      c.archived ? "opacity-50" : ""
                    }`}
                  >
                    <span className="text-lg" aria-hidden>
                      {c.icon}
                    </span>
                    <span className="flex-1 font-medium text-slate-700">
                      {c.name}
                      {c.archived && (
                        <span className="ml-2 text-xs text-slate-400">(hidden)</span>
                      )}
                    </span>
                    <button
                      className="btn-ghost h-8 w-8 rounded-full p-0"
                      aria-label={`Rename ${c.name}`}
                      onClick={() => setEditing(c)}
                    >
                      <PencilIcon width={16} height={16} />
                    </button>
                    <button
                      className="btn-ghost h-8 w-8 rounded-full p-0"
                      aria-label={c.archived ? `Restore ${c.name}` : `Hide ${c.name}`}
                      onClick={() => setCategoryArchived(c.id!, !c.archived)}
                    >
                      <ArchiveIcon width={16} height={16} />
                    </button>
                  </li>
                ))}
                {items.length === 0 && (
                  <li className="py-3 text-center text-sm text-slate-400">
                    No categories yet.
                  </li>
                )}
              </ul>
            </section>
          );
        })}
      </div>

      {editing && (
        <CategoryEditModal
          category={editing}
          onClose={() => setEditing(null)}
        />
      )}
      {adding && (
        <CategoryAddModal bucket={adding} onClose={() => setAdding(null)} />
      )}
    </AppLayout>
  );
}

function CategoryEditModal({
  category,
  onClose,
}: {
  category: Category;
  onClose: () => void;
}) {
  const [name, setName] = useState(category.name);
  return (
    <Modal
      open
      onClose={onClose}
      title="Rename category"
      footer={
        <div className="flex justify-end gap-2">
          <button className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn-primary"
            onClick={async () => {
              if (name.trim()) await renameCategory(category.id!, name.trim());
              onClose();
            }}
          >
            Save
          </button>
        </div>
      }
    >
      <label className="label" htmlFor="cat-name">
        Name
      </label>
      <input
        id="cat-name"
        className="input"
        value={name}
        onChange={(e) => setName(e.target.value)}
        autoFocus
      />
    </Modal>
  );
}

function CategoryAddModal({
  bucket,
  onClose,
}: {
  bucket: Bucket;
  onClose: () => void;
}) {
  const [name, setName] = useState("");
  const [icon, setIcon] = useState(CATEGORY_ICON_CHOICES[0]);

  return (
    <Modal
      open
      onClose={onClose}
      title={`New ${BUCKET_META[bucket].label} category`}
      footer={
        <div className="flex justify-end gap-2">
          <button className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn-primary"
            disabled={!name.trim()}
            onClick={async () => {
              await addCategory({ name: name.trim(), bucket, icon });
              onClose();
            }}
          >
            Add category
          </button>
        </div>
      }
    >
      <label className="label" htmlFor="new-cat-name">
        Name
      </label>
      <input
        id="new-cat-name"
        className="input"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="e.g. Pet care"
        autoFocus
      />
      <p className="label mt-4">Pick an icon</p>
      <div className="flex flex-wrap gap-2">
        {CATEGORY_ICON_CHOICES.map((emoji) => (
          <button
            key={emoji}
            onClick={() => setIcon(emoji)}
            className={`flex h-10 w-10 items-center justify-center rounded-xl border text-lg ${
              icon === emoji
                ? "border-blue-500 bg-blue-50"
                : "border-slate-200 hover:bg-slate-50"
            }`}
          >
            {emoji}
          </button>
        ))}
      </div>
    </Modal>
  );
}
