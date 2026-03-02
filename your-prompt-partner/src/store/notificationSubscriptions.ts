import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type NotifCategory = 'war' | 'cyber' | 'earthquakes' | 'news';

export interface CountrySubscription {
  countryCode: string;
  countryName: string;
  categories: NotifCategory[];
}

interface NotifSubStore {
  subscriptions: Record<string, CountrySubscription>; // keyed by countryCode
  subscribe: (code: string, name: string, categories: NotifCategory[]) => void;
  unsubscribe: (code: string) => void;
  toggleCategory: (code: string, name: string, cat: NotifCategory) => void;
  isSubscribed: (code: string) => boolean;
  getCategories: (code: string) => NotifCategory[];
}

export const useNotifSubStore = create<NotifSubStore>()(
  persist(
    (set, get) => ({
      subscriptions: {},

      subscribe: (code, name, categories) =>
        set(state => ({
          subscriptions: {
            ...state.subscriptions,
            [code]: { countryCode: code, countryName: name, categories },
          },
        })),

      unsubscribe: (code) =>
        set(state => {
          const { [code]: _, ...rest } = state.subscriptions;
          return { subscriptions: rest };
        }),

      toggleCategory: (code, name, cat) =>
        set(state => {
          const existing = state.subscriptions[code];
          if (!existing) {
            return {
              subscriptions: {
                ...state.subscriptions,
                [code]: { countryCode: code, countryName: name, categories: [cat] },
              },
            };
          }
          const has = existing.categories.includes(cat);
          const newCats = has
            ? existing.categories.filter(c => c !== cat)
            : [...existing.categories, cat];
          if (newCats.length === 0) {
            const { [code]: _, ...rest } = state.subscriptions;
            return { subscriptions: rest };
          }
          return {
            subscriptions: {
              ...state.subscriptions,
              [code]: { ...existing, categories: newCats },
            },
          };
        }),

      isSubscribed: (code) => !!get().subscriptions[code],
      getCategories: (code) => get().subscriptions[code]?.categories ?? [],
    }),
    { name: 'worldview-notif-subs' }
  )
);
