import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdmin } from '@/context/AdminContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

const AdminLoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useAdmin();
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (login(username, password)) {
      toast.success('Welcome Admin!', {
        description: 'Successfully logged in to admin dashboard',
      });
      navigate('/admin/dashboard');
    } else {
      toast.error('Invalid Credentials', {
        description: 'Please check your username and password',
      });
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
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="saravana"
              className="mt-1"
              required
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
            />
          </div>
          <Button type="submit" className="w-full gradient-primary text-primary-foreground">
            Sign In
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