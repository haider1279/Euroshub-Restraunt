import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Notice } from '../../components/ui/EmptyState';

const registerFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().optional(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[a-zA-Z]/, 'Password must contain at least one letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
});

type RegisterFormData = z.infer<typeof registerFormSchema>;

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { register: authRegister } = useAuth();
  const [authError, setAuthError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerFormSchema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    setAuthError(null);
    try {
      await authRegister(data);
      navigate('/account');
    } catch (err: any) {
      setAuthError(err.message || 'Registration failed. Please try again.');
    }
  };

  return (
    <div className="container-content flex justify-center pb-24 pt-12 sm:pt-20">
      <div className="w-full max-w-md">
        <h1 className="font-serif text-4xl text-ink">Create an account</h1>
        <p className="mt-3 text-base text-muted">Order ahead, book tables and follow your orders.</p>

        <div className="mt-8 rounded-lg border border-line bg-surface p-5 sm:p-8">
          {authError && (
            <Notice tone="danger" icon={<AlertCircle />} className="mb-6">
              {authError}
            </Notice>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <Input label="Full name" autoComplete="name" required error={errors.name?.message} {...register('name')} />
            <Input label="Email" type="email" autoComplete="email" required error={errors.email?.message} {...register('email')} />
            <Input
              label="Phone"
              type="tel"
              autoComplete="tel"
              helperText="Optional. Used for order updates."
              error={errors.phone?.message}
              {...register('phone')}
            />
            <Input
              label="Password"
              type="password"
              autoComplete="new-password"
              required
              helperText="At least 8 characters, with a letter and a number."
              error={errors.password?.message}
              {...register('password')}
            />
            <Button type="submit" size="lg" className="w-full" isLoading={isSubmitting}>
              Create account
            </Button>
          </form>
        </div>

        <p className="mt-6 text-sm text-muted">
          Already have an account?{' '}
          <Link to="/login" className="inline-flex min-h-11 items-center text-ink underline underline-offset-4 hover:text-accent">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};
