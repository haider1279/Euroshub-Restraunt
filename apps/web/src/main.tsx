import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import App from './App';
import './index.css';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { RestaurantProvider } from './context/RestaurantContext';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <RestaurantProvider>
            <CartProvider>
              <App />
              {/* Sonner renders an aria-live region, so toasts are announced. */}
              <Toaster
                position="top-right"
                // Below the 64px navbar, away from bottom action bars
                offset={80}
                theme="dark"
                closeButton
                gap={8}
                toastOptions={{
                  unstyled: false,
                  classNames: {
                    toast: '!rounded-lg !border !border-line-strong !bg-raised !text-ink !font-sans !shadow-overlay',
                    title: '!text-sm !font-medium',
                    description: '!text-sm !text-muted',
                    success: '[&_[data-icon]]:!text-accent',
                    error: '[&_[data-icon]]:!text-danger',
                    info: '[&_[data-icon]]:!text-cyan',
                    warning: '[&_[data-icon]]:!text-warning',
                    closeButton: '!border-line-strong !bg-surface !text-muted hover:!text-ink',
                  },
                }}
              />
            </CartProvider>
          </RestaurantProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
);
