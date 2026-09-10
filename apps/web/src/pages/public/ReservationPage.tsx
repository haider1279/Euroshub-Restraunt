import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../../context/AuthContext';
import { useRestaurant } from '../../context/RestaurantContext';
import { apiRequest } from '../../api/client';
import { Reservation } from '../../types';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Textarea } from '../../components/ui/Textarea';
import { Card } from '../../components/ui/Card';
import { toast } from 'sonner';
import {
  Calendar as CalendarIcon,
  CheckCircle2,
  AlertCircle,
  MapPin,
  Phone,
  Utensils,
  Clock,
} from 'lucide-react';

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

  // Operating Hours: Daily 9:00 AM – 12:00 PM
  const timeSlots = [
    { value: '09:00', label: '09:00 AM — Morning Service' },
    { value: '09:30', label: '09:30 AM — Morning Service' },
    { value: '10:00', label: '10:00 AM — Mid-Morning' },
    { value: '10:30', label: '10:30 AM — Mid-Morning' },
    { value: '11:00', label: '11:00 AM — Early Lunch' },
    { value: '11:30', label: '11:30 AM — Lunch' },
    { value: '12:00', label: '12:00 PM — Midday Service' },
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
      const fullDateStr = `${data.date}T${data.time}:00`;
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

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-12">
      {/* Header */}
      <div className="text-center max-w-xl mx-auto space-y-3">
        <span className="text-xs font-bold text-terracotta uppercase tracking-wider block">
          Dine-In Bookings
        </span>
        <h1 className="text-3xl sm:text-5xl font-serif font-bold text-charcoal tracking-tight">
          Reserve a Table
        </h1>
        <p className="text-xs sm:text-sm text-charcoal-500 leading-relaxed">
          100 tables available daily from 9:00 AM to 12:00 PM at Kohistan Tower, Saddar, Rawalpindi.
        </p>
      </div>

      {confirmedReservation ? (
        <Card className="p-8 sm:p-12 text-center space-y-6 max-w-xl mx-auto border-emerald-300 bg-emerald-50/40">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-sm">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div className="space-y-1">
            <h2 className="text-2xl font-serif font-bold text-charcoal">
              Reservation Confirmed!
            </h2>
            <p className="text-xs text-charcoal-600">
              We have reserved your table at Euroshub Kitchen.
            </p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-bistro-border divide-y divide-bistro-border text-xs space-y-2.5">
            <div className="flex justify-between items-center pb-2">
              <span className="text-charcoal-500">Date & Time</span>
              <span className="font-bold text-charcoal-900">
                {new Date(confirmedReservation.date).toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-charcoal-500">Party Size</span>
              <span className="font-bold text-charcoal-900">
                {confirmedReservation.partySize} {confirmedReservation.partySize === 1 ? 'Guest' : 'Guests'}
              </span>
            </div>
            <div className="flex justify-between items-center pt-2">
              <span className="text-charcoal-500">Location</span>
              <span className="font-medium text-charcoal-900">Kohistan Tower, Saddar, Rawalpindi</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Link to="/account/reservations" className="flex-1">
              <Button variant="outline" className="w-full">
                View My Bookings
              </Button>
            </Link>
            <Button
              variant="primary"
              className="flex-1"
              onClick={() => setConfirmedReservation(null)}
            >
              Book Another Table
            </Button>
          </div>
        </Card>
      ) : (
        <Card className="p-6 sm:p-10 max-w-2xl mx-auto shadow-md">
          {apiError && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Unable to Reserve This Slot</p>
                <p className="mt-0.5">{apiError}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Date *"
                type="date"
                min={todayStr}
                error={errors.date?.message}
                {...register('date')}
              />

              <Select
                label="Time Slot (Daily 9:00 AM – 12:00 PM) *"
                options={timeSlots}
                placeholder="Select Time"
                error={errors.time?.message}
                {...register('time')}
              />
            </div>

            <Select
              label="Party Size *"
              options={partySizeOptions}
              error={errors.partySize?.message}
              {...register('partySize')}
            />

            <Textarea
              label="Special Notes (Optional)"
              placeholder="e.g. Near window booth, table for business lunch..."
              rows={3}
              error={errors.notes?.message}
              {...register('notes')}
            />

            <div className="pt-3">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full"
                isLoading={isSubmitting}
                leftIcon={<CalendarIcon className="w-4 h-4" />}
              >
                Confirm Table Reservation
              </Button>
            </div>

            <div className="pt-2 text-[11px] text-charcoal-400 text-center space-y-1">
              <p>Reserved tables are held for 15 minutes past booking time.</p>
              <p>Walk-ins are also welcome daily across our 100 tables.</p>
            </div>
          </form>
        </Card>
      )}

      {/* Restaurant Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 text-xs text-charcoal-600">
        <div className="bg-white p-4 rounded-xl border border-bistro-border flex items-start space-x-3">
          <MapPin className="w-5 h-5 text-terracotta flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-serif font-bold text-charcoal text-sm">Central Location</h4>
            <p className="mt-0.5">{settings.address}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-bistro-border flex items-start space-x-3">
          <Utensils className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-serif font-bold text-charcoal text-sm">100 Seated Tables</h4>
            <p className="mt-0.5">Spacious fast-food seating designed for families and groups.</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-bistro-border flex items-start space-x-3">
          <Phone className="w-5 h-5 text-terracotta flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-serif font-bold text-charcoal text-sm">Direct Phone</h4>
            <p className="mt-0.5">{settings.phone}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
