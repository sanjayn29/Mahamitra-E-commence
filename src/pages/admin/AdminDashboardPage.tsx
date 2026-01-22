import { Link, useNavigate } from 'react-router-dom';
import { Package, ShoppingCart, DollarSign, Users, TrendingUp, LogOut, Plus, Edit, Trash2 } from 'lucide-react';
import { useAdmin } from '@/context/AdminContext';
import { Button } from '@/components/ui/button';
import { products } from '@/data/products';

const AdminDashboardPage = () => {
  const { isLoggedIn, logout } = useAdmin();
  const navigate = useNavigate();

  if (!isLoggedIn) {
    navigate('/admin');
    return null;
  }

  const stats = [
    { label: 'Total Revenue', value: '₹12,45,890', icon: DollarSign, change: '+12%' },
    { label: 'Total Orders', value: '1,234', icon: ShoppingCart, change: '+8%' },
    { label: 'Total Products', value: products.length.toString(), icon: Package, change: '+3' },
    { label: 'Customers', value: '5,678', icon: Users, change: '+15%' },
  ];

  const recentOrders = [
    { id: 'MM12345678', customer: 'Priya Sharma', amount: 4999, status: 'Delivered' },
    { id: 'MM12345679', customer: 'Anjali Patel', amount: 12999, status: 'Processing' },
    { id: 'MM12345680', customer: 'Meera Gupta', amount: 2499, status: 'Shipped' },
    { id: 'MM12345681', customer: 'Kavita Singh', amount: 7999, status: 'Pending' },
  ];

  return (
    <div className="min-h-screen bg-muted">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="font-serif text-xl font-semibold">Mahamitra Admin</Link>
          <Button variant="ghost" onClick={() => { logout(); navigate('/admin'); }}>
            <LogOut size={18} className="mr-2" /> Logout
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, i) => (
            <div key={i} className="bg-card rounded-xl shadow-luxe p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-muted-foreground font-sans text-sm">{stat.label}</p>
                  <p className="font-serif text-2xl font-semibold mt-1">{stat.value}</p>
                </div>
                <div className="w-10 h-10 gradient-primary rounded-lg flex items-center justify-center">
                  <stat.icon size={20} className="text-white" />
                </div>
              </div>
              <p className="text-green-600 text-sm font-sans mt-2 flex items-center gap-1">
                <TrendingUp size={14} /> {stat.change}
              </p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Orders */}
          <div className="bg-card rounded-xl shadow-luxe p-6">
            <h2 className="font-serif text-xl font-semibold mb-4">Recent Orders</h2>
            <div className="space-y-3">
              {recentOrders.map((order) => (
                <div key={order.id} className="flex justify-between items-center p-3 bg-muted rounded-lg">
                  <div>
                    <p className="font-sans font-medium text-sm">{order.customer}</p>
                    <p className="text-xs text-muted-foreground">{order.id}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-sans font-medium text-sm">₹{order.amount.toLocaleString()}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      order.status === 'Delivered' ? 'bg-green-100 text-green-700' :
                      order.status === 'Shipped' ? 'bg-blue-100 text-blue-700' :
                      order.status === 'Processing' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>{order.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Products */}
          <div className="bg-card rounded-xl shadow-luxe p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-serif text-xl font-semibold">Products</h2>
              <Button size="sm" className="gradient-primary text-primary-foreground">
                <Plus size={16} className="mr-1" /> Add
              </Button>
            </div>
            <div className="space-y-3">
              {products.slice(0, 4).map((product) => (
                <div key={product.id} className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                  <img src={product.images[0]} alt={product.name} className="w-12 h-14 object-cover rounded" />
                  <div className="flex-1 min-w-0">
                    <p className="font-sans font-medium text-sm line-clamp-1">{product.name}</p>
                    <p className="text-xs text-muted-foreground">₹{product.price.toLocaleString()}</p>
                  </div>
                  <div className="flex gap-2">
                    <button className="p-1.5 hover:bg-background rounded"><Edit size={14} /></button>
                    <button className="p-1.5 hover:bg-background rounded text-destructive"><Trash2 size={14} /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
