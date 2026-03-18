import { fetchAllProducts, EnhancedProduct } from './productService';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const EDGE_FUNCTION_NAMES = ['super-processor', 'groq-chat'];

// Filters returned by the AI
export interface AIFilters {
  price?: number;
  color?: string;
  category?: string;
  audience?: 'women' | 'girls' | 'babies';
  product_type?: string;
  sort?: 'rating' | 'orders_count';
  strict?: boolean;
}

// Chat message type
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  products?: EnhancedProduct[];
  timestamp: Date;
}

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  women: ['women', 'woman', 'ladies'],
  girls: ['girls', 'girl', 'kids', 'kid'],
  babies: ['babies', 'baby', 'infant', 'newborn'],
};

const AUDIENCE_VALUES = ['women', 'girls', 'babies'] as const;

const PRODUCT_TYPE_KEYWORDS: Record<string, string[]> = {
  saree: ['saree', 'sarees', 'sari', 'saris'],
  kurti: ['kurti', 'kurtis', 'kurta', 'kurtas'],
  frock: ['frock', 'frocks'],
  dress: ['dress', 'dresses'],
  lehenga: ['lehenga', 'lehengas'],
  gown: ['gown', 'gowns'],
  blouse: ['blouse', 'blouses'],
  top: ['top', 'tops'],
  skirt: ['skirt', 'skirts'],
  salwar: ['salwar', 'salwars'],
  suit: ['suit', 'suits'],
  dupatta: ['dupatta', 'dupattas'],
  'co-ord': ['co-ord', 'co ord', 'coord', 'coords', 'co-ords'],
  nighty: ['nighty', 'nighties'],
  jumpsuit: ['jumpsuit', 'jumpsuits'],
};

const PRODUCT_TYPE_ALIAS_TO_CANONICAL: Record<string, string> = Object.entries(PRODUCT_TYPE_KEYWORDS).reduce(
  (acc, [canonical, keywords]) => {
    keywords.forEach((keyword) => {
      acc[keyword] = canonical;
    });
    return acc;
  },
  {} as Record<string, string>
);

const normalizeText = (value: string): string => value.toLowerCase().replace(/[^a-z0-9\s-]/g, ' ').replace(/\s+/g, ' ').trim();

const normalizeProductType = (value?: string): string | undefined => {
  if (!value) return undefined;
  const normalized = normalizeText(value);
  return PRODUCT_TYPE_ALIAS_TO_CANONICAL[normalized] || normalized || undefined;
};

const isAudience = (value?: string): value is (typeof AUDIENCE_VALUES)[number] => {
  return !!value && (AUDIENCE_VALUES as readonly string[]).includes(value.toLowerCase());
};

const matchesWord = (haystack: string, needle: string): boolean => {
  const escaped = needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`\\b${escaped}\\b`, 'i').test(haystack);
};

const matchesProductType = (product: EnhancedProduct, productType: string): boolean => {
  const canonical = normalizeProductType(productType);
  if (!canonical) return false;

  const aliases = PRODUCT_TYPE_KEYWORDS[canonical] || [canonical];
  const searchable = normalizeText(`${product.name} ${product.material} ${product.subcategory}`);
  return aliases.some((alias) => matchesWord(searchable, normalizeText(alias)));
};

const COMMON_COLORS = [
  'red', 'blue', 'green', 'black', 'white', 'pink', 'purple', 'yellow', 'orange', 'brown', 'grey', 'gray', 'maroon',
  'navy', 'teal', 'gold', 'silver', 'beige', 'cream'
];

const getFiltersFromHeuristics = (message: string): AIFilters => {
  const text = message.toLowerCase();
  const filters: AIFilters = {};

  const underMatch = text.match(/(?:under|below|less\s+than)\s*₹?\s*(\d[\d,]*)/i);
  if (underMatch?.[1]) {
    filters.price = Number(underMatch[1].replace(/,/g, ''));
  }

  const budgetMatch = text.match(/(?:budget|price)\s*₹?\s*(\d[\d,]*)/i);
  if (!filters.price && budgetMatch?.[1]) {
    filters.price = Number(budgetMatch[1].replace(/,/g, ''));
  }

  const matchedColor = COMMON_COLORS.find((color) => text.includes(color));
  if (matchedColor) {
    filters.color = matchedColor;
  }

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some((keyword) => text.includes(keyword))) {
      filters.category = category;
      filters.audience = category as AIFilters['audience'];
      break;
    }
  }

  for (const [productType, keywords] of Object.entries(PRODUCT_TYPE_KEYWORDS)) {
    if (keywords.some((keyword) => text.includes(keyword))) {
      filters.product_type = productType;
      break;
    }
  }

  if (/top\s*rated|best\s*rated|rating/i.test(text)) {
    filters.sort = 'rating';
  } else if (/most\s*ordered|popular|trending|bestseller/i.test(text)) {
    filters.sort = 'orders_count';
  }

  return filters;
};

