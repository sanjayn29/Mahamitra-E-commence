import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SlidersHorizontal, Grid, List, X, Loader2 } from 'lucide-react';
import MainLayout from '@/layouts/MainLayout';
import ProductCard from '@/components/ProductCard';
import { Button } from '@/components/ui/button';
import { useProducts, useProductsByCategory } from '@/hooks/useProducts';
import { fetchAllProducts, fetchProductsByCategory, EnhancedProduct } from '@/services/productService';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import SEO from '@/components/SEO';

const ShopPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState('featured');
  const [priceRange, setPriceRange] = useState([0, 30000]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [products, setProducts] = useState<EnhancedProduct[]>([]);
  const [loading, setLoading] = useState(true);

  const selectedCategory = searchParams.get('category') as 'women' | 'girls' | 'babies' | null;
  const searchQuery = searchParams.get('search') || '';

  // Fetch products based on category selection
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        let fetchedProducts: EnhancedProduct[] = [];
        
        if (selectedCategory) {
          // Fetch products for specific category
          fetchedProducts = await fetchProductsByCategory(selectedCategory);
        } else {
          // Fetch all products for shop page
          fetchedProducts = await fetchAllProducts();
        }
        
        setProducts(fetchedProducts);
      } catch (error) {
        console.error('Error fetching products:', error);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [selectedCategory]);

  const filteredProducts = useMemo(() => {
    let result = [...products];

    // Filter by search query (name, ID, material, category)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.productId.toLowerCase().includes(query) ||
          p.id.toLowerCase().includes(query) ||
          p.material.toLowerCase().includes(query) ||
          p.category.toLowerCase().includes(query) ||
          p.subcategory.toLowerCase().includes(query)
      );
    }

    // Filter by price range
    result = result.filter(
      (p) => p.price >= priceRange[0] && p.price <= priceRange[1]
    );

    // Sort products
    switch (sortBy) {
      case 'price-low':
        result.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        result.sort((a, b) => b.price - a.price);
        break;
      case 'rating':
        // Skip sort by rating since we removed fake ratings
        break;
      case 'newest':
        result.sort((a, b) => {
          const dateA = new Date(a.created_at || '').getTime();
          const dateB = new Date(b.created_at || '').getTime();
          return dateB - dateA;
        });
        break;
      case 'name':
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      default:
        // Featured - keep original order or sort by availability
        result = result.filter((p) => p.inStock).concat(result.filter((p) => !p.inStock));
    }

    return result;
  }, [products, priceRange, sortBy, searchQuery]);

  const handleCategoryChange = (category: string) => {
    if (category === selectedCategory) {
      searchParams.delete('category');
    } else {
      searchParams.set('category', category);
    }
    setSearchParams(searchParams);
  };

  const clearFilters = () => {
    setSearchParams({});
    setPriceRange([0, 30000]);
    setSortBy('featured');
  };

  // Categories for filtering
  const categories = [
    { id: 'women', name: 'Women', description: 'Elegant sarees & traditional wear' },
    { id: 'girls', name: 'Girls', description: 'Stylish outfits for young ladies' },
    { id: 'babies', name: 'Babies', description: 'Adorable clothing for little ones' }
  ];

  const activeFiltersCount =
    (selectedCategory ? 1 : 0) +
    (priceRange[0] > 0 || priceRange[1] < 30000 ? 1 : 0) +
    (searchQuery ? 1 : 0);

  const FilterContent = () => (
    <div className="space-y-6">
      {/* Categories */}
      <div>
        <h3 className="font-serif text-lg font-medium mb-4">Categories</h3>
        <div className="space-y-3">
          {categories.map((category) => (
            <div key={category.id} className="flex items-center gap-3">
              <Checkbox
                id={category.id}
                checked={selectedCategory === category.id}
                onCheckedChange={() => handleCategoryChange(category.id)}
              />
              <label
                htmlFor={category.id}
                className="font-sans text-sm cursor-pointer"
              >
                {category.name}
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div>
        <h3 className="font-serif text-lg font-medium mb-4">Price Range</h3>
        <div className="px-2">
          <Slider
            value={priceRange}
            onValueChange={setPriceRange}
            min={0}
            max={30000}
            step={500}
            className="mb-4"
          />
          <div className="flex justify-between text-sm font-sans text-muted-foreground">
            <span>₹{priceRange[0].toLocaleString()}</span>
            <span>₹{priceRange[1].toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Clear Filters */}
      {(selectedCategory || priceRange[0] > 0 || priceRange[1] < 30000) && (
        <Button
          variant="outline"
          onClick={clearFilters}
          className="w-full"
        >
          Clear All Filters
        </Button>
      )}
    </div>
  );

  return (
    <MainLayout>
      <SEO
        title="Shop Women Clothing Online & Baby Fashion | Mahamitra Boutique"
        description="Browse our complete collection of women clothing online, girls fashion dresses, and soft baby clothing store items. Find your perfect style at Mahamitra Boutique."
      />
      
      {/* Hero */}
      <section className="bg-muted py-12">
        <div className="container mx-auto px-4 text-center">
          <h1 className="font-serif text-4xl md:text-5xl font-semibold mb-4">
            {searchQuery
              ? `Search Results for "${searchQuery}"`
              : selectedCategory
              ? categories.find((c) => c.id === selectedCategory)?.name + "'s Collection"
              : 'Our Collection'}
          </h1>
          <p className="text-muted-foreground font-sans max-w-2xl mx-auto">
            {searchQuery
              ? `Found ${filteredProducts.length} ${filteredProducts.length === 1 ? 'product' : 'products'} matching your search`
              : 'Explore our curated selection of elegant apparel. From traditional to contemporary, find the perfect piece that speaks to your style.'}
          </p>
        </div>
      </section>

      <section className="py-8">
        <div className="container mx-auto px-4">
          {/* Active Filters */}
          {activeFiltersCount > 0 && (
            <div className="flex flex-wrap items-center gap-2 mb-6">
              <span className="text-sm font-sans text-muted-foreground">Active Filters:</span>
              {searchQuery && (
                <button
                  onClick={() => {
                    searchParams.delete('search');
                    setSearchParams(searchParams);
                  }}
                  className="inline-flex items-center gap-1 bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-sans"
                >
                  Search: "{searchQuery}"
                  <X size={14} />
                </button>
              )}
              {selectedCategory && (
                <button
                  onClick={() => handleCategoryChange(selectedCategory)}
                  className="inline-flex items-center gap-1 bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-sans"
                >
                  {categories.find((c) => c.id === selectedCategory)?.name}
                  <X size={14} />
                </button>
              )}
              {(priceRange[0] > 0 || priceRange[1] < 30000) && (
                <button
                  onClick={() => setPriceRange([0, 30000])}
                  className="inline-flex items-center gap-1 bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-sans"
                >
                  ₹{priceRange[0].toLocaleString()} - ₹{priceRange[1].toLocaleString()}
                  <X size={14} />
                </button>
              )}
              <Button
                onClick={clearFilters}
                variant="outline"
                size="sm"
                className="ml-2"
              >
                Clear All
              </Button>
            </div>
          )}

          {/* Toolbar */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <p className="text-sm font-sans text-muted-foreground">
              Showing {filteredProducts.length} products
            </p>

            <div className="flex items-center gap-4">
              {/* Mobile Filter Button */}
              <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" className="lg:hidden">
                    <SlidersHorizontal size={18} className="mr-2" />
                    Filters
                    {activeFiltersCount > 0 && (
                      <span className="ml-2 bg-primary text-primary-foreground w-5 h-5 rounded-full text-xs flex items-center justify-center">
                        {activeFiltersCount}
                      </span>
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-full sm:max-w-md">
                  <SheetHeader>
                    <SheetTitle className="font-serif text-2xl">Filters</SheetTitle>
                  </SheetHeader>
                  <div className="mt-6">
                    <FilterContent />
                  </div>
                </SheetContent>
              </Sheet>

              {/* Sort */}
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="featured">Featured</SelectItem>
                  <SelectItem value="newest">Newest</SelectItem>
                  <SelectItem value="name">Name A-Z</SelectItem>
                  <SelectItem value="price-low">Price: Low to High</SelectItem>
                  <SelectItem value="price-high">Price: High to Low</SelectItem>
                  <SelectItem value="rating">Highest Rated</SelectItem>
                </SelectContent>
              </Select>

              {/* View Mode */}
              <div className="hidden md:flex items-center border border-border rounded-md">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 ${viewMode === 'grid' ? 'bg-muted' : ''}`}
                >
                  <Grid size={18} />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 ${viewMode === 'list' ? 'bg-muted' : ''}`}
                >
                  <List size={18} />
                </button>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex gap-8">
            {/* Desktop Sidebar */}
            <aside className="hidden lg:block w-64 flex-shrink-0">
              <FilterContent />
            </aside>

            {/* Products Grid */}
            <div className="flex-1">
              {loading ? (
                <div className="flex justify-center items-center py-16">
                  <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-muted-foreground font-sans">Loading products...</p>
                  </div>
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="text-center py-16">
                  <h3 className="font-serif text-xl mb-2">No products found</h3>
                  <p className="text-muted-foreground font-sans mb-4">
                    {selectedCategory 
                      ? `No products available in the ${selectedCategory} category. Try adjusting your filters.`
                      : 'Try adjusting your filters to find what you\'re looking for.'
                    }
                  </p>
                  <Button onClick={clearFilters}>Clear Filters</Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <p className="text-muted-foreground font-sans text-sm">
                      Showing {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''}
                      {selectedCategory && ` in ${selectedCategory} category`}
                    </p>
                  </div>
                  <div
                    className={
                      viewMode === 'grid'
                        ? 'grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6'
                        : 'space-y-6'
                    }
                  >
                    {filteredProducts.map((product) => (
                      <ProductCard key={product.id} product={product} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </MainLayout>
  );
};

export default ShopPage;
