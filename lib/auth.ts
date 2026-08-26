type ClerkError = {
  message?: string;
  errors?: Array<{
    code?: string;
    longMessage?: string;
    message?: string;
  }>;
};

export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const getClerkErrorMessage = (
  error: unknown,
  fallback = "Something went wrong. Please try again.",
) => {
  const clerkError = error as ClerkError;
  return (
    clerkError?.errors?.[0]?.longMessage ??
    clerkError?.errors?.[0]?.message ??
    clerkError?.message ??
    fallback
  );
};

export const getEmailValidationMessage = (email: string) => {
  if (!email.trim()) return "Enter your email address.";
  if (!EMAIL_PATTERN.test(email.trim())) return "Enter a valid email address.";
  return undefined;
};

export const getPasswordValidationMessage = (password: string) => {
  if (!password) return "Enter your password.";
  if (password.length < 8) return "Use at least 8 characters.";
  return undefined;
};

export const getCodeValidationMessage = (code: string) => {
  if (!code.trim()) return "Enter the verification code.";
  if (!/^\d{6}$/.test(code.trim())) return "Enter the 6-digit code.";
  return undefined;
};