/**
 * Call the Groq Edge Function to parse a user message into structured filters
 */
export const getFiltersFromAI = async (message: string): Promise<AIFilters> => {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error('Chatbot is not configured: missing Supabase environment variables');
  }

  let res: Response | null = null;
  let lastError = '';

  for (const functionName of EDGE_FUNCTION_NAMES) {
    const endpoint = `${SUPABASE_URL}/functions/v1/${functionName}`;

    try {
      res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ message }),
      });

      if (res.ok) {
        break;
      }

      const errorBody = await res.text();
      lastError = `${functionName} -> ${res.status}: ${errorBody}`;
    } catch (error) {
      lastError = `${functionName} -> network error: ${String(error)}`;
    }
  }

  if (!res || !res.ok) {
    console.error('Edge function error:', lastError);
    throw new Error(`AI service error: ${lastError || 'No reachable edge function'}`);
  }

  const text = await res.text();

  // The AI may wrap JSON in markdown code fences — strip them
  const cleaned = text
    .replace(/```json\s*/gi, '')
    .replace(/```\s*/g, '')
    .trim();

  try {
    return JSON.parse(cleaned) as AIFilters;
  } catch {
    console.error('Failed to parse AI response:', text);
    throw new Error('Could not understand the response');
  }
};

/**
 * Apply AI-generated filters to the full product catalog and return matches
 */
export const getProductsFromAI = async (
  userMessage: string
): Promise<{ filters: AIFilters; products: EnhancedProduct[]; summary: string }> => {
  // 1. Get structured filters from AI
  let filters: AIFilters;
  const heuristicFilters = getFiltersFromHeuristics(userMessage);

  try {
    filters = await getFiltersFromAI(userMessage);
  } catch (error) {
    console.warn('AI filter extraction failed, using heuristic fallback:', error);
    filters = { ...heuristicFilters };
  }

  // Even when AI succeeds, backfill missing values from deterministic heuristics.
  // This enforces explicit user terms like "saree" when the model omits product_type.
  filters = {
    ...heuristicFilters,
    ...filters,
  };

  // 2. Fetch all products
  const allProducts = await fetchAllProducts();

  // Backward compatibility with older edge responses
  if (!filters.audience && isAudience(filters.category)) {
    filters.audience = filters.category;
  }

  if (!filters.product_type && filters.category && !isAudience(filters.category)) {
    filters.product_type = normalizeProductType(filters.category);
  }

  filters.product_type = normalizeProductType(filters.product_type);

  // 3. Apply filters
  let filtered = [...allProducts];

  if (filters.audience) {
    const audience = filters.audience.toLowerCase();
    filtered = filtered.filter((p) => p.category.toLowerCase() === audience);
  }

  if (filters.product_type) {
    filtered = filtered.filter((p) => matchesProductType(p, filters.product_type!));
  }

  if (filters.price) {
    filtered = filtered.filter((p) => p.price <= filters.price!);
  }

  if (filters.color) {
    const color = filters.color.toLowerCase();
    filtered = filtered.filter((p) =>
      p.colors.some((c) => {
        const normalizedColor = normalizeText(c);
        return matchesWord(normalizedColor, normalizeText(color));
      })
    );
  }

  if (filters.sort === 'rating') {
    // Sort by newest as a proxy (rating data not stored)
    filtered.sort((a, b) => {
      const da = new Date(a.created_at || '').getTime();
      const db = new Date(b.created_at || '').getTime();
      return db - da;
    });
  }

  // 4. Build a human-friendly summary
  const parts: string[] = [];
  if (filters.audience) parts.push(`audience: **${filters.audience}**`);
  if (filters.product_type) parts.push(`product type: **${filters.product_type}**`);
  if (filters.color) parts.push(`color: **${filters.color}**`);
  if (filters.price) parts.push(`price under **₹${filters.price.toLocaleString()}**`);
  if (filters.sort) parts.push(`sorted by **${filters.sort === 'rating' ? 'top rated' : 'most ordered'}**`);

  const summary =
    filtered.length > 0
      ? `Found **${filtered.length}** product${filtered.length > 1 ? 's' : ''} matching ${parts.join(', ') || 'your search'}.`
      : `Sorry, no products matched your search${parts.length ? ` (${parts.join(', ')})` : ''}. Try broadening your filters!`;

  return { filters, products: filtered, summary };
};
