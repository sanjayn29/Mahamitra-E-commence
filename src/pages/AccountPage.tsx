import { useAuth } from '@/context/AuthContext';
import { Navigate } from 'react-router-dom';
import MainLayout from '@/layouts/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Mail, Calendar, Clock, LogOut } from 'lucide-react';
import SEO from '@/components/SEO';

const AccountPage = () => {
  const { user, loading, signOut } = useAuth(); // Removed userData

  if (loading) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-20 text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground font-sans">Loading your account...</p>
        </div>
      </MainLayout>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const userName = user?.user_metadata?.full_name || user?.user_metadata?.name || 'User';
  const userAvatar = user?.user_metadata?.avatar_url || '';
  const userEmail = user?.email || '';

  return (
    <MainLayout>
      <SEO
        title="My Account | Mahamitra Boutique"
        description="View your account details and manage your settings."
      />
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Page Header */}
          <div className="text-center mb-12">
            <h1 className="font-serif text-4xl font-semibold mb-2">My Account</h1>
            <p className="text-muted-foreground font-sans">Manage your profile and preferences</p>
          </div>

          <div className="grid gap-6">
            {/* Profile Card */}
            <Card className="shadow-luxe">
              <CardHeader>
                <CardTitle className="font-serif">Profile Information</CardTitle>
                <CardDescription>Your personal details</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-start gap-6">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={userAvatar} alt={userName} />
                    <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                      {userName.charAt(0) || userEmail.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-4">
                    <div>
                      <h3 className="font-serif text-2xl font-semibold mb-1">
                        {userName}
                      </h3>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Mail size={16} />
                        <span className="font-sans text-sm">{userEmail}</span>
                      </div>
                    </div>

                    {user && (
                      <>
                        <Separator />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Calendar size={16} />
                            <div>
                              <p className="font-sans text-xs">Member Since</p>
                              <p className="font-sans font-medium text-foreground">
                                {user.created_at ? new Date(user.created_at).toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric',
                                }) : 'N/A'}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Clock size={16} />
                            <div>
                              <p className="font-sans text-xs">Last Login</p>
                              <p className="font-sans font-medium text-foreground">
                                {user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                }) : 'N/A'}
                              </p>
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="shadow-luxe">
              <CardHeader>
                <CardTitle className="font-serif">Quick Actions</CardTitle>
                <CardDescription>Manage your account settings</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button variant="outline" className="justify-start h-auto py-4">
                  <div className="text-left">
                    <p className="font-sans font-semibold">Order History</p>
                    <p className="text-xs text-muted-foreground">View your past purchases</p>
                  </div>
                </Button>
                <Button variant="outline" className="justify-start h-auto py-4">
                  <div className="text-left">
                    <p className="font-sans font-semibold">Wishlist</p>
                    <p className="text-xs text-muted-foreground">Items you've saved</p>
                  </div>
                </Button>
                <Button variant="outline" className="justify-start h-auto py-4">
                  <div className="text-left">
                    <p className="font-sans font-semibold">Addresses</p>
                    <p className="text-xs text-muted-foreground">Manage shipping addresses</p>
                  </div>
                </Button>
                <Button variant="outline" className="justify-start h-auto py-4">
                  <div className="text-left">
                    <p className="font-sans font-semibold">Payment Methods</p>
                    <p className="text-xs text-muted-foreground">Saved payment options</p>
                  </div>
                </Button>
              </CardContent>
            </Card>

            {/* Sign Out */}
            <Card className="shadow-luxe border-destructive/20">
              <CardContent className="pt-6">
                <Button
                  onClick={signOut}
                  variant="destructive"
                  className="w-full"
                  size="lg"
                >
                  <LogOut size={18} className="mr-2" />
                  Sign Out
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default AccountPage;
