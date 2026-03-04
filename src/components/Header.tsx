import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useSearchParams, useNavigate } from 'react-router-dom';
import { Menu, X, User, Heart, Search, LogOut, Package, ShoppingCart } from 'lucide-react';
import logoImg from '@/assert/logo.png';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { fetchAllProducts, EnhancedProduct } from '@/services/productService';
import CartSidebar from '@/components/CartSidebar';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchResults, setSearchResults] = useState<EnhancedProduct[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [allProducts, setAllProducts] = useState<EnhancedProduct[]>([]);
  const searchRef = useRef<HTMLDivElement>(null);
  const { user, signOut } = useAuth();
  const { getCartCount, toggleCart } = useCart();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const cartCount = getCartCount();

  const navLinks = [
    { path: '/', label: 'Home' },
    { path: '/shop', label: 'Shop' },
    { path: '/shop?category=women', label: 'Women' },
    { path: '/shop?category=girls', label: 'Girls' },
    { path: '/shop?category=babies', label: 'Babies' },
    { path: '/about', label: 'About' },
    { path: '/contact', label: 'Contact' },
  ];

  // Load all products for search
  useEffect(() => {
    const loadProducts = async () => {
      try {
        const products = await fetchAllProducts();
        setAllProducts(products);
      } catch (error) {
        console.error('Error loading products for search:', error);
      }
    };
    loadProducts();
  }, []);

  // Filter products as user types
  useEffect(() => {
    if (searchQuery.trim().length > 0) {
      const query = searchQuery.toLowerCase();
      const filtered = allProducts.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.productId.toLowerCase().includes(query) ||
          p.id.toLowerCase().includes(query) ||
          p.material.toLowerCase().includes(query) ||
          p.category.toLowerCase().includes(query) ||
          p.subcategory.toLowerCase().includes(query)
      ).slice(0, 5);
      setSearchResults(filtered);
      setShowResults(true);
    } else {
      setSearchResults([]);
      setShowResults(false);
    }
  }, [searchQuery, allProducts]);

  // Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/shop?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
      setIsSearchOpen(false);
      setShowResults(false);
    }
  };

  const handleProductClick = (productId: string) => {
    navigate(`/product/${productId}`);
    setSearchQuery('');
    setIsSearchOpen(false);
    setShowResults(false);
    setIsMenuOpen(false);
  };

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    if (path.includes('?')) {
      const [basePath, queryString] = path.split('?');
      const pathParams = new URLSearchParams(queryString);
      const currentCategory = searchParams.get('category');
      const linkCategory = pathParams.get('category');
      return location.pathname === basePath && currentCategory === linkCategory;
    }
    if (path === '/shop') {
      const currentCategory = searchParams.get('category');
      return location.pathname === '/shop' && !currentCategory;
    }
    return location.pathname === path;
  };

  return (
    <>
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b border-border">
        {/* Main Header */}
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-20">
            {/* Mobile Menu Button */}
            <button
              className="lg:hidden p-2"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Toggle menu"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            {/* Logo */}
            <Link to="/" className="flex items-center gap-3">
              <img src={logoImg} alt="Mahamitra Logo" className="h-12 w-auto" />
              <span className="font-serif text-xl md:text-2xl font-semibold text-foreground tracking-wide">Mahamitra</span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-8">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`text-sm font-sans font-medium transition-colors hover:text-primary relative group ${isActive(link.path) ? 'text-primary' : 'text-foreground'
                    }`}
                >
                  {link.label}
                  <span className={`absolute -bottom-1 left-0 h-0.5 bg-primary transition-all duration-300 ${isActive(link.path) ? 'w-full' : 'w-0 group-hover:w-full'
                    }`} />
                </Link>
              ))}
            </nav>

            {/* Right Icons */}
            <div className="flex items-center gap-2 md:gap-4">
              <Button
                variant="ghost"
                size="icon"
                className="hidden md:flex"
                onClick={() => setIsSearchOpen(!isSearchOpen)}
              >
                <Search size={20} />
              </Button>
              <Button variant="ghost" size="icon" className="hidden md:flex" asChild>
                <Link to="/favorites" title="Favorites">
                  <Heart size={20} />
                </Link>
              </Button>
              <Button variant="ghost" size="icon" className="hidden md:flex" asChild>
                <Link to="/orders" title="My Orders">
                  <Package size={20} />
                </Link>
              </Button>

              {/* Cart Button with Badge */}
              <Button
                variant="ghost"
                size="icon"
                className="relative"
                onClick={toggleCart}
                title="Shopping Cart"
                aria-label={`Cart (${cartCount} items)`}
              >
                <ShoppingCart size={20} />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs font-sans font-bold w-5 h-5 rounded-full flex items-center justify-center leading-none animate-in zoom-in-50 duration-200">
                    {cartCount > 99 ? '99+' : cartCount}
                  </span>
                )}
              </Button>

              {/* User Account */}
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="relative">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.user_metadata.avatar_url || ''} alt={user.user_metadata.name || 'User'} />
                        <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                          {user.user_metadata.name?.charAt(0) || user.email?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{user.user_metadata.name}</p>
                        <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to="/profile" className="cursor-pointer">
                        My Profile
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/favorites" className="cursor-pointer">
                        <Heart size={16} className="mr-2" />
                        My Favorites
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/orders" className="cursor-pointer">
                        My Orders
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={signOut} className="cursor-pointer text-destructive">
                      <LogOut size={16} className="mr-2" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <div className="flex items-center gap-2">
                  <Link to="/login">
                    <Button variant="ghost">Log In</Button>
                  </Link>
                  <Link to="/signup">
                    <Button>Sign Up</Button>
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Search Bar */}
          {isSearchOpen && (
            <div className="py-4 border-t border-border" ref={searchRef}>
              <form onSubmit={handleSearch} className="flex gap-2">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => searchQuery && setShowResults(true)}
                    placeholder="Search by name, ID, material, or category..."
                    className="w-full px-4 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-background"
                    autoFocus
                  />

                  {/* Search Results Dropdown */}
                  {showResults && searchResults.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-background border border-border rounded-md shadow-lg z-50 max-h-96 overflow-y-auto">
                      {searchResults.map((product) => (
                        <div
                          key={product.id}
                          onClick={() => handleProductClick(product.id)}
                          className="flex items-center gap-3 p-3 hover:bg-muted cursor-pointer border-b border-border last:border-b-0"
                        >
                          <img
                            src={product.image || '/placeholder-image.jpg'}
                            alt={product.name}
                            className="w-12 h-12 object-cover rounded"
                            onError={(e) => { e.currentTarget.src = '/placeholder-image.jpg'; }}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{product.name}</p>
                            <p className="text-xs text-muted-foreground">{product.category} • {product.material}</p>
                            <p className="text-sm font-semibold text-primary">₹{product.price.toLocaleString()}</p>
                          </div>
                        </div>
                      ))}
                      {searchQuery && (
                        <button
                          type="button"
                          onClick={() => { handleSearch(new Event('submit') as any); }}
                          className="w-full p-3 text-sm text-center text-primary hover:bg-muted font-medium"
                        >
                          View all results for "{searchQuery}"
                        </button>
                      )}
                    </div>
                  )}
                </div>
                <Button type="submit" disabled={!searchQuery.trim()}>
                  Search
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsSearchOpen(false);
                    setSearchQuery('');
                    setShowResults(false);
                  }}
                >
                  <X size={16} />
                </Button>
              </form>
            </div>
          )}
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="lg:hidden absolute top-full left-0 right-0 bg-background border-b border-border animate-fade-in">
            <nav className="container mx-auto px-4 py-4">
              {/* Mobile Search */}
              <div className="mb-4 relative" ref={searchRef}>
                <form onSubmit={handleSearch} className="flex gap-2">
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onFocus={() => searchQuery && setShowResults(true)}
                      placeholder="Search products..."
                      className="w-full px-4 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-background text-sm"
                    />

                    {/* Mobile Search Results Dropdown */}
                    {showResults && searchResults.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-background border border-border rounded-md shadow-lg z-50 max-h-72 overflow-y-auto">
                        {searchResults.map((product) => (
                          <div
                            key={product.id}
                            onClick={() => handleProductClick(product.id)}
                            className="flex items-center gap-2 p-2 hover:bg-muted cursor-pointer border-b border-border last:border-b-0"
                          >
                            <img
                              src={product.image || '/placeholder-image.jpg'}
                              alt={product.name}
                              className="w-10 h-10 object-cover rounded"
                              onError={(e) => { e.currentTarget.src = '/placeholder-image.jpg'; }}
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium truncate">{product.name}</p>
                              <p className="text-xs text-muted-foreground">{product.category}</p>
                              <p className="text-xs font-semibold text-primary">₹{product.price.toLocaleString()}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <Button type="submit" size="sm" disabled={!searchQuery.trim()}>
                    <Search size={16} />
                  </Button>
                </form>
              </div>

              <div className="flex flex-col gap-4">
                {navLinks.map((link) => (
                  <Link
                    key={link.path}
                    to={link.path}
                    onClick={() => setIsMenuOpen(false)}
                    className={`text-base font-sans font-medium py-2 transition-colors ${isActive(link.path) ? 'text-primary' : 'text-foreground'
                      }`}
                  >
                    {link.label}
                  </Link>
                ))}
                <Link
                  to="/favorites"
                  onClick={() => setIsMenuOpen(false)}
                  className={`text-base font-sans font-medium py-2 transition-colors flex items-center gap-2 ${isActive('/favorites') ? 'text-primary' : 'text-foreground'
                    }`}
                >
                  <Heart size={18} /> Favorites
                </Link>
                <Link
                  to="/orders"
                  onClick={() => setIsMenuOpen(false)}
                  className={`text-base font-sans font-medium py-2 transition-colors flex items-center gap-2 ${isActive('/orders') ? 'text-primary' : 'text-foreground'
                    }`}
                >
                  <Package size={18} /> Orders
                </Link>
                {/* Cart in mobile nav */}
                <button
                  onClick={() => { setIsMenuOpen(false); toggleCart(); }}
                  className="text-base font-sans font-medium py-2 transition-colors flex items-center gap-2 text-foreground hover:text-primary text-left"
                >
                  <ShoppingCart size={18} />
                  Cart
                  {cartCount > 0 && (
                    <span className="bg-primary text-primary-foreground text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                      {cartCount}
                    </span>
                  )}
                </button>
              </div>
            </nav>
          </div>
        )}
      </header>

      {/* Cart Sidebar — rendered outside header so it overlays full page */}
      <CartSidebar />
    </>
  );
};

export default Header;
