import { Link, useNavigate } from 'react-router-dom';
import { Package, ShoppingCart, BarChart3, ListChecks, LogOut } from 'lucide-react';
import { useAdmin } from '@/context/AdminContext';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const AdminDashboardPage = () => {
  const { logout } = useAdmin();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/admin');
  };

  const adminActions = [
    {
      title: 'Add New Product',
      path: '/admin/add-product',
      icon: Package,
      variant: 'default' as const,
      primary: true,
    },
    {
      title: 'Inventory Management',
      path: '/admin/inventory',
      icon: ListChecks,
      variant: 'outline' as const,
    },
    {
      title: 'Orders',
      path: '/admin/orders',
      icon: ShoppingCart,
      variant: 'outline' as const,
    },
    {
      title: 'View Analysis',
      path: '/admin/analytics',
      icon: BarChart3,
      variant: 'outline' as const,
    },
  ];

  return (
    <div className="min-h-screen bg-muted flex flex-col">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link 
            to="/" 
            className="font-serif text-2xl font-semibold tracking-tight"
          >
            Mahamitra Admin
          </Link>

          <Button 
            variant="ghost" 
            onClick={handleLogout}
            className="text-muted-foreground hover:text-foreground"
          >
            <LogOut size={18} className="mr-2" />
            Logout
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-4xl">
          <div className="text-center mb-12">
            <h1 className="font-serif text-4xl font-bold tracking-tight mb-3">
              Admin Dashboard
            </h1>
            <p className="text-lg text-muted-foreground">
              Manage your store with quick access to key sections
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 md:gap-8">
            {adminActions.map((action) => (
              <Link 
                key={action.path} 
                to={action.path}
                className="block group"
              >
                <Button
                  variant={action.variant}
                  size="lg"
                  className={`
                    w-full h-28 text-lg font-medium transition-all
                    ${action.primary 
                      ? 'gradient-primary hover:opacity-90 text-primary-foreground shadow-lg hover:shadow-xl' 
                      : 'border-2 hover:border-primary/50 hover:bg-primary/5'}
                  `}
                >
                  <action.icon 
                    size={28} 
                    className={`mr-4 ${action.primary ? '' : 'text-primary'}`} 
                  />
                  {action.title}
                </Button>
              </Link>
            ))}
          </div>

          <div className="mt-12 text-center text-sm text-muted-foreground">
            <p>Select an option above to begin managing your store</p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboardPage;