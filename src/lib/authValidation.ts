export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const STRONG_PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

export const validateEmail = (email: string): string | null => {
  const value = email.trim();

  if (!value) {
    return 'Email is required';
  }

  if (value.includes(' ')) {
    return 'Email cannot contain spaces';
  }

  const atCount = (value.match(/@/g) || []).length;
  if (atCount !== 1) {
    return 'Email must contain exactly one @ symbol';
  }

  const atIndex = value.indexOf('@');
  const dotIndex = value.lastIndexOf('.');
  if (dotIndex <= atIndex + 1) {
    return 'Email domain must include a valid dot (example: domain.com)';
  }

  if (!EMAIL_REGEX.test(value)) {
    return 'Please enter a valid email address';
  }

  return null;
};

export const getPasswordStrengthErrors = (password: string): string[] => {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must include at least one uppercase letter');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Password must include at least one lowercase letter');
  }
  if (!/\d/.test(password)) {
    errors.push('Password must include at least one number');
  }
  if (!/[@$!%*?&]/.test(password)) {
    errors.push('Password must include at least one special character (@$!%*?&)');
  }

  return errors;
};

export const isStrongPassword = (password: string): boolean => STRONG_PASSWORD_REGEX.test(password);