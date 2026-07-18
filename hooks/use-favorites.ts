import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type FavoriteType = 'apod' | 'asteroid' | 'earthquake' | 'spacex';

export interface FavoriteItem {
  id: string;
  type: FavoriteType;
  title: string;
  subtitle: string;
  imageUrl?: string;
  date: string;
  data?: any; // The raw object data
}

interface FavoritesState {
  favorites: FavoriteItem[];
  addFavorite: (item: FavoriteItem) => void;
  removeFavorite: (id: string) => void;
  isFavorite: (id: string) => boolean;
}

export const useFavorites = create<FavoritesState>()(
  persist(
    (set, get) => ({
      favorites: [],
      addFavorite: (item) => set((state) => ({ favorites: [...state.favorites, item] })),
      removeFavorite: (id) =>
        set((state) => ({
          favorites: state.favorites.filter((fav) => fav.id !== id),
        })),
      isFavorite: (id) => get().favorites.some((fav) => fav.id === id),
    }),
    {
      name: 'nebula-favorites',
    }
  )
);
