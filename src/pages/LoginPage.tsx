import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import SEO from '@/components/SEO';
import { validateEmail } from '@/lib/authValidation';
import { authService } from '@/services/authService';

const LoginPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const getInputClassName = (field: string) =>
    errors[field] ? 'border-destructive focus-visible:ring-destructive' : '';

  const validateForm = () => {
    const validationErrors: Record<string, string> = {};

    const emailError = validateEmail(formData.email);
    if (emailError) {
      validationErrors.email = emailError;
    }

    if (!formData.password.trim()) {
      validationErrors.password = 'Password is required';
    }

    setErrors(validationErrors);
    return Object.keys(validationErrors).length === 0;
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));

    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error('Please fix validation errors before submitting');
      return;
    }

    setLoading(true);

    const { email, password } = formData;

    try {
      await authService.signInWithPassword(email, password);

      toast.success('Login successful!', {
        description: 'Welcome back!',
      });
      navigate('/');
    } catch (error: any) {
      console.error('Login error:', error);
      toast.error('Login failed', {
        description: error.message || 'Invalid email or password',
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container mx-auto flex items-center justify-center min-h-screen">
      <SEO
        title="Login | Mahamitra Boutique"
        description="Log in to your Mahamitra Boutique account to track orders, manage your wishlist, and checkout faster."
      />
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">Log In</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={formData.email}
                className={getInputClassName('email')}
                onChange={e => handleInputChange('email', e.target.value)}
                required
              />
              {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={formData.password}
                className={getInputClassName('password')}
                onChange={e => handleInputChange('password', e.target.value)}
                required
              />
              {errors.password ? (
                <p className="text-xs text-destructive">{errors.password}</p>
              ) : (
                <p className="text-xs text-muted-foreground">Password is required</p>
              )}
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Logging in...' : 'Log In'}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm">
            Don't have an account?{' '}
            <Link to="/signup" className="underline hover:text-primary">
              Sign up
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginPage;