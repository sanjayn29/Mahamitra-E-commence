import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';

interface Profile {
  name: string;
  gender: string;
  email: string;
}

const ProfilePage = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error) {
          toast.error('Failed to fetch profile', {
            description: error.message,
          });
        } else {
          setProfile(data);
        }
      }
      setLoading(false);
    };

    fetchProfile();
  }, []);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error('Logout failed', {
        description: error.message,
      });
    } else {
      toast.success('Logged out successfully');
      navigate('/login');
    }
  };

  if (loading) {
    return <div className="container mx-auto text-center py-10">Loading profile...</div>;
  }

  return (
    <div className="container mx-auto flex items-center justify-center min-h-screen">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">User Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {profile ? (
            <div>
              <p><strong>Name:</strong> {profile.name}</p>
              <p><strong>Gender:</strong> {profile.gender}</p>
              <p><strong>Email:</strong> {profile.email}</p>
            </div>
          ) : (
            <p>No profile data found.</p>
          )}
          <Button onClick={handleLogout} className="w-full">
            Logout
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfilePage;
