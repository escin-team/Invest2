'use client';

import { useEffect, useState, type FormEvent } from 'react';
import {
  AlertCircle,
  FolderKanban,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import { Button } from '@/src/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader } from '@/src/components/ui/card';
import { Input } from '@/src/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/src/components/ui/table';
import type { InvestmentProduct, ProductCategory } from '@/src/lib/dashboard-schema';
import {
  countProductsByCategory,
  filterProductCategories,
  getCategorySummary,
  slugifyCategoryName,
  type CategoryStatusFilter,
} from '@/src/lib/categories';
import { cn, formatNumber } from '@/src/lib/utils';

interface CategoryViewProps {
  categories: ProductCategory[];
  products: InvestmentProduct[];
  onAddCategory: (input: {
    name: string;
    slug: string;
    description: string;
    status: 'aktif' | 'nonaktif';
  }) => string | null;
  onUpdateCategory: (input: {
    id: string;
    name: string;
    slug: string;
    description: string;
    status: 'aktif' | 'nonaktif';
  }) => string | null;
  onDeleteCategory: (categoryId: string, replacementCategoryName: string) => void;
}

export function CategoryView({
  categories,
  products,
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory,
}: CategoryViewProps) {
  const [statusFilter, setStatusFilter] = useState<CategoryStatusFilter>('semua');
  const [query, setQuery] = useState('');

  const [modalMode, setModalMode] = useState<'create' | 'edit' | null>(null);
  const [editingCategory, setEditingCategory] = useState<ProductCategory | null>(null);
  const [nameInput, setNameInput] = useState('');
  const [slugInput, setSlugInput] = useState('');
  const [slugEditedManually, setSlugEditedManually] = useState(false);
  const [descriptionInput, setDescriptionInput] = useState('');
  const [statusInput, setStatusInput] = useState<'aktif' | 'nonaktif'>('aktif');
  const [formError, setFormError] = useState<string | null>(null);

  const [deletingCategory, setDeletingCategory] = useState<ProductCategory | null>(null);
  const [replacementCategory, setReplacementCategory] = useState<string>('Tanpa Kategori');

  const summary = getCategorySummary(categories, products);
  const filtered = filterProductCategories(categories, { statusFilter, query });

  useEffect(() => {
    if (!modalMode && !deletingCategory) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (deletingCategory) {
          setDeletingCategory(null);
        } else {
          setModalMode(null);
          setEditingCategory(null);
          setFormError(null);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [modalMode, deletingCategory]);

  const openCreateModal = () => {
    setModalMode('create');
    setEditingCategory(null);
    setNameInput('');
    setSlugInput('');
    setSlugEditedManually(false);
    setDescriptionInput('');
    setStatusInput('aktif');
    setFormError(null);
  };

  const openEditModal = (cat: ProductCategory) => {
    setModalMode('edit');
    setEditingCategory(cat);
    setNameInput(cat.name);
    setSlugInput(cat.slug);
    setSlugEditedManually(true);
    setDescriptionInput(cat.description);
    setStatusInput(cat.status);
    setFormError(null);
  };

  const closeFormModal = () => {
    setModalMode(null);
    setEditingCategory(null);
    setFormError(null);
  };

  const openDeleteModal = (cat: ProductCategory) => {
    const firstAlternative =
      categories.find((c) => c.id !== cat.id && c.status === 'aktif')?.name ??
      categories.find((c) => c.id !== cat.id)?.name ??
      'Tanpa Kategori';
    setReplacementCategory(firstAlternative);
    setDeletingCategory(cat);
  };

  const handleSubmitForm = (e: FormEvent) => {
    e.preventDefault();
    if (modalMode === 'create') {
      const err = onAddCategory({
        name: nameInput,
        slug: slugInput,
        description: descriptionInput,
        status: statusInput,
      });
      if (err) {
        setFormError(err);
        return;
      }
      closeFormModal();
      return;
    }

    if (modalMode === 'edit' && editingCategory) {
      const err = onUpdateCategory({
        id: editingCategory.id,
        name: nameInput,
        slug: slugInput,
        description: descriptionInput,
        status: statusInput,
      });
      if (err) {
        setFormError(err);
        return;
      }
      closeFormModal();
    }
  };

  const handleConfirmDelete = () => {
    if (!deletingCategory) return;
    onDeleteCategory(deletingCategory.id, replacementCategory);
    setDeletingCategory(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Category
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Kelola kategori untuk mengelompokkan produk investasi di katalog.
          </p>
        </div>

        <Button type="button" variant="primary" size="sm" onClick={openCreateModal}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          <span>Tambah Kategori</span>
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-5">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Total Kategori
            </p>
            <p
              className="mt-2 font-mono-num text-2xl font-bold text-slate-900 dark:text-slate-100"
              data-testid="cat-total-count"
            >
              {formatNumber(summary.totalCount)}
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {formatNumber(summary.inactiveCount)} nonaktif
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Kategori Aktif
            </p>
            <p
              className="mt-2 font-mono-num text-2xl font-bold text-emerald-700 dark:text-emerald-400"
              data-testid="cat-active-count"
            >
              {formatNumber(summary.activeCount)}
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Tersedia saat membuat atau mengedit produk
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Produk Terhubung
            </p>
            <p
              className="mt-2 font-mono-num text-2xl font-bold text-slate-900 dark:text-slate-100"
              data-testid="cat-linked-products"
            >
              {formatNumber(summary.linkedProductsCount)}
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              dari {formatNumber(products.length)} produk di katalog
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Category Table Card */}
      <Card>
        <CardHeader className="border-b border-slate-100 dark:border-slate-800/80">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div
              className="inline-flex flex-wrap items-center rounded-lg border border-slate-200 bg-slate-50 p-1 dark:border-slate-800 dark:bg-slate-950"
              role="group"
              aria-label="Filter status kategori"
            >
              {(
                [
                  { id: 'semua', label: 'Semua' },
                  { id: 'aktif', label: 'Aktif' },
                  { id: 'nonaktif', label: 'Nonaktif' },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setStatusFilter(tab.id)}
                  aria-pressed={statusFilter === tab.id}
                  className={cn(
                    'rounded-md px-3 py-1.5 text-xs font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer',
                    statusFilter === tab.id
                      ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-800 dark:text-slate-100'
                      : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-72">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                aria-hidden="true"
              />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Cari ID, nama, atau slug kategori..."
                aria-label="Cari kategori produk"
                className="pl-9"
              />
            </div>
          </div>
          <CardDescription className="pt-2">
            Menampilkan {formatNumber(filtered.length)} dari {formatNumber(categories.length)} kategori produk.
          </CardDescription>
        </CardHeader>

        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
              <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                Kategori tidak ditemukan
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Ubah kata kunci pencarian atau tambah kategori baru.
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => {
                  setQuery('');
                  setStatusFilter('semua');
                }}
              >
                Reset Filter
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="px-3">ID</TableHead>
                  <TableHead className="px-2">Nama Kategori</TableHead>
                  <TableHead className="px-2">Slug</TableHead>
                  <TableHead className="px-2">Deskripsi</TableHead>
                  <TableHead className="px-2 text-right">Jumlah Produk</TableHead>
                  <TableHead className="px-2">Status</TableHead>
                  <TableHead className="px-3 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((cat) => {
                  const productCount = countProductsByCategory(products, cat.name);
                  return (
                    <TableRow key={cat.id} data-testid={`category-row-${cat.id}`}>
                      <TableCell className="px-3 font-mono-num text-xs font-semibold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                        {cat.id}
                      </TableCell>
                      <TableCell className="px-2 text-sm font-semibold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                        {cat.name}
                      </TableCell>
                      <TableCell className="px-2 font-mono-num text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        {cat.slug}
                      </TableCell>
                      <TableCell className="px-2 text-xs text-slate-600 dark:text-slate-300 max-w-[260px]">
                        <span className="line-clamp-2">
                          {cat.description || '-'}
                        </span>
                      </TableCell>
                      <TableCell className="px-2 text-right font-mono-num text-xs font-semibold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                        {formatNumber(productCount)} produk
                      </TableCell>
                      <TableCell className="px-2 whitespace-nowrap">
                        {cat.status === 'aktif' ? (
                          <span className="inline-flex items-center rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-400">
                            Aktif
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-md border border-slate-200 bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                            Nonaktif
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="px-3 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-7 px-2.5 text-xs"
                            aria-label={`Edit kategori ${cat.name}`}
                            onClick={() => openEditModal(cat)}
                          >
                            <Pencil className="h-3 w-3" aria-hidden="true" />
                            <span>Edit</span>
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-7 border-rose-200 px-2.5 text-xs text-rose-700 hover:bg-rose-50 hover:text-rose-800 dark:border-rose-900/60 dark:text-rose-400 dark:hover:bg-rose-950/40"
                            aria-label={`Hapus kategori ${cat.name}`}
                            onClick={() => openDeleteModal(cat)}
                          >
                            <Trash2 className="h-3 w-3" aria-hidden="true" />
                            <span>Hapus</span>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create / Edit Category Modal */}
      {modalMode && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
          aria-labelledby="category-modal-title"
          onClick={closeFormModal}
        >
          <div
            className="w-full max-w-md overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <FolderKanban className="h-5 w-5 text-purple-600 dark:text-purple-400" aria-hidden="true" />
                <div>
                  <h2
                    id="category-modal-title"
                    className="font-display text-base font-bold text-slate-900 dark:text-slate-100"
                  >
                    {modalMode === 'create'
                      ? 'Tambah Kategori Baru'
                      : `Edit Kategori · ${editingCategory?.id}`}
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Perubahan nama kategori akan tersinkron ke daftar produk.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeFormModal}
                aria-label="Tutup modal kategori"
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} noValidate className="space-y-4 p-5">
              <div>
                <label
                  htmlFor="category-name-input"
                  className="block text-xs font-semibold text-slate-800 dark:text-slate-200"
                >
                  Nama Kategori
                </label>
                <Input
                  id="category-name-input"
                  value={nameInput}
                  onChange={(e) => {
                    const next = e.target.value;
                    setNameInput(next);
                    if (!slugEditedManually) {
                      setSlugInput(slugifyCategoryName(next));
                    }
                    if (formError) setFormError(null);
                  }}
                  placeholder="Contoh: Energi Terbarukan"
                  className="mt-1.5"
                />
              </div>

              <div>
                <label
                  htmlFor="category-slug-input"
                  className="block text-xs font-semibold text-slate-800 dark:text-slate-200"
                >
                  Slug
                </label>
                <Input
                  id="category-slug-input"
                  value={slugInput}
                  onChange={(e) => {
                    setSlugEditedManually(true);
                    setSlugInput(e.target.value);
                  }}
                  placeholder="energi-terbarukan"
                  className="mt-1.5 font-mono-num"
                />
              </div>

              <div>
                <label
                  htmlFor="category-desc-input"
                  className="block text-xs font-semibold text-slate-800 dark:text-slate-200"
                >
                  Deskripsi
                </label>
                <textarea
                  id="category-desc-input"
                  rows={2}
                  value={descriptionInput}
                  onChange={(e) => setDescriptionInput(e.target.value)}
                  placeholder="Ringkasan produk yang termasuk kategori ini..."
                  className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-600/20 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
                />
              </div>

              <div>
                <label
                  htmlFor="category-status-select"
                  className="block text-xs font-semibold text-slate-800 dark:text-slate-200"
                >
                  Status
                </label>
                <select
                  id="category-status-select"
                  value={statusInput}
                  onChange={(e) => setStatusInput(e.target.value as 'aktif' | 'nonaktif')}
                  className="mt-1.5 flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-600/20 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
                >
                  <option value="aktif">Aktif</option>
                  <option value="nonaktif">Nonaktif</option>
                </select>
              </div>

              {formError && (
                <p
                  role="alert"
                  className="flex items-center gap-1.5 text-xs font-medium text-rose-700 dark:text-rose-400"
                >
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  <span>{formError}</span>
                </p>
              )}

              <div className="flex items-center justify-end gap-2 border-t border-slate-200 pt-4 dark:border-slate-800">
                <Button type="button" variant="outline" size="sm" onClick={closeFormModal}>
                  Batal
                </Button>
                <Button type="submit" variant="primary" size="sm">
                  Simpan Kategori
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingCategory && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-category-title"
          onClick={() => setDeletingCategory(null)}
        >
          <div
            className="w-full max-w-md overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-800">
              <h2
                id="delete-category-title"
                className="font-display text-base font-bold text-slate-900 dark:text-slate-100"
              >
                Hapus Kategori {deletingCategory.name}?
              </h2>
              <button
                type="button"
                onClick={() => setDeletingCategory(null)}
                aria-label="Tutup konfirmasi hapus kategori"
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            <div className="space-y-4 p-5 text-xs">
              {(() => {
                const linkedCount = countProductsByCategory(products, deletingCategory.name);
                const alternativeOptions = categories.filter((c) => c.id !== deletingCategory.id);
                return linkedCount > 0 ? (
                  <div className="space-y-3">
                    <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-200">
                      Kategori ini masih dipakai oleh{' '}
                      <span className="font-semibold">{formatNumber(linkedCount)} produk</span>.
                      Pilih kategori pengganti sebelum menghapus:
                    </div>
                    <div>
                      <label
                        htmlFor="replacement-category-select"
                        className="block font-semibold text-slate-800 dark:text-slate-200"
                      >
                        Pindahkan Produk ke Kategori
                      </label>
                      <select
                        id="replacement-category-select"
                        value={replacementCategory}
                        onChange={(e) => setReplacementCategory(e.target.value)}
                        className="mt-1.5 flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-600/20 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
                      >
                        {alternativeOptions.map((alt) => (
                          <option key={alt.id} value={alt.name}>
                            {alt.name}
                          </option>
                        ))}
                        <option value="Tanpa Kategori">Tanpa Kategori</option>
                      </select>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    Kategori <span className="font-semibold">{deletingCategory.name}</span> belum dipakai oleh produk mana pun dan akan dihapus permanen.
                  </p>
                );
              })()}

              <div className="flex items-center justify-end gap-2 border-t border-slate-200 pt-4 dark:border-slate-800">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setDeletingCategory(null)}
                >
                  Batal
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={handleConfirmDelete}
                >
                  Ya, Hapus
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
