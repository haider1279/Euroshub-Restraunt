import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import { Lock, Mail, ShieldAlert, Sparkles, UserCheck } from 'lucide-react';

const loginFormSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormData = z.infer<typeof loginFormSchema>;

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, loginAsAdmin, loginAsCustomer } = useAuth();

  const [authError, setAuthError] = useState<string | null>(null);
  const [isDemoLoading, setIsDemoLoading] = useState(false);

  const from = (location.state as any)?.from?.pathname || '/account';

  const {
    register,
    handleSubmit,
    setValue,
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

  const handleAdminDemo = async () => {
    setAuthError(null);
    setIsDemoLoading(true);
    try {
      await loginAsAdmin();
      navigate('/admin', { replace: true });
    } catch (err: any) {
      setAuthError(err.message || 'Demo login failed.');
    } finally {
      setIsDemoLoading(false);
    }
  };

  const handleCustomerDemo = async () => {
    setAuthError(null);
    setIsDemoLoading(true);
    try {
      await loginAsCustomer();
      navigate(from, { replace: true });
    } catch (err: any) {
      setAuthError(err.message || 'Demo login failed.');
    } finally {
      setIsDemoLoading(false);
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

      {/* 1-Click Demo Evaluation Box */}
      <div className="bg-terracotta-50/70 border border-terracotta-200 rounded-xl p-4 space-y-2.5">
        <div className="flex items-center gap-1.5 text-xs font-bold text-terracotta-800">
          <Sparkles className="w-4 h-4 text-terracotta" />
          <span>One-Click Demo Authentication</span>
        </div>
        <p className="text-[11px] text-charcoal-600">
          Click below to test instantly with pre-seeded credentials:
        </p>
        <div className="grid grid-cols-2 gap-2 pt-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleCustomerDemo}
            isLoading={isDemoLoading}
            leftIcon={<UserCheck className="w-3.5 h-3.5 text-terracotta" />}
          >
            Customer Demo
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleAdminDemo}
            isLoading={isDemoLoading}
            leftIcon={<Lock className="w-3.5 h-3.5 text-terracotta" />}
          >
            Admin Demo
          </Button>
        </div>
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
            placeholder="admin@euroshubkitchen.com"
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
