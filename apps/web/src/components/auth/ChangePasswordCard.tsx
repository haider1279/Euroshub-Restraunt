import React, { useState } from 'react';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { apiRequest } from '../../api/client';
import { toast } from 'sonner';
import { AlertCircle } from 'lucide-react';
import { Notice } from '../ui/EmptyState';

export const ChangePasswordCard: React.FC = () => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!currentPassword) {
      setError('Current password is required.');
      return;
    }

    if (newPassword.length < 10) {
      setError('New password must be at least 10 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.');
      return;
    }

    setIsLoading(true);
    try {
      await apiRequest('/auth/password', {
        method: 'PUT',
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      toast.success('Password changed successfully! Other active sessions have been revoked.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setError(err?.message || 'Failed to update password.');
      toast.error(err?.message || 'Failed to update password.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <h2 className="font-serif text-xl text-ink">Change password</h2>
      <p className="mt-1 text-sm text-muted">
        At least 10 characters. Changing it signs you out on other devices.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 max-w-md space-y-4">
        {error && <Notice tone="danger" icon={<AlertCircle />}>{error}</Notice>}

        <Input
          type="password"
          label="Current password"
          autoComplete="current-password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          required
        />

        <Input
          type="password"
          label="New password"
          helperText="At least 10 characters."
          autoComplete="new-password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
        />

        <Input
          type="password"
          label="Confirm new password"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />

        <Button type="submit" isLoading={isLoading} disabled={isLoading}>
          Update password
        </Button>
      </form>
    </Card>
  );
};
