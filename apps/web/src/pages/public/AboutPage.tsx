import React from 'react';
import { useRestaurant } from '../../context/RestaurantContext';
import { useTableAvailability } from '../../hooks/useTableAvailability';
import { hoursSummary } from '../../utils/openingHours';
import { ButtonLink } from '../../components/ui/Button';
import { Reveal } from '../../components/ui/Section';

export const AboutPage: React.FC = () => {
  const { settings } = useRestaurant();
  const { data: tableAvailability, isError: isTablesError } = useTableAvailability();

  const totalTables = !isTablesError && tableAvailability?.totalTables ? tableAvailability.totalTables : settings.tableCount;
  const hours = hoursSummary(settings.openingHours);

  const facts = [
    { label: 'Where', value: settings.address },
    { label: 'Hours', value: hours.map((h) => `${h.label}: ${h.value}`).join('\n') },
    { label: 'Seating', value: totalTables ? `${totalTables} tables for dine-in` : null },
    { label: 'Ordering', value: 'Dine-in or takeaway, ordered online or at the counter. You pay at the restaurant.' },
  ].filter((f) => f.value);

  return (
    <div className="container-content pb-24 pt-10 sm:pt-14">
      <header className="max-w-3xl">
        <p className="eyebrow">About</p>
        <h1 className="mt-3 font-serif text-4xl text-ink">{settings.name}</h1>
        {settings.description && <p className="mt-6 text-lg text-muted">{settings.description}</p>}
      </header>

      <Reveal as="section" aria-labelledby="facts-title" className="mt-16 border-t border-line pt-12">
        <h2 id="facts-title" className="sr-only">
          At a glance
        </h2>
        <dl className="grid gap-x-10 gap-y-8 sm:grid-cols-2">
          {facts.map((f) => (
            <div key={f.label}>
              <dt className="eyebrow">{f.label}</dt>
              <dd className="mt-2 whitespace-pre-line text-base text-ink">{f.value}</dd>
            </div>
          ))}
        </dl>
      </Reveal>

      <Reveal className="mt-16 flex flex-wrap gap-3">
        <ButtonLink to="/menu">See the menu</ButtonLink>
        <ButtonLink to="/reservation" variant="secondary">
          Book a table
        </ButtonLink>
      </Reveal>
    </div>
  );
};
