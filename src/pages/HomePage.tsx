import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Sparkles,
  Truck,
  RefreshCw,
  Shield,
  Loader2,
  Star,
  Clock,
  Tag,
  Heart,
  ShoppingBag,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Zap,
  Gift,
  Crown,
  BadgePercent,
} from 'lucide-react';
import MainLayout from '@/layouts/MainLayout';
import ProductCard from '@/components/ProductCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  fetchAllProducts,
  fetchProductsByCategory,
  getCategoriesWithCounts,
  EnhancedProduct,
} from '@/services/productService';

/* ─── Animated Counter Widget ─── */
const AnimatedCounter = ({ end, label, suffix = '' }: { end: number; label: string; suffix?: string }) => {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const counted = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !counted.current) {
          counted.current = true;
          let start = 0;
          const duration = 2000;
          const step = Math.ceil(end / (duration / 16));
          const timer = setInterval(() => {
            start += step;
            if (start >= end) {
              setCount(end);
              clearInterval(timer);
            } else {
              setCount(start);
            }
          }, 16);
        }
      },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [end]);

  return (
    <div ref={ref} className="text-center">
      <p className="font-serif text-3xl md:text-4xl font-bold text-white">
        {count.toLocaleString()}{suffix}
      </p>
      <p className="text-white/70 font-sans text-sm mt-1">{label}</p>
    </div>
  );
};

