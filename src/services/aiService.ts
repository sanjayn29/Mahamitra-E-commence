import { fetchAllProducts, EnhancedProduct } from './productService';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const EDGE_FUNCTION_NAMES = ['super-processor', 'groq-chat'];

// Filters returned by the AI
export interface AIFilters {
  price?: number;
  color?: string;
  category?: string;
  sort?: 'rating' | 'orders_count';
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

  try {
    filters = await getFiltersFromAI(userMessage);
  } catch (error) {
    console.warn('AI filter extraction failed, using heuristic fallback:', error);
    filters = getFiltersFromHeuristics(userMessage);
  }

  // 2. Fetch all products
  const allProducts = await fetchAllProducts();

  // 3. Apply filters
  let filtered = [...allProducts];

  if (filters.category) {
    const cat = filters.category.toLowerCase();
    filtered = filtered.filter(
      (p) =>
        p.category.toLowerCase().includes(cat) ||
        p.subcategory.toLowerCase().includes(cat) ||
        p.material.toLowerCase().includes(cat) ||
        p.name.toLowerCase().includes(cat)
    );
  }

  if (filters.price) {
    filtered = filtered.filter((p) => p.price <= filters.price!);
  }

  if (filters.color) {
    const color = filters.color.toLowerCase();
    filtered = filtered.filter((p) =>
      p.colors.some((c) => c.toLowerCase().includes(color))
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
  if (filters.category) parts.push(`category: **${filters.category}**`);
  if (filters.color) parts.push(`color: **${filters.color}**`);
  if (filters.price) parts.push(`price under **₹${filters.price.toLocaleString()}**`);
  if (filters.sort) parts.push(`sorted by **${filters.sort === 'rating' ? 'top rated' : 'most ordered'}**`);

  const summary =
    filtered.length > 0
      ? `Found **${filtered.length}** product${filtered.length > 1 ? 's' : ''} matching ${parts.join(', ') || 'your search'}.`
      : `Sorry, no products matched your search${parts.length ? ` (${parts.join(', ')})` : ''}. Try broadening your filters!`;

  return { filters, products: filtered, summary };
};
