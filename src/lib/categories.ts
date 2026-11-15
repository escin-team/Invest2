import {
  ProductCategorySchema,
  type InvestmentProduct,
  type ProductCategory,
} from './dashboard-schema';

export type CategoryStatusFilter = 'semua' | 'aktif' | 'nonaktif';

export const INITIAL_PRODUCT_CATEGORIES: ProductCategory[] = [
  {
    id: 'CAT-01',
    name: 'Infrastruktur Hijau',
    slug: 'infrastruktur-hijau',
    description: 'Proyek energi surya dan infrastruktur ramah lingkungan.',
    status: 'aktif',
    createdAt: '2026-08-10',
  },
  {
    id: 'CAT-02',
    name: 'Rantai Pasok',
    slug: 'rantai-pasok',
    description: 'Pembiayaan logistik distribusi dan gudang berpendingin.',
    status: 'aktif',
    createdAt: '2026-08-12',
  },
  {
    id: 'CAT-03',
    name: 'Pembiayaan Produktif',
    slug: 'pembiayaan-produktif',
    description: 'Obligasi mikro dan modal kerja UMKM digital.',
    status: 'aktif',
    createdAt: '2026-08-15',
  },
  {
    id: 'CAT-04',
    name: 'Mobilitas Bersih',
    slug: 'mobilitas-bersih',
    description: 'Armada kendaraan listrik komersial dan stasiun pengisian.',
    status: 'aktif',
    createdAt: '2026-09-01',
  },
  {
    id: 'CAT-05',
    name: 'Infrastruktur Digital',
    slug: 'infrastruktur-digital',
    description: 'Pusat data regional, jaringan serat optik, dan cloud edge.',
    status: 'aktif',
    createdAt: '2026-09-10',
  },
  {
    id: 'CAT-06',
    name: 'Agroteknologi',
    slug: 'agroteknologi',
    description: 'Pertanian modern hidroponik dan ketahanan pangan.',
    status: 'nonaktif',
    createdAt: '2026-09-18',
  },
];

export function slugifyCategoryName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export function getNextCategoryId(categories: ProductCategory[]): string {
  let maxNum = 0;
  for (const cat of categories) {
    const match = /^CAT-(\d+)$/i.exec(cat.id);
    if (match) {
      const n = Number.parseInt(match[1], 10);
      if (Number.isFinite(n) && n > maxNum) {
        maxNum = n;
      }
    }
  }
  return `CAT-${String(maxNum + 1).padStart(2, '0')}`;
}

export function countProductsByCategory(
  products: InvestmentProduct[],
  categoryName: string
): number {
  const normalized = categoryName.trim().toLowerCase();
  return products.filter((p) => p.category.trim().toLowerCase() === normalized).length;
}

export function getCategorySummary(
  categories: ProductCategory[],
  products: InvestmentProduct[]
): {
  totalCount: number;
  activeCount: number;
  inactiveCount: number;
  linkedProductsCount: number;
} {
  const categoryNames = new Set(categories.map((c) => c.name.trim().toLowerCase()));
  let activeCount = 0;
  let inactiveCount = 0;

  for (const cat of categories) {
    if (cat.status === 'aktif') {
      activeCount += 1;
    } else {
      inactiveCount += 1;
    }
  }

  const linkedProductsCount = products.filter((p) =>
    categoryNames.has(p.category.trim().toLowerCase())
  ).length;

  return {
    totalCount: categories.length,
    activeCount,
    inactiveCount,
    linkedProductsCount,
  };
}

export function filterProductCategories(
  categories: ProductCategory[],
  options: { statusFilter: CategoryStatusFilter; query: string }
): ProductCategory[] {
  const { statusFilter, query } = options;
  const q = query.trim().toLowerCase();

  return categories.filter((cat) => {
    if (statusFilter !== 'semua' && cat.status !== statusFilter) {
      return false;
    }
    if (!q) return true;
    return (
      cat.id.toLowerCase().includes(q) ||
      cat.name.toLowerCase().includes(q) ||
      cat.slug.toLowerCase().includes(q) ||
      cat.description.toLowerCase().includes(q)
    );
  });
}

export function addProductCategory(
  categories: ProductCategory[],
  input: {
    name: string;
    slug?: string;
    description?: string;
    status?: 'aktif' | 'nonaktif';
    createdAt?: string;
  }
): { categories: ProductCategory[]; error: string | null } {
  const name = input.name.trim();
  if (!name) {
    return { categories, error: 'Nama kategori wajib diisi.' };
  }

  const duplicate = categories.some(
    (c) => c.name.trim().toLowerCase() === name.toLowerCase()
  );
  if (duplicate) {
    return { categories, error: `Kategori "${name}" sudah ada.` };
  }

  const slug = slugifyCategoryName(input.slug?.trim() || name) || `kategori-${categories.length + 1}`;
  const candidate = ProductCategorySchema.safeParse({
    id: getNextCategoryId(categories),
    name,
    slug,
    description: (input.description ?? '').trim(),
    status: input.status ?? 'aktif',
    createdAt: input.createdAt ?? new Date().toISOString().slice(0, 10),
  });

  if (!candidate.success) {
    return {
      categories,
      error: candidate.error.issues[0]?.message ?? 'Data kategori tidak valid.',
    };
  }

  return {
    categories: [candidate.data, ...categories],
    error: null,
  };
}

export function updateProductCategory(
  categories: ProductCategory[],
  input: {
    id: string;
    name: string;
    slug?: string;
    description?: string;
    status: 'aktif' | 'nonaktif';
  }
): {
  categories: ProductCategory[];
  previousName: string | null;
  nextName: string | null;
  error: string | null;
} {
  const existing = categories.find((c) => c.id === input.id);
  if (!existing) {
    return {
      categories,
      previousName: null,
      nextName: null,
      error: `Kategori ${input.id} tidak ditemukan.`,
    };
  }

  const name = input.name.trim();
  if (!name) {
    return {
      categories,
      previousName: null,
      nextName: null,
      error: 'Nama kategori wajib diisi.',
    };
  }

  const duplicate = categories.some(
    (c) => c.id !== input.id && c.name.trim().toLowerCase() === name.toLowerCase()
  );
  if (duplicate) {
    return {
      categories,
      previousName: null,
      nextName: null,
      error: `Kategori "${name}" sudah digunakan.`,
    };
  }

  const slug = slugifyCategoryName(input.slug?.trim() || name) || existing.slug;
  const candidate = ProductCategorySchema.safeParse({
    ...existing,
    name,
    slug,
    description: (input.description ?? '').trim(),
    status: input.status,
  });

  if (!candidate.success) {
    return {
      categories,
      previousName: null,
      nextName: null,
      error: candidate.error.issues[0]?.message ?? 'Data kategori tidak valid.',
    };
  }

  return {
    categories: categories.map((c) => (c.id === input.id ? candidate.data : c)),
    previousName: existing.name,
    nextName: candidate.data.name,
    error: null,
  };
}

export function deleteProductCategory(
  categories: ProductCategory[],
  categoryId: string
): {
  categories: ProductCategory[];
  deletedCategory: ProductCategory | null;
} {
  const target = categories.find((c) => c.id === categoryId) ?? null;
  if (!target) {
    return { categories, deletedCategory: null };
  }
  return {
    categories: categories.filter((c) => c.id !== categoryId),
    deletedCategory: target,
  };
}