/* ─── Scrollable Product Row ─── */
const ProductScrollRow = ({ products, loading }: { products: EnhancedProduct[]; loading: boolean }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const scroll = (dir: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const amount = 320;
    scrollRef.current.scrollBy({ left: dir === 'left' ? -amount : amount, behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-16">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground font-sans">Loading products...</p>
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <p className="text-center text-muted-foreground py-12 font-sans">
        No products available yet. Check back soon!
      </p>
    );
  }

  return (
    <div className="relative group/scroll">
      <button
        onClick={() => scroll('left')}
        className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-background/90 backdrop-blur-sm shadow-lg rounded-full p-2 opacity-0 group-hover/scroll:opacity-100 transition-opacity hover:bg-background hidden md:flex"
      >
        <ChevronLeft size={20} />
      </button>
      <div
        ref={scrollRef}
        className="flex gap-5 overflow-x-auto scroll-smooth pb-4 snap-x snap-mandatory scrollbar-hide"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {products.map((product) => (
          <div key={product.id} className="min-w-[260px] max-w-[260px] snap-start flex-shrink-0">
            <ProductCard product={product} />
          </div>
        ))}
      </div>
      <button
        onClick={() => scroll('right')}
        className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-background/90 backdrop-blur-sm shadow-lg rounded-full p-2 opacity-0 group-hover/scroll:opacity-100 transition-opacity hover:bg-background hidden md:flex"
      >
        <ChevronRight size={20} />
      </button>
    </div>
  );
};

/* ─── Section Header ─── */
const SectionHeader = ({
  icon: Icon,
  badge,
  title,
  subtitle,
  action,
}: {
  icon?: React.ElementType;
  badge?: string;
  title: string;
  subtitle: string;
  action?: React.ReactNode;
}) => (
  <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
    <div>
      {badge && (
        <span className="inline-flex items-center gap-1.5 text-xs font-sans font-semibold uppercase tracking-widest text-primary mb-2">
          {Icon && <Icon size={14} />}
          {badge}
        </span>
      )}
      <h2 className="font-serif text-3xl md:text-4xl font-semibold">{title}</h2>
      <p className="text-muted-foreground font-sans mt-1">{subtitle}</p>
    </div>
    {action}
  </div>
);

/* ═══════════════════════════════════════════
   HOME PAGE
   ═══════════════════════════════════════════ */
const HomePage = () => {
  const [allProducts, setAllProducts] = useState<EnhancedProduct[]>([]);
  const [womenProducts, setWomenProducts] = useState<EnhancedProduct[]>([]);
  const [girlsProducts, setGirlsProducts] = useState<EnhancedProduct[]>([]);
  const [babiesProducts, setBabiesProducts] = useState<EnhancedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'women' | 'girls' | 'babies'>('all');
  const [categoryCounts, setCategoryCounts] = useState({
    women: { count: 0 },
    girls: { count: 0 },
    babies: { count: 0 },
  });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [products, women, girls, babies, counts] = await Promise.all([
          fetchAllProducts(),
          fetchProductsByCategory('women'),
          fetchProductsByCategory('girls'),
          fetchProductsByCategory('babies'),
          getCategoriesWithCounts(),
        ]);
        setAllProducts(products);
        setWomenProducts(women);
        setGirlsProducts(girls);
        setBabiesProducts(babies);
        setCategoryCounts(counts);
      } catch (error) {
        console.error('Error fetching homepage data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Derived product sets (all from real DB data)
  const featuredProducts = [...allProducts].sort(() => 0.5 - Math.random()).slice(0, 12);
  const newArrivals = [...allProducts]
    .sort((a, b) => new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime())
    .slice(0, 12);
  const bestDeals = [...allProducts]
    .filter((p) => p.cost && p.cost !== p.price)
    .slice(0, 12);
  const totalProducts =
    categoryCounts.women.count + categoryCounts.girls.count + categoryCounts.babies.count;

  const tabbedProducts =
    activeTab === 'women'
      ? womenProducts
      : activeTab === 'girls'
      ? girlsProducts
      : activeTab === 'babies'
      ? babiesProducts
      : allProducts;

  const categories = [
    {
      id: 'women' as const,
      name: 'Women',
      fullName: 'Women Collection',
      description: `Elegant sarees & traditional wear`,
      count: categoryCounts.women.count,
      gradient: 'from-rose-500 to-pink-600',
      icon: Crown,
    },
    {
      id: 'girls' as const,
      name: 'Girls',
      fullName: 'Girls Collection',
      description: `Stylish outfits for young ladies`,
      count: categoryCounts.girls.count,
      gradient: 'from-violet-500 to-purple-600',
      icon: Star,
    },
    {
      id: 'babies' as const,
      name: 'Babies',
      fullName: 'Baby Collection',
      description: `Adorable clothing for little ones`,
      count: categoryCounts.babies.count,
      gradient: 'from-amber-400 to-orange-500',
      icon: Heart,
    },
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

      {/* ══════════════ TRUST BAR ══════════════ */}
      <section className="py-6 bg-background border-b border-border">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: Truck, title: 'Free Shipping', desc: 'Orders above ₹2,999' },
              { icon: RefreshCw, title: 'Easy Returns', desc: '7-day hassle-free' },
              { icon: Shield, title: 'Secure Payment', desc: '100% secure checkout' },
              { icon: Sparkles, title: 'Premium Quality', desc: 'Handpicked fabrics' },
            ].map((f, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors">
                <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center flex-shrink-0">
                  <f.icon size={18} className="text-white" />
                </div>
                <div>
                  <p className="font-sans text-sm font-semibold">{f.title}</p>
                  <p className="font-sans text-xs text-muted-foreground">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════ CATEGORY CARDS ══════════════ */}
      <section className="py-16 bg-muted/50">
        <div className="container mx-auto px-4">
          <SectionHeader
            icon={Crown}
            badge="Collections"
            title="Shop by Category"
            subtitle="Find the perfect style for every generation"
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {categories.map((cat) => {
              const catProducts =
                cat.id === 'women' ? womenProducts : cat.id === 'girls' ? girlsProducts : babiesProducts;
              const previewImg = catProducts[0]?.images[0] || catProducts[0]?.image;

              return (
                <Link
                  key={cat.id}
                  to={`/shop?category=${cat.id}`}
                  className="group relative h-[420px] rounded-2xl overflow-hidden shadow-luxe hover:shadow-luxe-lg transition-all duration-500 hover-lift"
                >
                  {previewImg ? (
                    <img
                      src={previewImg}
                      alt={cat.fullName}
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                  ) : (
                    <div className={`absolute inset-0 bg-gradient-to-br ${cat.gradient}`} />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

                  {/* Count badge */}
                  <div className="absolute top-4 right-4">
                    <Badge className="bg-white/20 backdrop-blur-sm text-white border-0">
                      {cat.count} items
                    </Badge>
                  </div>

                  <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                    <div className="flex items-center gap-2 mb-2">
                      <cat.icon size={18} />
                      <span className="font-sans text-sm uppercase tracking-widest opacity-80">
                        {cat.name}
                      </span>
                    </div>
                    <h3 className="font-serif text-2xl font-semibold mb-2">{cat.fullName}</h3>
                    <p className="font-sans text-white/70 text-sm mb-4">{cat.description}</p>
                    <span className="inline-flex items-center gap-2 text-sm font-sans font-medium group-hover:gap-3 transition-all">
                      Explore Collection
                      <ArrowRight size={16} />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ══════════════ FEATURED – TABBED ══════════════ */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <SectionHeader
            icon={TrendingUp}
            badge="Trending Now"
            title="Featured Products"
            subtitle="Handpicked items loved by our customers"
            action={
              <Button asChild variant="outline" className="mt-4 md:mt-0">
                <Link to="/shop">
                  View All <ArrowRight size={16} className="ml-2" />
                </Link>
              </Button>
            }
          />

          {/* Tabs */}
          <div className="flex flex-wrap gap-2 mb-8">
            {(['all', 'women', 'girls', 'babies'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-5 py-2 rounded-full text-sm font-sans font-medium transition-all ${
                  activeTab === tab
                    ? 'gradient-primary text-white shadow-md'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                {tab === 'all' ? 'All' : tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {tabbedProducts.slice(0, 8).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}

          {!loading && tabbedProducts.length > 8 && (
            <div className="text-center mt-10">
              <Button asChild size="lg" variant="outline">
                <Link to="/shop">
                  See All {tabbedProducts.length} Products
                  <ArrowRight size={16} className="ml-2" />
                </Link>
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* ══════════════ PROMO BANNER ══════════════ */}
      <section className="py-0">
        <div className="relative overflow-hidden bg-gradient-to-r from-primary via-secondary to-primary">
          <div className="absolute inset-0 opacity-10"
            style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '30px 30px' }}
          />
          <div className="container mx-auto px-4 py-12 md:py-16 relative z-10">
            <div className="flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="text-center md:text-left">
                <div className="flex items-center gap-2 justify-center md:justify-start mb-3">
                  <BadgePercent size={20} className="text-yellow-300" />
                  <span className="text-yellow-300 font-sans text-sm font-semibold uppercase tracking-wider">
                    Limited Time Offer
                  </span>
                </div>
                <h2 className="font-serif text-3xl md:text-4xl font-bold text-white mb-3">
                  Flat ₹200 Off on First Order
                </h2>
                <p className="text-white/80 font-sans max-w-md">
                  Use code{' '}
                  <span className="inline-block bg-white/20 backdrop-blur-sm px-3 py-1 rounded-md font-bold text-white">
                    MAHAMITRA20
                  </span>{' '}
                  at checkout. Valid on orders above ₹1,999.
                </p>
              </div>
              <Button asChild size="lg" className="bg-white text-primary hover:bg-white/90 font-sans shadow-xl px-10 text-base">
                <Link to="/shop">
                  <Gift size={18} className="mr-2" />
                  Claim Offer
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════ NEW ARRIVALS (scrollable) ══════════════ */}
      <section className="py-16 bg-muted/50">
        <div className="container mx-auto px-4">
          <SectionHeader
            icon={Zap}
            badge="Just Landed"
            title="New Arrivals"
            subtitle="The freshest styles added to our collection"
            action={
              <Button asChild variant="outline" className="mt-4 md:mt-0">
                <Link to="/shop">
                  View All <ArrowRight size={16} className="ml-2" />
                </Link>
              </Button>
            }
          />
          <ProductScrollRow products={newArrivals} loading={loading} />
        </div>
      </section>

      {/* ══════════════ DEALS / BEST VALUE ══════════════ */}
      {bestDeals.length > 0 && (
        <section className="py-16">
          <div className="container mx-auto px-4">
            <SectionHeader
              icon={Tag}
              badge="Best Value"
              title="Deals & Offers"
              subtitle="Great styles at amazing prices"
              action={
                <Button asChild variant="outline" className="mt-4 md:mt-0">
                  <Link to="/shop">
                    View All <ArrowRight size={16} className="ml-2" />
                  </Link>
                </Button>
              }
            />
            <ProductScrollRow products={bestDeals} loading={loading} />
          </div>
        </section>
      )}

      {/* ══════════════ PER-CATEGORY SHOWCASES ══════════════ */}
      {([
        { label: 'Women', products: womenProducts, cat: 'women' },
        { label: 'Girls', products: girlsProducts, cat: 'girls' },
        { label: 'Babies', products: babiesProducts, cat: 'babies' },
      ] as const).map(
        (sec) =>
          sec.products.length > 0 && (
            <section key={sec.cat} className="py-16 even:bg-muted/50">
              <div className="container mx-auto px-4">
                <SectionHeader
                  icon={ShoppingBag}
                  badge={`${sec.label} Collection`}
                  title={`Top ${sec.label} Picks`}
                  subtitle={`Explore our best ${sec.label.toLowerCase()} products`}
                  action={
                    <Button asChild variant="outline" className="mt-4 md:mt-0">
                      <Link to={`/shop?category=${sec.cat}`}>
                        View All <ArrowRight size={16} className="ml-2" />
                      </Link>
                    </Button>
                  }
                />
                <ProductScrollRow products={sec.products} loading={loading} />
              </div>
            </section>
          )
      )}

      {/* ══════════════ WHY CHOOSE US ══════════════ */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <span className="inline-flex items-center gap-1.5 text-xs font-sans font-semibold uppercase tracking-widest text-primary mb-2">
              <Shield size={14} />
              Why Mahamitra
            </span>
            <h2 className="font-serif text-3xl md:text-4xl font-semibold">
              The Mahamitra Promise
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: Truck,
                title: 'Free Shipping',
                description: 'Free delivery on orders above ₹2,999 across India',
                color: 'from-blue-500 to-cyan-500',
              },
              {
                icon: RefreshCw,
                title: 'Easy Returns',
                description: '7-day hassle-free return & exchange policy',
                color: 'from-green-500 to-emerald-500',
              },
              {
                icon: Shield,
                title: 'Secure Payment',
                description: 'Razorpay-powered 100% secure transactions',
                color: 'from-violet-500 to-purple-500',
              },
              {
                icon: Sparkles,
                title: 'Premium Quality',
                description: 'Handpicked fabrics & meticulously crafted designs',
                color: 'from-amber-500 to-orange-500',
              },
            ].map((feature, index) => (
              <div
                key={index}
                className="relative group text-center p-8 rounded-2xl bg-muted/50 border border-border/50 hover:border-primary/20 hover:shadow-luxe transition-all duration-300"
              >
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center mx-auto mb-5 group-hover:scale-110 transition-transform`}>
                  <feature.icon size={24} className="text-white" />
                </div>
                <h3 className="font-serif text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground font-sans text-sm leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════ INSTAGRAM / CTA ══════════════ */}
      <section className="py-16 bg-muted/50">
        <div className="container mx-auto px-4 text-center">
          <span className="inline-flex items-center gap-1.5 text-xs font-sans font-semibold uppercase tracking-widest text-primary mb-2">
            <Heart size={14} />
            Community
          </span>
          <h2 className="font-serif text-3xl md:text-4xl font-semibold mb-3">
            Follow Us on Instagram
          </h2>
          <p className="text-muted-foreground font-sans mb-10 max-w-lg mx-auto">
            @mahamitraboutique – Join our community and get styling inspiration
          </p>

          {/* Use real product images from the store */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {allProducts.slice(0, 6).map((product, index) => (
              <Link
                key={product.id || index}
                to={`/product/${product.id}`}
                className="aspect-square rounded-xl overflow-hidden group relative"
              >
                <img
                  src={product.images[0] || product.image}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                  <ShoppingBag
                    size={24}
                    className="text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════ NEWSLETTER CTA ══════════════ */}
      <section className="py-16 bg-gradient-to-br from-primary/5 via-secondary/5 to-primary/5">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center">
            <Gift size={32} className="mx-auto text-primary mb-4" />
            <h2 className="font-serif text-3xl md:text-4xl font-semibold mb-3">
              Don't Miss Out
            </h2>
            <p className="text-muted-foreground font-sans mb-8">
              Be the first to know about new arrivals, exclusive offers, and styling tips.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button asChild size="lg" className="gradient-primary text-white font-sans px-10">
                <Link to="/shop">Start Shopping</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="font-sans px-10">
                <Link to="/about">Learn About Us</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </MainLayout>
  );
};

export default HomePage;
