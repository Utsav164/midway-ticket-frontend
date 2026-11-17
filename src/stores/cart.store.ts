"use client";
// MidwayTicket — Cart Store (Zustand)
// Manages the customer booking cart. Currently single-item (one ride at a time).
// Future: may support multi-ride cart if product expands.

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartItem } from "@/types";
import { clamp } from "@/lib/utils";

interface CartState {
  item: CartItem | null;
  setItem: (item: CartItem) => void;
  updateQuantity: (qty: number) => void;
  clearCart: () => void;
  totalAmount: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      item: null,

      setItem: (item: CartItem) => set({ item }),

      updateQuantity: (qty: number) =>
        set((state) => ({
          item: state.item
            ? { ...state.item, quantity: clamp(qty, 1, 10) }
            : null,
        })),

      clearCart: () => set({ item: null }),

      totalAmount: () => {
        const { item } = get();
        return item ? item.pricePerPerson * item.quantity : 0;
      },
    }),
    { name: "midway-cart", partialize: (s) => ({ item: s.item }) }
  )
);
