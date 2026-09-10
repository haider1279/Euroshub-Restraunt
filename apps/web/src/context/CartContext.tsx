import React, { createContext, useContext, useState, useEffect } from 'react';
import { CartItem, MenuItem, ProductVariant, ProductAddon } from '../types';
import { toast } from 'sonner';

interface CartContextType {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  deliveryFee: number;
  total: number;
  addItem: (
    menuItem: MenuItem,
    variantOrQty?: ProductVariant | null | number,
    addons?: ProductAddon[],
    quantity?: number
  ) => void;
  removeItem: (cartItemId: string) => void;
  updateQuantity: (cartItemId: string, quantity: number) => void;
  clearCart: () => void;
  setDeliveryFee: (fee: number) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('euroshub_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [deliveryFee, setDeliveryFee] = useState<number>(0);

  useEffect(() => {
    localStorage.setItem('euroshub_cart', JSON.stringify(items));
  }, [items]);

  const addItem = (
    menuItem: MenuItem,
    variantOrQty?: ProductVariant | null | number,
    addons?: ProductAddon[],
    quantity: number = 1
  ) => {
    if (!menuItem.isAvailable) {
      toast.error(`"${menuItem.name}" is currently unavailable.`);
      return;
    }

    let chosenVariant: ProductVariant | null = null;
    let chosenAddons: ProductAddon[] = addons || [];
    let qty = quantity;

    if (typeof variantOrQty === 'number') {
      qty = variantOrQty;
      // Default to first variant if item has variants
      if (menuItem.variants && menuItem.variants.length > 0) {
        chosenVariant = menuItem.variants[0];
      }
    } else if (variantOrQty) {
      chosenVariant = variantOrQty;
    } else if (menuItem.variants && menuItem.variants.length > 0) {
      chosenVariant = menuItem.variants[0];
    }

    const basePrice = chosenVariant ? Number(chosenVariant.price) : Number(menuItem.price);
    const addonsPrice = chosenAddons.reduce((sum, a) => sum + Number(a.price), 0);
    const unitPrice = basePrice + addonsPrice;

    // Generate unique line ID based on item and selected variant
    const lineId = `${menuItem.id}${chosenVariant ? `-${chosenVariant.id}` : ''}`;

    setItems((prev) => {
      const existing = prev.find((i) => i.id === lineId);
      if (existing) {
        const newQty = existing.quantity + qty;
        toast.success(
          `Updated "${menuItem.name}${chosenVariant ? ` (${chosenVariant.name})` : ''}" quantity (${newQty})`
        );
        return prev.map((i) => (i.id === lineId ? { ...i, quantity: newQty } : i));
      }

      toast.success(`Added "${menuItem.name}${chosenVariant ? ` (${chosenVariant.name})` : ''}" to cart`);
      return [
        ...prev,
        {
          id: lineId,
          menuItem,
          variant: chosenVariant,
          addons: chosenAddons,
          unitPrice,
          quantity: qty,
        },
      ];
    });
  };

  const removeItem = (cartItemId: string) => {
    setItems((prev) => {
      const item = prev.find((i) => i.id === cartItemId || i.menuItem.id === cartItemId);
      if (item) {
        toast.info(`Removed "${item.menuItem.name}" from cart`);
      }
      return prev.filter((i) => i.id !== cartItemId && i.menuItem.id !== cartItemId);
    });
  };

  const updateQuantity = (cartItemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(cartItemId);
      return;
    }
    setItems((prev) =>
      prev.map((i) =>
        i.id === cartItemId || i.menuItem.id === cartItemId ? { ...i, quantity } : i
      )
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);
  const subtotal = items.reduce((sum, i) => sum + (i.unitPrice || Number(i.menuItem.price)) * i.quantity, 0);
  const total = subtotal > 0 ? subtotal + deliveryFee : 0;

  return (
    <CartContext.Provider
      value={{
        items,
        itemCount,
        subtotal: parseFloat(subtotal.toFixed(2)),
        deliveryFee,
        total: parseFloat(total.toFixed(2)),
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        setDeliveryFee,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
