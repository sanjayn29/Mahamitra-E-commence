import { fetchAllProducts, EnhancedProduct } from './productService';

const SUPABASE_URL = 'https://zikguihpxnvbjcunybkt.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_TMuMQtHWtrxQTdRU40xJHw_cnUBaoYj';

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

/**
 * Call the Groq Edge Function to parse a user message into structured filters
 */
export const getFiltersFromAI = async (message: string): Promise<AIFilters> => {
  const res = await fetch(
    `${SUPABASE_URL}/functions/v1/super-processor`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message }),
    }
  );

  if (!res.ok) {
    const errorBody = await res.text();
    console.error('Edge function error:', res.status, errorBody);
    throw new Error(`AI service error (${res.status}): ${errorBody}`);
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
  const filters = await getFiltersFromAI(userMessage);

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
