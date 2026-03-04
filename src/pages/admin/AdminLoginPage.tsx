import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/context/AuthContext';
import { useAdmin } from '@/context/AdminContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

const AdminLoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const { user } = useAuth();
  const { isAdmin, isLoading } = useAdmin();
  const navigate = useNavigate();

  // Redirect if already logged in as admin
  useEffect(() => {
    if (!isLoading && user && isAdmin) {
      navigate('/admin/dashboard');
    }
  }, [user, isAdmin, isLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      // Check for admin role
      if (data.user?.user_metadata?.is_admin !== true) {
        await supabase.auth.signOut();
        toast.error('Access Denied', {
          description: 'Your account does not have administrator privileges.',
        });
        return;
      }

      toast.success('Welcome Admin!', {
        description: 'Successfully logged in to admin dashboard',
      });
      navigate('/admin/dashboard');

    } catch (error: any) {
      console.error('Login error:', error);
      toast.error('Login Failed', {
        description: error.message || 'Please check your email and password.',
      });
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted p-4">
      <div className="w-full max-w-md bg-card rounded-xl shadow-luxe p-8">
        <div className="text-center mb-8">
          <h1 className="font-serif text-3xl font-semibold">Mahamitra</h1>
          <p className="text-muted-foreground font-sans text-sm mt-1">Admin Portal</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@mahamitra.com"
              className="mt-1"
              required
              disabled={isLoggingIn}
            />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="mt-1"
              required
              disabled={isLoggingIn}
            />
          </div>
          <Button type="submit" className="w-full gradient-primary text-primary-foreground" disabled={isLoggingIn}>
            {isLoggingIn ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>
        <p className="text-center text-xs text-muted-foreground mt-6">
          Admin access required. Use provided credentials.
        </p>
      </div>
    </div>
  );
};

export default AdminLoginPage;