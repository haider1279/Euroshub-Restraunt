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

const loginFormSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormData = z.infer<typeof loginFormSchema>;

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [authError, setAuthError] = useState<string | null>(null);

  const from = (location.state as any)?.from?.pathname || '/account';

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setAuthError(null);
    try {
      await login(data.email, data.password);
      navigate(from, { replace: true });
    } catch (err: any) {
      setAuthError(err.message || 'Invalid email or password.');
    }
  };

  return (
    <div className="container-content flex justify-center pb-24 pt-12 sm:pt-20">
      <div className="w-full max-w-md">
        <h1 className="font-serif text-4xl text-ink">Sign in</h1>
        <p className="mt-3 text-base text-muted">Track your orders and manage your bookings.</p>

        <div className="mt-8 rounded-lg border border-line bg-surface p-5 sm:p-8">
          {authError && (
            <Notice tone="danger" icon={<AlertCircle />} className="mb-6">
              {authError}
            </Notice>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <Input label="Email" type="email" autoComplete="email" error={errors.email?.message} {...register('email')} />
            <Input label="Password" type="password" autoComplete="current-password" error={errors.password?.message} {...register('password')} />
            <Button type="submit" size="lg" className="w-full" isLoading={isSubmitting}>
              Sign in
            </Button>
          </form>
        </div>

        <p className="mt-6 text-sm text-muted">
          New here?{' '}
          <Link to="/register" className="inline-flex min-h-11 items-center text-ink underline underline-offset-4 hover:text-accent">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
};
