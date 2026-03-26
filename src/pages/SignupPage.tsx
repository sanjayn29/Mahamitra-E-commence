import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import SEO from '@/components/SEO';
import { getPasswordStrengthErrors, validateEmail } from '@/lib/authValidation';
import { authService } from '@/services/authService';

const SignupPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    gender: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'India',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const getInputClassName = (field: string) =>
    errors[field] ? 'border-destructive focus-visible:ring-destructive' : '';

  const validateForm = () => {
    const validationErrors: Record<string, string> = {};
    const normalizedName = formData.name.trim();
    const normalizedPhone = formData.phone.trim();
    const normalizedAddressLine1 = formData.addressLine1.trim();
    const normalizedCity = formData.city.trim();
    const normalizedState = formData.state.trim();
    const normalizedPostalCode = formData.postalCode.trim();
    const normalizedCountry = formData.country.trim();

    if (!normalizedName) {
      validationErrors.name = 'Name is required';
    } else if (!/^[A-Za-z\s.'-]{2,}$/.test(normalizedName)) {
      validationErrors.name = 'Please enter a valid name';
    }

    if (!formData.gender) validationErrors.gender = 'Gender is required';

    const emailError = validateEmail(formData.email);
    if (emailError) validationErrors.email = emailError;

    const passwordErrors = getPasswordStrengthErrors(formData.password);
    if (passwordErrors.length > 0) {
      validationErrors.password = passwordErrors[0];
    }

    if (!formData.confirmPassword) {
      validationErrors.confirmPassword = 'Confirm Password is required';
    } else if (formData.password !== formData.confirmPassword) {
      validationErrors.confirmPassword = 'Password and Confirm Password do not match';
    }

    if (!normalizedPhone) {
      validationErrors.phone = 'Phone is required';
    } else if (!/^\d{10}$/.test(normalizedPhone)) {
      validationErrors.phone = 'Mobile number must be exactly 10 digits';
    }

    if (!normalizedAddressLine1) {
      validationErrors.addressLine1 = 'Address Line 1 is required';
    } else if (normalizedAddressLine1.length < 5) {
      validationErrors.addressLine1 = 'Address Line 1 must be at least 5 characters';
    }

    if (!normalizedCity) {
      validationErrors.city = 'City is required';
    } else if (!/^[A-Za-z\s.-]{2,}$/.test(normalizedCity)) {
      validationErrors.city = 'Please enter a valid city name';
    }

    if (!normalizedState) {
      validationErrors.state = 'State is required';
    } else if (!/^[A-Za-z\s.-]{2,}$/.test(normalizedState)) {
      validationErrors.state = 'Please enter a valid state name';
    }

    if (!normalizedPostalCode) {
      validationErrors.postalCode = 'Postal Code is required';
    } else if (!/^\d{6}$/.test(normalizedPostalCode)) {
      validationErrors.postalCode = 'Postal Code must be exactly 6 digits';
    }

    if (!normalizedCountry) {
      validationErrors.country = 'Country is required';
    } else if (!/^[A-Za-z\s.-]{2,}$/.test(normalizedCountry)) {
      validationErrors.country = 'Please enter a valid country name';
    }

    setErrors(validationErrors);
    return Object.keys(validationErrors).length === 0;
  };

  const handleInputChange = (field: string, value: string) => {
    const nextValue =
      field === 'phone' || field === 'postalCode'
        ? value.replace(/\D/g, '')
        : value;

    setFormData(prev => ({
      ...prev,
      [field]: nextValue,
    }));

    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error('Please fix validation errors before submitting');
      return;
    }

    setLoading(true);

    const {
      name,
      gender,
      email,
      password,
      confirmPassword,
      phone,
      addressLine1,
      addressLine2,
      city,
      state,
      postalCode,
      country,
    } = formData;

    const normalizedName = name.trim();
    const normalizedEmail = email.trim();
    const normalizedPhone = phone.trim();
    const normalizedAddressLine1 = addressLine1.trim();
    const normalizedAddressLine2 = addressLine2.trim();
    const normalizedCity = city.trim();
    const normalizedState = state.trim();
    const normalizedPostalCode = postalCode.trim();
    const normalizedCountry = country.trim();

    try {
      const { user } = await authService.signUpWithPassword(normalizedEmail, password, confirmPassword);

      if (user) {
        const { error: insertError } = await supabase.from('profiles').insert({
          id: user.id,
          name: normalizedName,
          gender,
          email: normalizedEmail,
          phone: normalizedPhone,
        });

        if (insertError) {
          throw insertError;
        }

        const { error: addressError } = await supabase.from('addresses').insert({
          user_id: user.id,
          full_name: normalizedName,
          phone: normalizedPhone,
          address_line_1: normalizedAddressLine1,
          address_line_2: normalizedAddressLine2 || null,
          city: normalizedCity,
          state: normalizedState,
          postal_code: normalizedPostalCode,
          country: normalizedCountry,
          is_default: true,
        });

        if (addressError) {
          throw addressError;
        }

        // Automatically sign in the user after signup
        await authService.signInWithPassword(normalizedEmail, password);

        toast.success('Signup successful!', {
          description: 'Redirecting to login...',
        });
        navigate('/login');
      }
    } catch (error: any) {
      toast.error('Signup failed', {
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto flex items-center justify-center min-h-screen">
      <SEO
        title="Sign Up | Mahamitra Boutique"
        description="Create a Mahamitra Boutique account today. Join our community for exclusive offers and a seamless shopping experience."
      />
      <Card className="w-full max-w-xl">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">Create an Account</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignup} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="Your Name"
                value={formData.name}
                className={getInputClassName('name')}
                onChange={e => handleInputChange('name', e.target.value)}
                required
              />
              {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="gender">Gender</Label>
              <Select onValueChange={value => handleInputChange('gender', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
              {errors.gender && <p className="text-xs text-destructive">{errors.gender}</p>}
            </div>
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
                placeholder="••••••••"
                value={formData.password}
                className={getInputClassName('password')}
                onChange={e => handleInputChange('password', e.target.value)}
                required
              />
              {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={formData.confirmPassword}
                className={getInputClassName('confirmPassword')}
                onChange={e => handleInputChange('confirmPassword', e.target.value)}
                required
              />
              {errors.confirmPassword && <p className="text-xs text-destructive">{errors.confirmPassword}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="10-digit mobile number"
                value={formData.phone}
                className={getInputClassName('phone')}
                inputMode="numeric"
                maxLength={10}
                onChange={e => handleInputChange('phone', e.target.value)}
                required
              />
              {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="addressLine1">Address Line 1</Label>
              <Input
                id="addressLine1"
                type="text"
                placeholder="House no, street, locality"
                value={formData.addressLine1}
                className={getInputClassName('addressLine1')}
                onChange={e => handleInputChange('addressLine1', e.target.value)}
                required
              />
              {errors.addressLine1 && <p className="text-xs text-destructive">{errors.addressLine1}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="addressLine2">Address Line 2</Label>
              <Input
                id="addressLine2"
                type="text"
                placeholder="Apartment, landmark (optional)"
                value={formData.addressLine2}
                onChange={e => handleInputChange('addressLine2', e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  type="text"
                  value={formData.city}
                  className={getInputClassName('city')}
                  onChange={e => handleInputChange('city', e.target.value)}
                  required
                />
                {errors.city && <p className="text-xs text-destructive">{errors.city}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  type="text"
                  value={formData.state}
                  className={getInputClassName('state')}
                  onChange={e => handleInputChange('state', e.target.value)}
                  required
                />
                {errors.state && <p className="text-xs text-destructive">{errors.state}</p>}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="postalCode">Postal Code</Label>
                <Input
                  id="postalCode"
                  type="text"
                  value={formData.postalCode}
                  className={getInputClassName('postalCode')}
                  inputMode="numeric"
                  maxLength={6}
                  onChange={e => handleInputChange('postalCode', e.target.value)}
                  required
                />
                {errors.postalCode && <p className="text-xs text-destructive">{errors.postalCode}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  type="text"
                  value={formData.country}
                  className={getInputClassName('country')}
                  onChange={e => handleInputChange('country', e.target.value)}
                  required
                />
                {errors.country && <p className="text-xs text-destructive">{errors.country}</p>}
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Signing up...' : 'Sign Up'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default SignupPage;
