import React, { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '../../utils/cn';

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** Focus in on open, trap Tab, close on Escape, restore focus and scroll on close. */
function useOverlay(isOpen: boolean, onClose: () => void, panelRef: React.RefObject<HTMLElement>) {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!isOpen) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';

    const panel = panelRef.current;
    const first = panel?.querySelector<HTMLElement>('[data-autofocus]') || panel?.querySelector<HTMLElement>(FOCUSABLE);
    (first || panel)?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onCloseRef.current();
        return;
      }
      if (e.key !== 'Tab' || !panel) return;
      const items = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((el) => el.offsetParent !== null);
      if (items.length === 0) return;
      const firstItem = items[0];
      const lastItem = items[items.length - 1];
      if (e.shiftKey && document.activeElement === firstItem) {
        e.preventDefault();
        lastItem.focus();
      } else if (!e.shiftKey && document.activeElement === lastItem) {
        e.preventDefault();
        firstItem.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
      previouslyFocused?.focus?.();
    };
  }, [isOpen, panelRef]);
}

const CloseButton: React.FC<{ onClick: () => void; label?: string }> = ({ onClick, label = 'Close' }) => (
  <button
    type="button"
    onClick={onClick}
    aria-label={label}
    className="pressable -mr-2 inline-flex h-11 w-11 items-center justify-center rounded-full text-muted hover:bg-ink/[0.06] hover:text-ink"
  >
    <X className="h-5 w-5" />
  </button>
);

interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
}

const WIDTHS = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-lg', xl: 'max-w-xl', '2xl': 'max-w-2xl' };

export const Dialog: React.FC<DialogProps> = ({ isOpen, onClose, title, description, children, footer, maxWidth = 'md' }) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  useOverlay(isOpen, onClose, panelRef);
  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center sm:p-6">
      <div className="overlay-enter absolute inset-0 bg-night/80" onClick={onClose} aria-hidden="true" />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        tabIndex={-1}
        className={cn(
          'dialog-enter relative flex max-h-[92vh] w-full flex-col rounded-t-lg border border-line-strong bg-surface shadow-overlay sm:rounded-lg',
          WIDTHS[maxWidth]
        )}
      >
        <div className="flex items-start justify-between gap-4 px-5 pb-2 pt-4 sm:px-6 sm:pt-5">
          <div className="min-w-0 pt-2">
            {title && (
              <h2 id={titleId} className="font-serif text-xl text-ink">
                {title}
              </h2>
            )}
            {description && <p className="mt-1 text-sm text-muted">{description}</p>}
          </div>
          <CloseButton onClick={onClose} />
        </div>
        <div className="overflow-y-auto px-5 pb-5 sm:px-6 sm:pb-6">{children}</div>
        {footer && <div className="border-t border-line px-5 py-4 sm:px-6">{footer}</div>}
      </div>
    </div>,
    document.body
  );
};

/** Legacy name */
export const Modal = Dialog;

interface SheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  side?: 'right' | 'left';
  children: React.ReactNode;
}

/** Side panel, used for the mobile navigation menus. */
export const Sheet: React.FC<SheetProps> = ({ isOpen, onClose, title, side = 'right', children }) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  useOverlay(isOpen, onClose, panelRef);
  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[60]">
      <div className="overlay-enter absolute inset-0 bg-night/80" onClick={onClose} aria-hidden="true" />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        tabIndex={-1}
        className={cn(
          'absolute inset-y-0 flex w-[min(86vw,360px)] flex-col border-line-strong bg-canvas',
          side === 'right' ? 'sheet-enter-right right-0 border-l' : 'sheet-enter-left left-0 border-r'
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-line px-5">
          {title && (
            <h2 id={titleId} className="font-serif text-lg text-ink">
              {title}
            </h2>
          )}
          <CloseButton onClick={onClose} label="Close menu" />
        </div>
        <div className="flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>,
    document.body
  );
};
