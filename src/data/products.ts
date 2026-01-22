export interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  category: 'women' | 'girls' | 'babies';
  subcategory: string;
  description: string;
  images: string[];
  sizes: string[];
  colors: string[];
  rating: number;
  reviews: number;
  inStock: boolean;
  isNew?: boolean;
  isBestSeller?: boolean;
  fabric?: string;
}

export const products: Product[] = [
  // WOMEN'S COLLECTION (12 items)
  {
    id: "w1",
    name: "Banarasi Silk Saree",
    price: 12999,
    originalPrice: 15999,
    category: "women",
    subcategory: "Sarees",
    description: "Exquisite Banarasi silk saree with intricate gold zari work. Perfect for weddings and festive occasions. Features traditional motifs with a contemporary twist.",
    images: [
      "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800",
      "https://images.unsplash.com/photo-1594736797933-d0501ba2fe65?w=800"
    ],
    sizes: ["Free Size"],
    colors: ["Red", "Pink", "Gold"],
    rating: 4.8,
    reviews: 124,
    inStock: true,
    isBestSeller: true,
    fabric: "Pure Silk"
  },
  {
    id: "w2",
    name: "Embroidered Anarkali Kurta",
    price: 4999,
    originalPrice: 6499,
    category: "women",
    subcategory: "Kurtas",
    description: "Stunning floor-length Anarkali kurta with delicate thread embroidery. Features a flattering A-line silhouette and beautiful neckline detailing.",
    images: [
      "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=800"
    ],
    sizes: ["XS", "S", "M", "L", "XL", "XXL"],
    colors: ["Blush Pink", "Mint Green", "Powder Blue"],
    rating: 4.6,
    reviews: 89,
    inStock: true,
    isNew: true,
    fabric: "Georgette"
  },
  {
    id: "w3",
    name: "Designer Lehenga Choli",
    price: 24999,
    originalPrice: 32999,
    category: "women",
    subcategory: "Lehengas",
    description: "Breathtaking designer lehenga with heavy mirror work and sequin embellishments. Comes with matching choli and dupatta.",
    images: [
      "https://images.unsplash.com/photo-1604502130252-cd70b893a5c6?w=800"
    ],
    sizes: ["S", "M", "L", "XL"],
    colors: ["Maroon", "Navy Blue", "Emerald"],
    rating: 4.9,
    reviews: 67,
    inStock: true,
    isBestSeller: true,
    fabric: "Raw Silk"
  },
  {
    id: "w4",
    name: "Floral Maxi Dress",
    price: 3499,
    originalPrice: 4299,
    category: "women",
    subcategory: "Dresses",
    description: "Elegant floral print maxi dress perfect for summer days. Features a flattering wrap design and flowing silhouette.",
    images: [
      "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=800"
    ],
    sizes: ["XS", "S", "M", "L", "XL"],
    colors: ["Floral Pink", "Floral Blue", "Floral Yellow"],
    rating: 4.5,
    reviews: 156,
    inStock: true,
    fabric: "Crepe"
  },
  {
    id: "w5",
    name: "Chikankari Cotton Kurta",
    price: 2799,
    category: "women",
    subcategory: "Kurtas",
    description: "Hand-embroidered Lucknowi Chikankari kurta in pure cotton. Lightweight and comfortable for everyday elegance.",
    images: [
      "https://images.unsplash.com/photo-1594736797933-d0501ba2fe65?w=800"
    ],
    sizes: ["S", "M", "L", "XL", "XXL"],
    colors: ["White", "Baby Pink", "Sky Blue"],
    rating: 4.7,
    reviews: 203,
    inStock: true,
    fabric: "Pure Cotton"
  },
  {
    id: "w6",
    name: "Palazzo Suit Set",
    price: 3999,
    originalPrice: 5499,
    category: "women",
    subcategory: "Suits",
    description: "Comfortable palazzo suit set with printed kurta and matching palazzo pants. Includes a contrast dupatta.",
    images: [
      "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=800"
    ],
    sizes: ["S", "M", "L", "XL"],
    colors: ["Mustard", "Teal", "Coral"],
    rating: 4.4,
    reviews: 78,
    inStock: true,
    fabric: "Rayon"
  },
  {
    id: "w7",
    name: "Cocktail Party Gown",
    price: 8999,
    originalPrice: 11999,
    category: "women",
    subcategory: "Gowns",
    description: "Stunning floor-length cocktail gown with sequin detailing. Perfect for evening parties and special occasions.",
    images: [
      "https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=800"
    ],
    sizes: ["XS", "S", "M", "L"],
    colors: ["Black", "Burgundy", "Navy"],
    rating: 4.8,
    reviews: 45,
    inStock: true,
    isNew: true,
    fabric: "Satin"
  },
  {
    id: "w8",
    name: "Printed Silk Top",
    price: 1999,
    category: "women",
    subcategory: "Tops",
    description: "Elegant printed silk top with a relaxed fit. Perfect for both office wear and casual outings.",
    images: [
      "https://images.unsplash.com/photo-1564257631407-4deb1f99d992?w=800"
    ],
    sizes: ["XS", "S", "M", "L", "XL"],
    colors: ["Multi Print", "Paisley", "Abstract"],
    rating: 4.3,
    reviews: 112,
    inStock: true,
    fabric: "Silk Blend"
  },
  {
    id: "w9",
    name: "Cotton Saree with Zari Border",
    price: 5999,
    originalPrice: 7499,
    category: "women",
    subcategory: "Sarees",
    description: "Handloom cotton saree with elegant zari border. Lightweight and perfect for daily wear with a touch of elegance.",
    images: [
      "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800"
    ],
    sizes: ["Free Size"],
    colors: ["Yellow", "Orange", "Green"],
    rating: 4.6,
    reviews: 89,
    inStock: true,
    fabric: "Handloom Cotton"
  },
  {
    id: "w10",
    name: "Embellished Sharara Set",
    price: 7499,
    originalPrice: 9999,
    category: "women",
    subcategory: "Suits",
    description: "Beautiful sharara set with intricate embellishments. Features a short kurta with flared sharara pants.",
    images: [
      "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=800"
    ],
    sizes: ["S", "M", "L", "XL"],
    colors: ["Peach", "Lilac", "Sage Green"],
    rating: 4.7,
    reviews: 56,
    inStock: true,
    isBestSeller: true,
    fabric: "Georgette"
  },
  {
    id: "w11",
    name: "Casual Denim Dress",
    price: 2499,
    category: "women",
    subcategory: "Dresses",
    description: "Stylish denim dress with button-down front. A versatile piece that transitions from day to night effortlessly.",
    images: [
      "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=800"
    ],
    sizes: ["XS", "S", "M", "L", "XL"],
    colors: ["Light Blue", "Dark Blue", "Black"],
    rating: 4.4,
    reviews: 134,
    inStock: true,
    fabric: "Denim"
  },
  {
    id: "w12",
    name: "Organza Saree with Floral Print",
    price: 8999,
    originalPrice: 10999,
    category: "women",
    subcategory: "Sarees",
    description: "Lightweight organza saree with beautiful floral prints. Features a satin border for added elegance.",
    images: [
      "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800"
    ],
    sizes: ["Free Size"],
    colors: ["Pastel Pink", "Lavender", "Mint"],
    rating: 4.8,
    reviews: 78,
    inStock: true,
    isNew: true,
    fabric: "Organza"
  },

  // GIRLS' COLLECTION (8 items)
  {
    id: "g1",
    name: "Princess Lehenga Set",
    price: 3999,
    originalPrice: 5499,
    category: "girls",
    subcategory: "Ethnic Wear",
    description: "Adorable lehenga set for little princesses. Features sparkle embellishments and a matching dupatta.",
    images: [
      "https://images.unsplash.com/photo-1518831959646-742c3a14ebf7?w=800"
    ],
    sizes: ["2-3Y", "3-4Y", "4-5Y", "5-6Y", "6-7Y", "7-8Y"],
    colors: ["Hot Pink", "Purple", "Red"],
    rating: 4.9,
    reviews: 167,
    inStock: true,
    isBestSeller: true,
    fabric: "Net & Satin"
  },
  {
    id: "g2",
    name: "Floral Party Dress",
    price: 1999,
    originalPrice: 2499,
    category: "girls",
    subcategory: "Dresses",
    description: "Beautiful floral party dress with tulle underskirt. Perfect for birthday parties and special occasions.",
    images: [
      "https://images.unsplash.com/photo-1518831959646-742c3a14ebf7?w=800"
    ],
    sizes: ["2-3Y", "3-4Y", "4-5Y", "5-6Y", "6-7Y", "7-8Y", "8-9Y"],
    colors: ["Pink Floral", "Blue Floral", "Yellow Floral"],
    rating: 4.7,
    reviews: 145,
    inStock: true,
    fabric: "Cotton & Tulle"
  },
  {
    id: "g3",
    name: "Embroidered Kurti Set",
    price: 1499,
    category: "girls",
    subcategory: "Ethnic Wear",
    description: "Comfortable embroidered kurti with matching leggings. Perfect for festive occasions and family gatherings.",
    images: [
      "https://images.unsplash.com/photo-1518831959646-742c3a14ebf7?w=800"
    ],
    sizes: ["3-4Y", "4-5Y", "5-6Y", "6-7Y", "7-8Y", "8-9Y", "9-10Y"],
    colors: ["Yellow", "Orange", "Turquoise"],
    rating: 4.5,
    reviews: 89,
    inStock: true,
    fabric: "Cotton"
  },
  {
    id: "g4",
    name: "Summer Cotton Dress",
    price: 1299,
    category: "girls",
    subcategory: "Dresses",
    description: "Lightweight cotton dress perfect for summer. Features cute prints and a comfortable fit.",
    images: [
      "https://images.unsplash.com/photo-1518831959646-742c3a14ebf7?w=800"
    ],
    sizes: ["2-3Y", "3-4Y", "4-5Y", "5-6Y", "6-7Y", "7-8Y"],
    colors: ["Strawberry Print", "Butterfly Print", "Polka Dots"],
    rating: 4.6,
    reviews: 234,
    inStock: true,
    fabric: "Pure Cotton"
  },
  {
    id: "g5",
    name: "Anarkali Gown",
    price: 2999,
    originalPrice: 3999,
    category: "girls",
    subcategory: "Ethnic Wear",
    description: "Elegant Anarkali style gown for young fashionistas. Features beautiful embroidery and flowing silhouette.",
    images: [
      "https://images.unsplash.com/photo-1518831959646-742c3a14ebf7?w=800"
    ],
    sizes: ["4-5Y", "5-6Y", "6-7Y", "7-8Y", "8-9Y", "9-10Y"],
    colors: ["Coral", "Mint Green", "Lavender"],
    rating: 4.8,
    reviews: 76,
    inStock: true,
    isNew: true,
    fabric: "Georgette"
  },
  {
    id: "g6",
    name: "Casual Jumpsuit",
    price: 1699,
    category: "girls",
    subcategory: "Western Wear",
    description: "Trendy casual jumpsuit with fun prints. Easy to wear and perfect for everyday adventures.",
    images: [
      "https://images.unsplash.com/photo-1518831959646-742c3a14ebf7?w=800"
    ],
    sizes: ["3-4Y", "4-5Y", "5-6Y", "6-7Y", "7-8Y", "8-9Y"],
    colors: ["Denim Blue", "Pink", "White"],
    rating: 4.4,
    reviews: 98,
    inStock: true,
    fabric: "Cotton Blend"
  },
  {
    id: "g7",
    name: "Pattu Pavadai Set",
    price: 4499,
    originalPrice: 5999,
    category: "girls",
    subcategory: "Ethnic Wear",
    description: "Traditional South Indian pattu pavadai in rich silk. Perfect for temple visits and traditional functions.",
    images: [
      "https://images.unsplash.com/photo-1518831959646-742c3a14ebf7?w=800"
    ],
    sizes: ["2-3Y", "3-4Y", "4-5Y", "5-6Y", "6-7Y"],
    colors: ["Gold & Maroon", "Green & Pink", "Blue & Gold"],
    rating: 4.9,
    reviews: 54,
    inStock: true,
    isBestSeller: true,
    fabric: "Pure Silk"
  },
  {
    id: "g8",
    name: "Tutu Skirt with Top",
    price: 1799,
    category: "girls",
    subcategory: "Western Wear",
    description: "Adorable tutu skirt set with matching sequin top. Perfect for dance performances and parties.",
    images: [
      "https://images.unsplash.com/photo-1518831959646-742c3a14ebf7?w=800"
    ],
    sizes: ["2-3Y", "3-4Y", "4-5Y", "5-6Y", "6-7Y", "7-8Y"],
    colors: ["Princess Pink", "Sky Blue", "Purple Sparkle"],
    rating: 4.7,
    reviews: 189,
    inStock: true,
    fabric: "Tulle & Cotton"
  },

  // BABIES' COLLECTION (8 items)
  {
    id: "b1",
    name: "Traditional Dhoti Kurta Set",
    price: 1499,
    originalPrice: 1999,
    category: "babies",
    subcategory: "Ethnic Wear",
    description: "Adorable traditional dhoti kurta set for baby boys. Perfect for naming ceremonies and festive occasions.",
    images: [
      "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800"
    ],
    sizes: ["0-6M", "6-12M", "12-18M", "18-24M"],
    colors: ["White & Gold", "Cream & Red", "Ivory & Blue"],
    rating: 4.8,
    reviews: 234,
    inStock: true,
    isBestSeller: true,
    fabric: "Soft Cotton"
  },
  {
    id: "b2",
    name: "Baby Girl Lehenga",
    price: 1999,
    originalPrice: 2499,
    category: "babies",
    subcategory: "Ethnic Wear",
    description: "Tiny lehenga set for baby girls. Features soft comfortable fabric with beautiful embellishments.",
    images: [
      "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800"
    ],
    sizes: ["6-12M", "12-18M", "18-24M", "2-3Y"],
    colors: ["Pink", "Peach", "Red"],
    rating: 4.9,
    reviews: 167,
    inStock: true,
    fabric: "Soft Silk Blend"
  },
  {
    id: "b3",
    name: "Organic Cotton Romper",
    price: 899,
    category: "babies",
    subcategory: "Rompers",
    description: "Super soft organic cotton romper with cute animal prints. Gentle on baby's sensitive skin.",
    images: [
      "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800"
    ],
    sizes: ["0-3M", "3-6M", "6-9M", "9-12M"],
    colors: ["Teddy Print", "Bunny Print", "Elephant Print"],
    rating: 4.7,
    reviews: 312,
    inStock: true,
    fabric: "100% Organic Cotton"
  },
  {
    id: "b4",
    name: "Floral Frock with Bloomers",
    price: 1299,
    category: "babies",
    subcategory: "Dresses",
    description: "Delicate floral frock with matching bloomers. Soft, comfortable, and perfect for photoshoots.",
    images: [
      "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800"
    ],
    sizes: ["3-6M", "6-12M", "12-18M", "18-24M"],
    colors: ["Rose Garden", "Daisy Yellow", "Lavender Fields"],
    rating: 4.8,
    reviews: 145,
    inStock: true,
    isNew: true,
    fabric: "Cotton Voile"
  },
  {
    id: "b5",
    name: "Knitted Sweater Set",
    price: 1599,
    originalPrice: 1999,
    category: "babies",
    subcategory: "Winter Wear",
    description: "Cozy knitted sweater set with matching pants and cap. Perfect for keeping your little one warm.",
    images: [
      "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800"
    ],
    sizes: ["0-6M", "6-12M", "12-18M", "18-24M"],
    colors: ["Baby Pink", "Baby Blue", "Cream"],
    rating: 4.6,
    reviews: 89,
    inStock: true,
    fabric: "Soft Wool Blend"
  },
  {
    id: "b6",
    name: "Party Frock with Headband",
    price: 1799,
    category: "babies",
    subcategory: "Dresses",
    description: "Gorgeous party frock with matching headband. Features tulle layers and satin ribbons.",
    images: [
      "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800"
    ],
    sizes: ["6-12M", "12-18M", "18-24M", "2-3Y"],
    colors: ["Champagne", "Blush Pink", "Mint"],
    rating: 4.9,
    reviews: 78,
    inStock: true,
    isBestSeller: true,
    fabric: "Satin & Tulle"
  },
  {
    id: "b7",
    name: "Onesie Gift Set (3 Pack)",
    price: 1499,
    category: "babies",
    subcategory: "Onesies",
    description: "Set of 3 adorable onesies with snap buttons. Soft, breathable fabric perfect for everyday wear.",
    images: [
      "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800"
    ],
    sizes: ["Newborn", "0-3M", "3-6M", "6-9M"],
    colors: ["Pastel Mix", "Neutral Mix", "Pink Mix"],
    rating: 4.5,
    reviews: 256,
    inStock: true,
    fabric: "Interlock Cotton"
  },
  {
    id: "b8",
    name: "Angarkha Style Dress",
    price: 1399,
    category: "babies",
    subcategory: "Ethnic Wear",
    description: "Traditional Angarkha style dress with beautiful prints. Comfortable wrap design for easy dressing.",
    images: [
      "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800"
    ],
    sizes: ["0-6M", "6-12M", "12-18M", "18-24M"],
    colors: ["Yellow Ikat", "Blue Bandhani", "Pink Block Print"],
    rating: 4.7,
    reviews: 112,
    inStock: true,
    isNew: true,
    fabric: "Soft Cotton"
  }
];

