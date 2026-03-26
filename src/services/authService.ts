import { supabase } from '@/lib/supabaseClient';
import { getPasswordStrengthErrors, validateEmail } from '@/lib/authValidation';

export const authService = {
  validateLoginInput(email: string, password: string): string[] {
    const errors: string[] = [];

    const emailError = validateEmail(email);
    if (emailError) {
      errors.push(emailError);
    }

    if (!password.trim()) {
      errors.push('Password is required');
    }

    return errors;
  },

  validateSignupInput(email: string, password: string, confirmPassword: string): string[] {
    const errors: string[] = [];

    const emailError = validateEmail(email);
    if (emailError) {
      errors.push(emailError);
    }

    const passwordErrors = getPasswordStrengthErrors(password);
    errors.push(...passwordErrors);

    if (!confirmPassword) {
      errors.push('Confirm Password is required');
    } else if (password !== confirmPassword) {
      errors.push('Password and Confirm Password do not match');
    }

    return errors;
  },

  async signInWithPassword(email: string, password: string) {
    const validationErrors = this.validateLoginInput(email, password);
    if (validationErrors.length > 0) {
      throw new Error(validationErrors[0]);
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      throw error;
    }

    return data;
  },

  async signUpWithPassword(email: string, password: string, confirmPassword: string) {
    const validationErrors = this.validateSignupInput(email, password, confirmPassword);
    if (validationErrors.length > 0) {
      throw new Error(validationErrors[0]);
    }

    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
    });

    if (error) {
      throw error;
    }

    return data;
  },
};