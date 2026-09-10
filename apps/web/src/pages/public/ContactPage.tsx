import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRestaurant } from '../../context/RestaurantContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Textarea } from '../../components/ui/Textarea';
import { Card } from '../../components/ui/Card';
import { toast } from 'sonner';
import { MapPin, Phone, Mail, Clock, Send, CheckCircle2 } from 'lucide-react';

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

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
  });

  const onSubmit = async (_data: ContactFormData) => {
    // Brief mock delay
    await new Promise((resolve) => setTimeout(resolve, 600));
    setSubmitted(true);
    toast.success('Your message has been sent to Euroshub Kitchen!');
    reset();
  };

  const activeSocials = socialLinks.filter((s) => s.isActive && s.url && s.url.trim().length > 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-12">
      {/* Title */}
      <div className="text-center max-w-xl mx-auto space-y-3">
        <span className="text-xs font-bold text-terracotta uppercase tracking-wider block">
          Customer Service & Inquiries
        </span>
        <h1 className="text-3xl sm:text-5xl font-serif font-bold text-charcoal tracking-tight">
          Contact Euroshub Kitchen
        </h1>
        <p className="text-xs sm:text-sm text-charcoal-500 leading-relaxed">
          Have inquiries regarding large takeaway orders, table availability, or our menu items? Reach out to us directly.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Contact Info & Hours Cards (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="p-6 space-y-5">
            <h3 className="font-serif font-bold text-lg text-charcoal pb-3 border-b border-bistro-border">
              Location & Details
            </h3>

            <div className="space-y-4 text-xs">
              <div className="flex items-start space-x-3">
                <MapPin className="w-5 h-5 text-terracotta flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-charcoal-900">Address</h4>
                  <p className="text-charcoal-600 mt-0.5">
                    {settings.address || 'Kohistan Tower, Saddar, Rawalpindi, Office 609'}
                  </p>
                  <p className="text-charcoal-400 mt-0.5">Kohistan Tower commercial complex, Saddar.</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Phone className="w-5 h-5 text-terracotta flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-charcoal-900">Direct Telephone</h4>
                  <a
                    href={`tel:${settings.phone.replace(/[^0-9+]/g, '')}`}
                    className="text-terracotta hover:underline font-medium"
                  >
                    {settings.phone}
                  </a>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Mail className="w-5 h-5 text-terracotta flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-charcoal-900">Email Address</h4>
                  <a
                    href={`mailto:${settings.email}`}
                    className="text-terracotta hover:underline font-medium"
                  >
                    {settings.email || 'haider1.euroshub@gmail.com'}
                  </a>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6 space-y-4">
            <h3 className="font-serif font-bold text-lg text-charcoal pb-3 border-b border-bistro-border flex items-center gap-2">
              <Clock className="w-5 h-5 text-terracotta" /> Kitchen Hours
            </h3>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-bistro-border">
                <span className="text-charcoal-600 font-medium">Monday – Sunday:</span>
                <span className="font-bold text-charcoal-900">9:00 AM – 12:00 PM</span>
              </div>
              <p className="text-[11px] text-charcoal-400 pt-1">
                Dine-in seating across 100 tables and counter takeaway available daily.
              </p>
            </div>

            {activeSocials.length > 0 && (
              <div className="pt-3 border-t border-bistro-border">
                <h4 className="text-xs font-bold text-charcoal mb-2">Connect Online</h4>
                <div className="flex items-center space-x-2">
                  {activeSocials.map((s) => (
                    <a
                      key={s.id}
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1 bg-bistro-bg text-charcoal-700 text-xs font-semibold rounded border border-bistro-border hover:bg-terracotta hover:text-white transition-colors"
                    >
                      {s.platform}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* Contact Form (7 cols) */}
        <div className="lg:col-span-7">
          <Card className="p-6 sm:p-8 space-y-6">
            <div>
              <h3 className="font-serif font-bold text-xl text-charcoal">Send Us a Message</h3>
              <p className="text-xs text-charcoal-500 mt-1">
                Fill out the form below and our team will get back to you.
              </p>
            </div>

            {submitted ? (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-8 text-center space-y-3">
                <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                <h4 className="font-serif font-bold text-emerald-900 text-base">Message Sent!</h4>
                <p className="text-xs text-emerald-700 max-w-sm mx-auto">
                  Thank you for reaching out to Euroshub Kitchen. We will respond to your email shortly.
                </p>
                <Button variant="outline" size="sm" onClick={() => setSubmitted(false)}>
                  Send Another Message
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-charcoal mb-1">
                      Your Name <span className="text-red-500">*</span>
                    </label>
                    <Input placeholder="Ali Khan" {...register('name')} error={errors.name?.message} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-charcoal mb-1">
                      Your Email <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="email"
                      placeholder="ali@example.com"
                      {...register('email')}
                      error={errors.email?.message}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-charcoal mb-1">
                    Subject <span className="text-red-500">*</span>
                  </label>
                  <Input
                    placeholder="Large Order / Table Inquiry"
                    {...register('subject')}
                    error={errors.subject?.message}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-charcoal mb-1">
                    Message <span className="text-red-500">*</span>
                  </label>
                  <Textarea
                    rows={5}
                    placeholder="Write your message here..."
                    {...register('message')}
                    error={errors.message?.message}
                  />
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  className="w-full"
                  isLoading={isSubmitting}
                  rightIcon={<Send className="w-4 h-4" />}
                >
                  Send Message
                </Button>
              </form>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};
