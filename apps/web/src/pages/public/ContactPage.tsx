import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Check } from 'lucide-react';
import { useRestaurant } from '../../context/RestaurantContext';
import { useTableAvailability } from '../../hooks/useTableAvailability';
import { hoursSummary } from '../../utils/openingHours';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Textarea } from '../../components/ui/Textarea';
import { toast } from 'sonner';

const contactSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  subject: z.string().min(3, 'Subject must be at least 3 characters'),
  message: z.string().min(10, 'Message must be at least 10 characters'),
});

type ContactFormData = z.infer<typeof contactSchema>;

export const ContactPage: React.FC = () => {
  const [submitted, setSubmitted] = useState(false);
  const { settings, socialLinks } = useRestaurant();
  const { data: tableAvailability } = useTableAvailability();

  const totalTables = tableAvailability?.totalTables || settings.tableCount || 100;
  const openingHoursText = settings.openingHours?.monday
    ? `${settings.openingHours.monday.open} – ${settings.openingHours.monday.close}`
    : '9:00 AM – 12:00 AM';

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
  });

  const onSubmit = async (_data: ContactFormData) => {
    // Brief simulated submission delay
    await new Promise((resolve) => setTimeout(resolve, 600));
    setSubmitted(true);
    toast.success('Your message has been sent to Euroshub Kitchen!');
    reset();
  };

  const activeSocials = socialLinks.filter((s) => s.isActive && s.url && s.url.trim().length > 0);

  const hours = hoursSummary(settings.openingHours);
  const tel = settings.phone ? settings.phone.replace(/[^0-9+]/g, '') : '';

  return (
    <div className="container-content pb-24 pt-10 sm:pt-14">
      <h1 className="font-serif text-4xl text-ink">Contact</h1>
      <p className="mt-3 max-w-xl text-base text-muted">For large orders, table questions or anything about the menu.</p>

      <div className="mt-10 grid items-start gap-12 lg:grid-cols-[1fr_1.3fr]">
        <dl className="space-y-8 text-base">
          {settings.phone && (
            <div>
              <dt className="eyebrow">Phone</dt>
              <dd className="mt-2">
                <a href={`tel:${tel}`} className="inline-flex min-h-11 items-center text-ink underline-offset-4 hover:underline">
                  {settings.phone}
                </a>
              </dd>
            </div>
          )}
          {settings.email && (
            <div>
              <dt className="eyebrow">Email</dt>
              <dd className="mt-2">
                <a href={`mailto:${settings.email}`} className="inline-flex min-h-11 items-center break-all text-ink underline-offset-4 hover:underline">
                  {settings.email}
                </a>
              </dd>
            </div>
          )}
          {settings.address && (
            <div>
              <dt className="eyebrow">Address</dt>
              <dd className="mt-2 text-ink">{settings.address}</dd>
            </div>
          )}
          <div>
            <dt className="eyebrow">Hours</dt>
            <dd className="mt-2 space-y-1">
              {hours.map((h) => (
                <p key={h.label} className="flex justify-between gap-4 sm:max-w-xs">
                  <span className="text-muted">{h.label}</span>
                  <span className="tabular text-ink">{h.value}</span>
                </p>
              ))}
            </dd>
          </div>
          {activeSocials.length > 0 && (
            <div>
              <dt className="eyebrow">Elsewhere</dt>
              <dd className="mt-2 flex flex-wrap gap-x-5">
                {activeSocials.map((s) => (
                  <a
                    key={s.id}
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-11 items-center capitalize text-ink underline-offset-4 hover:underline"
                  >
                    {s.platform}
                  </a>
                ))}
              </dd>
            </div>
          )}
        </dl>

        <section aria-labelledby="contact-form-title" className="rounded-lg border border-line bg-surface p-5 sm:p-8">
          <h2 id="contact-form-title" className="font-serif text-2xl text-ink">
            Send a message
          </h2>

          {submitted ? (
            <div className="mt-6" role="status">
              <span className="flex h-11 w-11 items-center justify-center rounded-full border border-accent/40 bg-accent/10 text-accent" aria-hidden="true">
                <Check className="h-5 w-5" />
              </span>
              <p className="mt-4 text-base text-ink">Thanks, your message is in.</p>
              <Button variant="secondary" size="sm" className="mt-6" onClick={() => setSubmitted(false)}>
                Send another
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <Input label="Name" autoComplete="name" required {...register('name')} error={errors.name?.message} />
                <Input label="Email" type="email" autoComplete="email" required {...register('email')} error={errors.email?.message} />
              </div>
              <Input label="Subject" required {...register('subject')} error={errors.subject?.message} />
              <Textarea label="Message" rows={5} required {...register('message')} error={errors.message?.message} />
              <Button type="submit" size="lg" isLoading={isSubmitting}>
                Send message
              </Button>
            </form>
          )}
        </section>
      </div>
    </div>
  );
};
