import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Phone, MapPin, ShoppingBag, Heart, LogOut, Package, Edit2, Check, X } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import MainLayout from '@/layouts/MainLayout';
import { toast } from 'sonner';
import SEO from '@/components/SEO';

interface OrderSummary {
  total: number;
  totalSpent: number;
  recent: {
    id: string;
    product_name: string;
    product_image: string | null;
    total_amount: number;
    order_status: string;
    created_at: string;
  }[];
}

const ProfilePage = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [loading, setLoading] = useState(true);
  const [orderSummary, setOrderSummary] = useState<OrderSummary>({ total: 0, totalSpent: 0, recent: [] });
  const [favoritesCount, setFavoritesCount] = useState(0);

  // Editable fields
  const [editing, setEditing] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    setEditName(user.user_metadata?.full_name || user.user_metadata?.name || '');
    setEditPhone(user.user_metadata?.phone || '');
    fetchProfileData();
  }, [user, navigate]);

  const fetchProfileData = async () => {
    if (!user) return;
    try {
      setLoading(true);

      // Fetch orders summary & favorites count in parallel
      const [ordersRes, favoritesRes] = await Promise.all([
        supabase
          .from('orders')
          .select('id, product_name, product_image, total_amount, order_status, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('favorites')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id),
      ]);

      if (ordersRes.data) {
        const totalSpent = ordersRes.data.reduce((sum, o) => sum + (o.total_amount || 0), 0);
        setOrderSummary({
          total: ordersRes.data.length,
          totalSpent,
          recent: ordersRes.data.slice(0, 3),
        });
      }

      setFavoritesCount(favoritesRes.count || 0);
    } catch (error) {
      console.error('Error fetching profile data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateName = async () => {
    const trimmed = editName.trim();
    if (!trimmed) { toast.error('Name cannot be empty'); return; }
    try {
      const { error } = await supabase.auth.updateUser({ data: { full_name: trimmed, name: trimmed } });
      if (error) throw error;
      toast.success('Name updated successfully');
      setEditing(null);
    } catch (error: any) {
      toast.error(error.message || 'Failed to update name');
    }
  };

  const handleUpdatePhone = async () => {
    const trimmed = editPhone.trim();
    try {
      const { error } = await supabase.auth.updateUser({ data: { phone: trimmed } });
      if (error) throw error;
      toast.success('Phone updated successfully');
      setEditing(null);
    } catch (error: any) {
      toast.error(error.message || 'Failed to update phone');
    }
  };

  const handleLogout = async () => {
    await signOut();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });

  const statusColor: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    confirmed: 'bg-blue-100 text-blue-800',
    processing: 'bg-indigo-100 text-indigo-800',
    shipped: 'bg-purple-100 text-purple-800',
    delivered: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
  };

  if (!user) return null;

  const userName = user.user_metadata?.full_name || user.user_metadata?.name || 'User';
  const userEmail = user.email || '';
  const userPhone = user.user_metadata?.phone || '';
  const userAvatar = user.user_metadata?.avatar_url || '';
  const joinedDate = user.created_at ? formatDate(user.created_at) : '';

  return (
    <MainLayout>
      <SEO
        title="My Profile | Mahamitra Boutique"
        description="Manage your Mahamitra Boutique profile, view order history, and update your preferences."
      />
      <div className="container mx-auto px-4 py-8 min-h-[60vh]">
        <div className="max-w-4xl mx-auto space-y-6">

          {/* Profile Header Card */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                <Avatar className="h-24 w-24 text-2xl">
                  <AvatarImage src={userAvatar} alt={userName} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-3xl">
                    {userName.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 text-center sm:text-left">
                  <h1 className="font-serif text-2xl font-bold">{userName}</h1>
                  <p className="text-muted-foreground mt-1">{userEmail}</p>
                  {joinedDate && (
                    <p className="text-sm text-muted-foreground mt-1">Member since {joinedDate}</p>
                  )}
                </div>
                <Button variant="outline" className="text-destructive hover:text-destructive gap-2" onClick={handleLogout}>
                  <LogOut size={18} /> Logout
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="text-center">
              <CardContent className="pt-6 pb-4">
                <ShoppingBag className="mx-auto mb-2 text-primary" size={28} />
                <p className="text-2xl font-bold">{loading ? '—' : orderSummary.total}</p>
                <p className="text-xs text-muted-foreground">Total Orders</p>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="pt-6 pb-4">
                <Package className="mx-auto mb-2 text-primary" size={28} />
                <p className="text-2xl font-bold">
                  {loading ? '—' : `₹${orderSummary.totalSpent.toLocaleString()}`}
                </p>
                <p className="text-xs text-muted-foreground">Total Spent</p>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="pt-6 pb-4">
                <Heart className="mx-auto mb-2 text-primary" size={28} />
                <p className="text-2xl font-bold">{loading ? '—' : favoritesCount}</p>
                <p className="text-xs text-muted-foreground">Favorites</p>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="pt-6 pb-4">
                <MapPin className="mx-auto mb-2 text-primary" size={28} />
                <p className="text-2xl font-bold">
                  {loading ? '—' : orderSummary.recent.filter((o) => o.order_status === 'delivered').length}
                </p>
                <p className="text-xs text-muted-foreground">Delivered</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Personal Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <User size={20} /> Personal Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Name */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <User size={16} className="text-muted-foreground shrink-0" />
                    {editing === 'name' ? (
                      <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="h-8"
                        autoFocus
                        onKeyDown={(e) => { if (e.key === 'Enter') handleUpdateName(); if (e.key === 'Escape') setEditing(null); }}
                      />
                    ) : (
                      <div>
                        <p className="text-xs text-muted-foreground">Name</p>
                        <p className="font-medium truncate">{userName}</p>
                      </div>
                    )}
                  </div>
                  {editing === 'name' ? (
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleUpdateName}><Check size={16} /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditing(null)}><X size={16} /></Button>
                    </div>
                  ) : (
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditName(userName); setEditing('name'); }}>
                      <Edit2 size={14} />
                    </Button>
                  )}
                </div>

                <Separator />

                {/* Email (read-only) */}
                <div className="flex items-center gap-3">
                  <Mail size={16} className="text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Email</p>
                    <p className="font-medium">{userEmail}</p>
                  </div>
                </div>

                <Separator />

                {/* Phone */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <Phone size={16} className="text-muted-foreground shrink-0" />
                    {editing === 'phone' ? (
                      <Input
                        value={editPhone}
                        onChange={(e) => setEditPhone(e.target.value)}
                        className="h-8"
                        placeholder="Enter phone number"
                        maxLength={10}
                        autoFocus
                        onKeyDown={(e) => { if (e.key === 'Enter') handleUpdatePhone(); if (e.key === 'Escape') setEditing(null); }}
                      />
                    ) : (
                      <div>
                        <p className="text-xs text-muted-foreground">Phone</p>
                        <p className="font-medium">{userPhone || 'Not provided'}</p>
                      </div>
                    )}
                  </div>
                  {editing === 'phone' ? (
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleUpdatePhone}><Check size={16} /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditing(null)}><X size={16} /></Button>
                    </div>
                  ) : (
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditPhone(userPhone); setEditing('phone'); }}>
                      <Edit2 size={14} />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Recent Orders */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <ShoppingBag size={20} /> Recent Orders
                </CardTitle>
                <Link to="/orders">
                  <Button variant="ghost" size="sm">View All</Button>
                </Link>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin h-6 w-6 border-4 border-primary border-t-transparent rounded-full mx-auto" />
                  </div>
                ) : orderSummary.recent.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <ShoppingBag size={36} className="mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No orders yet</p>
                    <Link to="/shop">
                      <Button variant="link" size="sm" className="mt-2">Start Shopping</Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {orderSummary.recent.map((order) => (
                      <div key={order.id} className="flex items-center gap-3">
                        <img
                          src={order.product_image || '/placeholder-image.jpg'}
                          alt={order.product_name}
                          className="w-12 h-12 rounded object-cover border"
                          onError={(e) => { e.currentTarget.src = '/placeholder-image.jpg'; }}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{order.product_name}</p>
                          <p className="text-xs text-muted-foreground">{formatDate(order.created_at)}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-sm font-semibold">₹{order.total_amount.toLocaleString()}</p>
                          <Badge className={`text-[10px] px-1.5 py-0 border-0 ${statusColor[order.order_status] || statusColor.pending}`}>
                            {order.order_status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Quick Links */}
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <Link to="/orders" className="block">
                  <Button variant="outline" className="w-full gap-2 h-12">
                    <ShoppingBag size={18} /> My Orders
                  </Button>
                </Link>
                <Link to="/favorites" className="block">
                  <Button variant="outline" className="w-full gap-2 h-12">
                    <Heart size={18} /> Favorites
                  </Button>
                </Link>
                <Link to="/shop" className="block">
                  <Button variant="outline" className="w-full gap-2 h-12">
                    <Package size={18} /> Shop Now
                  </Button>
                </Link>
                <Link to="/contact" className="block">
                  <Button variant="outline" className="w-full gap-2 h-12">
                    <Mail size={18} /> Contact Us
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

        </div>
      </div>
    </MainLayout>
  );
};

export default ProfilePage;
