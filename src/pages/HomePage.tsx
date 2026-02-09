import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, Truck, RefreshCw, Shield, Loader2 } from 'lucide-react';
import MainLayout from '@/layouts/MainLayout';
import ProductCard from '@/components/ProductCard';
import { Button } from '@/components/ui/button';
import { fetchAllProducts, getCategoriesWithCounts, EnhancedProduct } from '@/services/productService';

const HomePage = () => {
  const [featuredProducts, setFeaturedProducts] = useState<EnhancedProduct[]>([]);
  const [newProducts, setNewProducts] = useState<EnhancedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryCounts, setCategoryCounts] = useState({
    women: { count: 0 },
    girls: { count: 0 },
    babies: { count: 0 },
  });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [products, counts] = await Promise.all([
          fetchAllProducts(),
          getCategoriesWithCounts(),
        ]);

        // Get featured products (random selection for now)
        const shuffledProducts = [...products].sort(() => 0.5 - Math.random());
        setFeaturedProducts(shuffledProducts.slice(0, 8));

        // Get newest products (by creation date or recent products)
        const newestProducts = [...products]
          .sort((a, b) => {
            const dateA = new Date(a.created_at || '').getTime();
            const dateB = new Date(b.created_at || '').getTime();
            return dateB - dateA;
          })
          .slice(0, 8);
        setNewProducts(newestProducts);

        setCategoryCounts(counts);
      } catch (error) {
        console.error('Error fetching homepage data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const categories = [
    { 
      id: 'women', 
      name: 'Women Collection', 
      description: `Elegant sarees & traditional wear (${categoryCounts.women.count} items)` 
    },
    { 
      id: 'girls', 
      name: 'Girls Collection', 
      description: `Stylish outfits for young ladies (${categoryCounts.girls.count} items)` 
    },
    { 
      id: 'babies', 
      name: 'Baby Collection', 
      description: `Adorable clothing for little ones (${categoryCounts.babies.count} items)` 
    }
  ];

  return (
    <MainLayout>
      {/* Hero Section */}
      <section className="relative min-h-[80vh] flex items-center gradient-primary overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=1920')] bg-cover bg-center opacity-20" />
        <div className="absolute inset-0 bg-gradient-to-r from-primary/90 via-primary/70 to-secondary/50" />
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-2xl animate-fade-in">
            <span className="inline-flex items-center gap-2 bg-background/20 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm font-sans mb-6">
              <Sparkles size={16} />
              New Collection 2026
            </span>
            <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-semibold text-white leading-tight mb-6">
              Embrace Elegance,
              <br />
              Celebrate <span className="text-accent italic">You</span>
            </h1>
            <p className="text-lg md:text-xl text-white/90 font-sans mb-8 max-w-lg">
              Discover exquisite handcrafted apparel for women, girls, and babies.
              From timeless sarees to contemporary designs – crafted with love.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button
                asChild
                size="lg"
                className="bg-background text-foreground hover:bg-background/90 font-sans"
              >
                <Link to="/shop?category=women">
                  Shop Women
                  <ArrowRight size={18} className="ml-2" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                className="bg-background text-foreground hover:bg-background/90 font-sans"
              >
                <Link to="/shop?category=babies">Shop Babies
              <ArrowRight size={18} className="ml-2" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                className="bg-background text-foreground hover:bg-background/90 font-sans"
              >
                <Link to="/shop?category=girls">Shop Girls
              <ArrowRight size={18} className="ml-2" />
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute right-0 bottom-0 w-1/2 h-full hidden lg:block">
          <div className="absolute bottom-0 right-10 w-96 h-[500px] bg-[url('https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=800')] bg-cover bg-center rounded-t-full opacity-80" />
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-20 bg-muted">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12 animate-slide-up">
            <h2 className="font-serif text-3xl md:text-4xl font-semibold mb-4">
              Shop by Category
            </h2>
            <p className="text-muted-foreground font-sans max-w-2xl mx-auto">
              From elegant sarees to adorable baby outfits, find the perfect style for every generation
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {categories.map((category, index) => (
              <Link
                key={category.id}
                to={`/shop?category=${category.id}`}
                className="group relative h-96 rounded-2xl overflow-hidden shadow-luxe hover:shadow-luxe-lg transition-all duration-500 hover-lift"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div
                  className={`absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110 ${
                    category.id === 'women'
                      ? "bg-[url('https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800')]"
                      : category.id === 'girls'
                      ? "bg-[url('https://images.unsplash.com/photo-1518831959646-742c3a14ebf7?w=800')]"
                      : "bg-[url('https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800')]"
                  }`}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/30 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                  <h3 className="font-serif text-2xl font-semibold mb-2">{category.name}</h3>
                  <p className="font-sans text-white/80 text-sm mb-4">{category.description}</p>
                  <span className="inline-flex items-center gap-2 text-sm font-sans font-medium group-hover:text-primary transition-colors">
                    Explore Collection
                    <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12">
            <div>
              <h2 className="font-serif text-3xl md:text-4xl font-semibold mb-2">
                Featured Products
              </h2>
              <p className="text-muted-foreground font-sans">
                Handpicked items from our collection
              </p>
            </div>
            <Button asChild variant="outline" className="mt-4 md:mt-0">
              <Link to="/shop">
                View All
                <ArrowRight size={16} className="ml-2" />
              </Link>
            </Button>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-16">
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-muted-foreground font-sans">Loading products...</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {featuredProducts.slice(0, 4).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Promo Banner */}
      <section className="py-16 bg-gradient-to-r from-accent/10 via-primary/10 to-secondary/10">
        <div className="container mx-auto px-4 text-center">
          <div className="border-elegant rounded-2xl bg-background p-8 md:p-12 shadow-luxe max-w-4xl mx-auto">
            <span className="inline-block text-accent font-sans text-sm uppercase tracking-wider mb-4">
              Limited Time Offer
            </span>
            <h2 className="font-serif text-3xl md:text-4xl font-semibold mb-4">
              Flat Rs : 200 Off on First Order
            </h2>
            <p className="text-muted-foreground font-sans mb-6 max-w-xl mx-auto">
              Use code <span className="font-semibold text-primary">MAHAMITRA20</span> at checkout.
              Valid on orders above ₹1,999.
            </p>
            <Button asChild size="lg" className="gradient-primary text-primary-foreground">
              <Link to="/shop">Shop Now</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* New Arrivals Section */}
      <section className="py-20 bg-muted">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12">
            <div>
              <h2 className="font-serif text-3xl md:text-4xl font-semibold mb-2">
                New Arrivals
              </h2>
              <p className="text-muted-foreground font-sans">
                Fresh styles just landed
              </p>
            </div>
            <Button asChild variant="outline" className="mt-4 md:mt-0">
              <Link to="/shop">
                View All
                <ArrowRight size={16} className="ml-2" />
              </Link>
            </Button>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-16">
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-muted-foreground font-sans">Loading new arrivals...</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {newProducts.slice(0, 4).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 border-t border-border">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: Truck,
                title: 'Free Shipping',
                description: 'On orders above ₹2,999',
              },
              {
                icon: RefreshCw,
                title: 'Easy Returns',
                description: '7-day hassle-free returns',
              },
              {
                icon: Shield,
                title: 'Secure Payment',
                description: '100% secure transactions',
              },
              {
                icon: Sparkles,
                title: 'Premium Quality',
                description: 'Handpicked fabrics & designs',
              },
            ].map((feature, index) => (
              <div
                key={index}
                className="text-center p-6 rounded-xl hover:bg-muted transition-colors"
              >
                <div className="w-14 h-14 rounded-full gradient-primary flex items-center justify-center mx-auto mb-4">
                  <feature.icon size={24} className="text-white" />
                </div>
                <h3 className="font-serif text-lg font-medium mb-2">{feature.title}</h3>
                <p className="text-muted-foreground font-sans text-sm">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Instagram Section */}
      <section className="py-16 bg-muted">
        <div className="container mx-auto px-4 text-center">
          <h2 className="font-serif text-3xl md:text-4xl font-semibold mb-4">
            Follow Us on Instagram
          </h2>
          <p className="text-muted-foreground font-sans mb-8">
            @mahamitraboutique | Join our community of elegant women
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {[1, 2, 3, 4, 5, 6].map((_, index) => (
              <a
                key={index}
                href="#"
                className="aspect-square rounded-lg overflow-hidden group"
              >
                <img
                  src={`https://images.unsplash.com/photo-${
                    ['1610030469983-98e550d6193c', '1583391733956-3750e0ff4e8b', '1518831959646-742c3a14ebf7', '1522771739844-6a9f6d5f14af', '1572804013309-59a88b7e92f1', '1594736797933-d0501ba2fe65'][index]
                  }?w=300`}
                  alt={`Instagram ${index + 1}`}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
              </a>
            ))}
          </div>
        </div>
      </section>
    </MainLayout>
  );
};

export default HomePage;
