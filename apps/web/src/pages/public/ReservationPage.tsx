import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AlertCircle, Check } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useRestaurant } from '../../context/RestaurantContext';
import { apiRequest } from '../../api/client';
import { Reservation } from '../../types';
import { formatDate, formatTime } from '../../utils/date';
import { hoursSummary } from '../../utils/openingHours';
import { useTableAvailability } from '../../hooks/useTableAvailability';
import { Button, ButtonLink } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Textarea } from '../../components/ui/Textarea';
import { Notice } from '../../components/ui/EmptyState';
import { toast } from 'sonner';

const reservationSchema = z.object({
  date: z.string().min(1, 'Please select a date'),
  time: z.string().min(1, 'Please select a time slot'),
  partySize: z.coerce.number().min(1, 'At least 1 guest').max(20, 'Max 20 guests online'),
  notes: z.string().max(500).optional(),
});

type ReservationFormData = z.infer<typeof reservationSchema>;

export const ReservationPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { settings } = useRestaurant();
  const { data: availability } = useTableAvailability();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [confirmedReservation, setConfirmedReservation] = useState<Reservation | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ReservationFormData>({
    resolver: zodResolver(reservationSchema),
    defaultValues: {
      partySize: 2,
    },
  });

  // Operating Hours: Daily 9:00 AM – 12:00 AM (Reservations accepted 09:00 to 23:00)
  const timeSlots = [
    { value: '09:00', label: '09:00 AM' },
    { value: '09:30', label: '09:30 AM' },
    { value: '10:00', label: '10:00 AM' },
    { value: '10:30', label: '10:30 AM' },
    { value: '11:00', label: '11:00 AM' },
    { value: '11:30', label: '11:30 AM' },
    { value: '12:00', label: '12:00 PM' },
    { value: '12:30', label: '12:30 PM' },
    { value: '13:00', label: '01:00 PM' },
    { value: '13:30', label: '01:30 PM' },
    { value: '14:00', label: '02:00 PM' },
    { value: '14:30', label: '02:30 PM' },
    { value: '15:00', label: '03:00 PM' },
    { value: '15:30', label: '03:30 PM' },
    { value: '16:00', label: '04:00 PM' },
    { value: '16:30', label: '04:30 PM' },
    { value: '17:00', label: '05:00 PM' },
    { value: '17:30', label: '05:30 PM' },
    { value: '18:00', label: '06:00 PM' },
    { value: '18:30', label: '06:30 PM' },
    { value: '19:00', label: '07:00 PM' },
    { value: '19:30', label: '07:30 PM' },
    { value: '20:00', label: '08:00 PM' },
    { value: '20:30', label: '08:30 PM' },
    { value: '21:00', label: '09:00 PM' },
    { value: '21:30', label: '09:30 PM' },
    { value: '22:00', label: '10:00 PM' },
    { value: '22:30', label: '10:30 PM' },
    { value: '23:00', label: '11:00 PM' },
  ];

  const partySizeOptions = Array.from({ length: 12 }, (_, i) => ({
    value: i + 1,
    label: `${i + 1} ${i + 1 === 1 ? 'Guest' : 'Guests'}`,
  }));

  // Default min date is today
  const todayStr = new Date().toISOString().slice(0, 10);

  const onSubmit = async (data: ReservationFormData) => {
    if (!isAuthenticated) {
      toast.error('Please sign in or register to reserve a table.');
      navigate('/login', { state: { from: { pathname: '/reservation' } } });
      return;
    }

    setApiError(null);
    setIsSubmitting(true);

    try {
      // Anchor explicitly to Pakistan Standard Time (UTC+05:00, Asia/Karachi)
      const fullDateStr = `${data.date}T${data.time}:00+05:00`;
      const reservationDate = new Date(fullDateStr);

      if (isNaN(reservationDate.getTime())) {
        setApiError('Invalid date or time selected.');
        setIsSubmitting(false);
        return;
      }

      if (reservationDate.getTime() < Date.now()) {
        setApiError('Reservations cannot be booked in the past. Please choose an upcoming time.');
        setIsSubmitting(false);
        return;
      }

      const res = await apiRequest<{ reservation: Reservation }>('/reservations', {
        method: 'POST',
        body: JSON.stringify({
          date: reservationDate.toISOString(),
          partySize: data.partySize,
          notes: data.notes || undefined,
        }),
      });

      setConfirmedReservation(res.reservation);
      toast.success('Table reservation submitted successfully!');
    } catch (err: any) {
      setApiError(err.message || 'Unable to complete reservation. Please select a different time slot.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const hours = hoursSummary(settings.openingHours);
  const { isError: isAvailabilityError, isLoading: isAvailabilityLoading } = useTableAvailability();

  return (
    <div className="container-content pb-24 pt-10 sm:pt-14">
      <div className="grid items-start gap-10 lg:grid-cols-[1fr_320px] lg:gap-16">
        <div className="max-w-xl">
          <h1 className="font-serif text-4xl text-ink">Book a table</h1>
          <p className="mt-3 text-base text-muted">Choose a date, time and party size. We hold the table for 15 minutes.</p>

          {confirmedReservation ? (
            <section aria-labelledby="res-done" className="mt-8 rounded-lg border border-line bg-surface p-6 sm:p-8" role="status">
              <span className="flex h-11 w-11 items-center justify-center rounded-full border border-accent/40 bg-accent/10 text-accent" aria-hidden="true">
                <Check className="h-5 w-5" />
              </span>
              <h2 id="res-done" className="mt-5 font-serif text-2xl text-ink">
                You’re booked.
              </h2>
              <dl className="mt-6 divide-y divide-line border-y border-line text-sm">
                <div className="flex justify-between gap-4 py-3">
                  <dt className="text-muted">Date</dt>
                  <dd className="text-ink">{formatDate(confirmedReservation.date)}</dd>
                </div>
                <div className="flex justify-between gap-4 py-3">
                  <dt className="text-muted">Time</dt>
                  <dd className="text-ink">{formatTime(confirmedReservation.date)}</dd>
                </div>
                <div className="flex justify-between gap-4 py-3">
                  <dt className="text-muted">Guests</dt>
                  <dd className="tabular text-ink">{confirmedReservation.partySize}</dd>
                </div>
                <div className="flex justify-between gap-4 py-3">
                  <dt className="text-muted">Status</dt>
                  <dd className="text-ink">{confirmedReservation.status === 'PENDING' ? 'Awaiting confirmation' : confirmedReservation.status.toLowerCase()}</dd>
                </div>
              </dl>
              <div className="mt-6 flex flex-wrap gap-3">
                <ButtonLink to="/account/reservations" variant="secondary">
                  My reservations
                </ButtonLink>
                <Button variant="ghost" onClick={() => setConfirmedReservation(null)}>
                  Book another
                </Button>
              </div>
            </section>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="mt-8 rounded-lg border border-line bg-surface p-5 sm:p-8">
              {apiError && (
                <Notice tone="danger" icon={<AlertCircle />} title="That time didn’t work" className="mb-6">
                  {apiError}
                </Notice>
              )}

              <div className="grid gap-5 sm:grid-cols-2">
                <Input label="Date" type="date" min={todayStr} required error={errors.date?.message} {...register('date')} />
                <Select
                  label="Time"
                  options={timeSlots}
                  placeholder="Select a time"
                  required
                  error={errors.time?.message}
                  {...register('time')}
                />
              </div>

              <div className="mt-5 sm:max-w-[calc(50%-10px)]">
                <Select label="Guests" options={partySizeOptions} required error={errors.partySize?.message} {...register('partySize')} />
              </div>

              <div className="mt-5">
                <Textarea
                  label="Notes"
                  helperText="Optional. For example a high chair or a quieter table."
                  rows={3}
                  error={errors.notes?.message}
                  {...register('notes')}
                />
              </div>

              <Button type="submit" size="lg" className="mt-7 w-full sm:w-auto" isLoading={isSubmitting}>
                Request booking
              </Button>
              {!isAuthenticated && <p className="mt-4 text-sm text-muted">You’ll be asked to sign in first.</p>}
            </form>
          )}
        </div>

        <aside className="space-y-8 border-t border-line pt-8 text-sm lg:mt-[7.5rem] lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
          <div>
            <h2 className="eyebrow">Hours</h2>
            <dl className="mt-3 space-y-1">
              {hours.map((row) => (
                <div key={row.label} className="flex justify-between gap-4">
                  <dt className="text-muted">{row.label}</dt>
                  <dd className="tabular text-ink">{row.value}</dd>
                </div>
              ))}
            </dl>
          </div>
          {!isAvailabilityLoading && !isAvailabilityError && availability && (
            <div>
              <h2 className="eyebrow">Right now</h2>
              <p className="tabular mt-3 text-ink">
                {availability.availableTables} of {availability.totalTables} tables free
              </p>
            </div>
          )}
          <div>
            <h2 className="eyebrow">Where</h2>
            <p className="mt-3 text-ink">{settings.address}</p>
          </div>
          {settings.phone && (
            <div>
              <h2 className="eyebrow">Questions</h2>
              <p className="mt-3 text-muted">
                Bigger group or a special request? Call{' '}
                <a href={`tel:${settings.phone.replace(/[^0-9+]/g, '')}`} className="inline-flex min-h-11 items-center text-ink underline underline-offset-4">
                  {settings.phone}
                </a>
                .
              </p>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
};
