import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { cn } from '../../utils/cn';
import { useReveal } from '../../hooks/useReveal';

/** Fades and rises 12px the first time it scrolls into view. */
export const Reveal: React.FC<{ children: React.ReactNode; className?: string; as?: 'div' | 'section' } & React.HTMLAttributes<HTMLElement>> = ({
  children,
  className,
  as: Tag = 'div',
  ...props
}) => {
  const ref = useReveal<HTMLDivElement>();
  return (
    <Tag ref={ref as React.Ref<HTMLDivElement>} className={cn('reveal', className)} {...props}>
      {children}
    </Tag>
  );
};

interface SectionHeaderProps {
  id?: string;
  eyebrow?: string;
  title: string;
  description?: React.ReactNode;
  action?: { label: string; to: string };
  as?: 'h1' | 'h2';
  className?: string;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({ id, eyebrow, title, description, action, as: H = 'h2', className }) => (
  <div className={cn('flex flex-wrap items-end justify-between gap-x-6 gap-y-3', className)}>
    <div className="max-w-2xl">
      {eyebrow && <p className="eyebrow mb-3">{eyebrow}</p>}
      <H id={id} className={cn('font-serif text-ink', H === 'h1' ? 'text-4xl' : 'text-2xl sm:text-3xl')}>
        {title}
      </H>
      {description && <p className="mt-3 text-base text-muted">{description}</p>}
    </div>
    {action && (
      <Link to={action.to} className="group inline-flex min-h-11 items-center gap-1.5 text-sm text-muted hover:text-ink">
        {action.label}
        <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden="true" />
      </Link>
    )}
  </div>
);

/** Standard page heading block used at the top of inner pages. */
export const PageHeader: React.FC<{ eyebrow?: string; title: string; description?: React.ReactNode; children?: React.ReactNode }> = ({
  eyebrow,
  title,
  description,
  children,
}) => (
  <header className="border-b border-line pb-8 pt-10 sm:pt-14">
    {eyebrow && <p className="eyebrow mb-3">{eyebrow}</p>}
    <h1 className="font-serif text-4xl text-ink">{title}</h1>
    {description && <p className="mt-4 max-w-2xl text-base text-muted">{description}</p>}
    {children}
  </header>
);
