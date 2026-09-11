import React from 'react';
import { OrderStatus } from '../../types';
import { Clock, CheckCircle2, ChefHat, PackageCheck, Utensils, XCircle } from 'lucide-react';

interface TimelineProps {
  currentStatus: OrderStatus;
}

const STEPS: Array<{
  status: OrderStatus;
  label: string;
  description: string;
  icon: React.ElementType;
}> = [
  {
    status: 'PENDING',
    label: 'Order Placed',
    description: 'We have received your order and sent it to the kitchen.',
    icon: Clock,
  },
  {
    status: 'CONFIRMED',
    label: 'Confirmed',
    description: 'Chef has accepted and confirmed your ticket.',
    icon: CheckCircle2,
  },
  {
    status: 'PREPARING',
    label: 'Preparing',
    description: 'Artisanal culinary preparation underway on the hearth.',
    icon: ChefHat,
  },
  {
    status: 'READY',
    label: 'Ready',
    description: 'Freshly plated and ready for pickup or dispatch.',
    icon: PackageCheck,
  },
  {
    status: 'COMPLETED',
    label: 'Delivered / Served',
    description: 'Order fulfilled. Buon appetito!',
    icon: Utensils,
  },
];

export const Timeline: React.FC<TimelineProps> = ({ currentStatus }) => {
  if (currentStatus === 'CANCELLED') {
    return (
      <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 rounded-xl p-6 text-center">
        <div className="w-12 h-12 mx-auto rounded-full bg-red-100 dark:bg-red-900/40 flex items-center justify-center text-red-600 dark:text-red-400 mb-3">
          <XCircle className="w-7 h-7" />
        </div>
        <h4 className="text-lg font-serif font-bold text-red-900 dark:text-red-200 mb-1">Order Cancelled</h4>
        <p className="text-sm text-red-700 dark:text-red-300">This order was cancelled and will not be prepared.</p>
      </div>
    );
  }

  const stepOrder: OrderStatus[] = ['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'COMPLETED'];
  const currentIndex = stepOrder.indexOf(currentStatus);

  return (
    <div className="py-4">
      {/* Desktop / Tablet horizontal timeline */}
      <div className="hidden md:flex items-center justify-between relative">
        {/* Progress Bar background */}
        <div className="absolute top-5 left-8 right-8 h-1 bg-charcoal-100 dark:bg-charcoal-700 z-0" />
        <div
          className="absolute top-5 left-8 h-1 bg-terracotta transition-all duration-500 z-0"
          style={{
            width: `${(Math.max(0, currentIndex) / (STEPS.length - 1)) * 90}%`,
          }}
        />

        {STEPS.map((step, idx) => {
          const isCompleted = idx < currentIndex;
          const isCurrent = idx === currentIndex;
          const Icon = step.icon;

          return (
            <div key={step.status} className="flex flex-col items-center relative z-10 w-28 text-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-bistro border-2 ${
                  isCurrent
                    ? 'bg-terracotta border-terracotta text-white ring-4 ring-terracotta-100 dark:ring-terracotta/20 shadow-md scale-110'
                    : isCompleted
                    ? 'bg-olive border-olive text-white'
                    : 'bg-white dark:bg-charcoal-800 border-charcoal-200 dark:border-charcoal-700 text-charcoal-400 dark:text-charcoal-500'
                }`}
              >
                <Icon className="w-5 h-5" />
              </div>
              <span
                className={`text-xs font-semibold mt-2.5 ${
                  isCurrent
                    ? 'text-terracotta font-bold'
                    : isCompleted
                    ? 'text-charcoal-900 dark:text-charcoal-200'
                    : 'text-charcoal-400 dark:text-charcoal-500'
                }`}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Mobile vertical timeline */}
      <div className="flex flex-col space-y-6 md:hidden">
        {STEPS.map((step, idx) => {
          const isCompleted = idx < currentIndex;
          const isCurrent = idx === currentIndex;
          const Icon = step.icon;

          return (
            <div key={step.status} className="flex items-start space-x-4">
              <div className="relative flex flex-col items-center">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center transition-bistro border-2 ${
                    isCurrent
                      ? 'bg-terracotta border-terracotta text-white ring-4 ring-terracotta-100 dark:ring-terracotta/20 shadow-md'
                      : isCompleted
                      ? 'bg-olive border-olive text-white'
                      : 'bg-white dark:bg-charcoal-800 border-charcoal-200 dark:border-charcoal-700 text-charcoal-400 dark:text-charcoal-500'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                {idx < STEPS.length - 1 && (
                  <div
                    className={`w-0.5 h-10 mt-1 ${
                      idx < currentIndex ? 'bg-olive' : 'bg-charcoal-200 dark:bg-charcoal-700'
                    }`}
                  />
                )}
              </div>
              <div className="pt-0.5">
                <h5
                  className={`text-sm font-semibold ${
                    isCurrent ? 'text-terracotta font-bold' : isCompleted ? 'text-charcoal-900 dark:text-charcoal-200' : 'text-charcoal-400 dark:text-charcoal-500'
                  }`}
                >
                  {step.label}
                </h5>
                <p className="text-xs text-charcoal-500 dark:text-charcoal-400 mt-0.5">{step.description}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
