export interface VariantInventoryDraft {
  color: string;
  image_url: string;
  price_override: string;
  sizeStocks: Record<string, string>;
}

export interface VariantInventoryRowInput {
  product_id: string;
  product_public_id: string;
  product_category: 'women' | 'girls' | 'babies';
  color: string;
  size: string;
  image_url: string;
  stock_quantity: number;
  price_override: number | null;
}

export const DEFAULT_VARIANT_COLOR = 'Default';
export const DEFAULT_VARIANT_SIZE = 'Free Size';

export const parseOptionList = (value: string) =>
  value
    .split(',')
    .map((item) => item.trim())
    .filter((item) => item.length > 0);

export const normalizeVariantColors = (colors: string[]) =>
  colors.length > 0 ? colors : [DEFAULT_VARIANT_COLOR];

export const normalizeVariantSizes = (sizes: string[]) =>
  sizes.length > 0 ? sizes : [DEFAULT_VARIANT_SIZE];

export const formatVariantOptionLabel = (value: string, fallbackLabel: string) =>
  value === DEFAULT_VARIANT_COLOR || value === DEFAULT_VARIANT_SIZE ? fallbackLabel : value;

export const buildVariantDrafts = (
  colors: string[],
  sizes: string[],
  existingDrafts: VariantInventoryDraft[],
  fallbackImage = ''
): VariantInventoryDraft[] => {
  const previousByColor = new Map(existingDrafts.map((draft) => [draft.color.toLowerCase(), draft]));

  return colors.map((color) => {
    const existing = previousByColor.get(color.toLowerCase());
    const sizeStocks = Object.fromEntries(
      sizes.map((size) => [size, existing?.sizeStocks[size] ?? '0'])
    );

    return {
      color,
      image_url: existing?.image_url ?? fallbackImage,
      price_override: existing?.price_override ?? '',
      sizeStocks,
    };
  });
};

export const buildVariantDraftsFromRows = (
  rows: Array<{
    color: string;
    size: string;
    image_url: string;
    stock_quantity: number;
    price_override: number | null;
  }>,
  colors: string[],
  sizes: string[],
  fallbackImage = ''
): VariantInventoryDraft[] => {
  const groupedRows = new Map<string, VariantInventoryDraft>();

  rows.forEach((row) => {
    const key = row.color.toLowerCase();
    const existing = groupedRows.get(key);

    if (existing) {
      existing.sizeStocks[row.size] = String(row.stock_quantity ?? 0);
      if (!existing.image_url && row.image_url) {
        existing.image_url = row.image_url;
      }
      if (existing.price_override === '' && row.price_override != null) {
        existing.price_override = String(row.price_override);
      }
      return;
    }

    groupedRows.set(key, {
      color: row.color,
      image_url: row.image_url || fallbackImage,
      price_override: row.price_override == null ? '' : String(row.price_override),
      sizeStocks: {
        [row.size]: String(row.stock_quantity ?? 0),
      },
    });
  });

  return buildVariantDrafts(
    colors,
    sizes,
    colors.map((color) => groupedRows.get(color.toLowerCase())).filter(Boolean) as VariantInventoryDraft[],
    fallbackImage
  );
};

export const validateVariantDrafts = (
  drafts: VariantInventoryDraft[],
  colors: string[],
  sizes: string[]
) => {
  for (const color of colors) {
    const draft = drafts.find((item) => item.color.toLowerCase() === color.toLowerCase());
    if (!draft) {
      return `Missing inventory details for ${color}.`;
    }

    if (!draft.image_url.trim()) {
      return `Add an image for ${color}.`;
    }

    if (draft.price_override.trim() !== '' && Number.isNaN(Number(draft.price_override))) {
      return `Enter a valid price override for ${color}.`;
    }

    for (const size of sizes) {
      const stockValue = draft.sizeStocks[size] ?? '';
      if (stockValue.trim() === '' || Number.isNaN(Number(stockValue)) || Number(stockValue) < 0) {
        return `Enter a valid stock quantity for ${color} / ${size}.`;
      }
    }
  }

  return null;
};

export const buildVariantRows = (
  drafts: VariantInventoryDraft[],
  colors: string[],
  sizes: string[],
  baseRow: {
    product_id: string;
    product_public_id: string;
    product_category: 'women' | 'girls' | 'babies';
  }
): VariantInventoryRowInput[] => {
  return colors.flatMap((color) => {
    const draft = drafts.find((item) => item.color.toLowerCase() === color.toLowerCase());
    if (!draft) {
      return [];
    }

    return sizes.map((size) => ({
      ...baseRow,
      color,
      size,
      image_url: draft.image_url.trim(),
      stock_quantity: parseInt(draft.sizeStocks[size], 10),
      price_override: draft.price_override.trim() === '' ? null : Number(draft.price_override),
    }));
  });
};

export const getTotalVariantStock = (drafts: VariantInventoryDraft[], sizes: string[]) =>
  drafts.reduce((total, draft) => {
    return total + sizes.reduce((sizeTotal, size) => sizeTotal + (parseInt(draft.sizeStocks[size] || '0', 10) || 0), 0);
  }, 0);