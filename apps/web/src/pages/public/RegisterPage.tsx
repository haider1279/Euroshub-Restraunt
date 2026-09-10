import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import { Mail, Lock, User as UserIcon, Phone, ShieldAlert } from 'lucide-react';

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
    <div className="max-w-md mx-auto px-4 py-12 sm:py-20 space-y-6">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-xl bg-charcoal text-terracotta flex items-center justify-center mx-auto shadow-md">
          <span className="font-serif font-bold text-2xl">E</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-serif font-bold text-charcoal">
          Create an Account
        </h1>
        <p className="text-xs text-charcoal-500">
          Join Euroshub Kitchen to track your live orders and book tables effortlessly.
        </p>
      </div>

      <Card className="p-6 sm:p-8 space-y-5">
        {authError && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-xs flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-red-500 flex-shrink-0" />
            <span>{authError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Full Name *"
            placeholder="e.g. Marco Rossi"
            error={errors.name?.message}
            leftIcon={<UserIcon className="w-4 h-4" />}
            {...register('name')}
          />

          <Input
            label="Email Address *"
            type="email"
            placeholder="e.g. marco@example.com"
            error={errors.email?.message}
            leftIcon={<Mail className="w-4 h-4" />}
            {...register('email')}
          />

          <Input
            label="Phone Number (Optional)"
            placeholder="e.g. +1 (555) 234-5678"
            error={errors.phone?.message}
            leftIcon={<Phone className="w-4 h-4" />}
            {...register('phone')}
          />

          <Input
            label="Password *"
            type="password"
            placeholder="Min 8 chars, 1 letter & 1 number"
            error={errors.password?.message}
            helperText="Must be at least 8 characters with letters and numbers."
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
              Complete Registration
            </Button>
          </div>
        </form>

        <div className="pt-4 border-t border-bistro-border text-center text-xs text-charcoal-500">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-terracotta hover:underline">
            Sign In Here
          </Link>
        </div>
      </Card>
    </div>
  );
};
