import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import { Lock, Mail, ShieldAlert } from 'lucide-react';

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
    <div className="max-w-md mx-auto px-4 py-12 sm:py-20 space-y-6">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-xl bg-charcoal text-terracotta flex items-center justify-center mx-auto shadow-md">
          <span className="font-serif font-bold text-2xl">E</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-serif font-bold text-charcoal">
          Sign In to Euroshub
        </h1>
        <p className="text-xs text-charcoal-500">
          Access your order timeline, reservations, and profile.
        </p>
      </div>

      {/* Main Login Card */}
      <Card className="p-6 sm:p-8 space-y-5">
        {authError && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-xs flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-red-500 flex-shrink-0" />
            <span>{authError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Email Address"
            type="email"
            placeholder="your@email.com"
            error={errors.email?.message}
            leftIcon={<Mail className="w-4 h-4" />}
            {...register('email')}
          />

          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            error={errors.password?.message}
            leftIcon={<Lock className="w-4 h-4" />}
            {...register('password')}
          />

          <div className="pt-2">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
              isLoading={isSubmitting}
            >
              Sign In
            </Button>
          </div>
        </form>

        <div className="pt-4 border-t border-bistro-border text-center text-xs text-charcoal-500">
          Don't have an account yet?{' '}
          <Link to="/register" className="font-semibold text-terracotta hover:underline">
            Register as Customer
          </Link>
        </div>
      </Card>
    </div>
  );
};