export const categories = [
  { id: 'women', name: 'Women', description: 'Elegant collection for the modern woman' },
  { id: 'girls', name: 'Girls', description: 'Adorable styles for young fashionistas' },
  { id: 'babies', name: 'Babies', description: 'Gentle fabrics for your little ones' }
];

export const subcategories = {
  women: ['Sarees', 'Kurtas', 'Lehengas', 'Dresses', 'Suits', 'Gowns', 'Tops'],
  girls: ['Ethnic Wear', 'Dresses', 'Western Wear'],
  babies: ['Ethnic Wear', 'Rompers', 'Dresses', 'Winter Wear', 'Onesies']
};

export const getProductById = (id: string): Product | undefined => {
  return products.find(p => p.id === id);
};

export const getProductsByCategory = (category: string): Product[] => {
  return products.filter(p => p.category === category);
};

export const getBestSellers = (): Product[] => {
  return products.filter(p => p.isBestSeller);
};

export const getNewArrivals = (): Product[] => {
  return products.filter(p => p.isNew);
};

export const filterProducts = (
  category?: string,
  subcategory?: string,
  minPrice?: number,
  maxPrice?: number
): Product[] => {
  return products.filter(p => {
    if (category && p.category !== category) return false;
    if (subcategory && p.subcategory !== subcategory) return false;
    if (minPrice && p.price < minPrice) return false;
    if (maxPrice && p.price > maxPrice) return false;
    return true;
  });
};
