"use client";

import { useState, useEffect, useCallback } from "react";

export type FavoriteStation = {
  id: string;
  name: string;
};

export function useFavorites() {
  const [favorites, setFavorites] = useState<FavoriteStation[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem("trainflow_favorites");
    if (saved) {
      try {
        setFavorites(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse favorites", e);
      }
    }
  }, []);

  const saveFavorites = (newFavs: FavoriteStation[]) => {
    setFavorites(newFavs);
    localStorage.setItem("trainflow_favorites", JSON.stringify(newFavs));
  };

  const addFavorite = useCallback((station: FavoriteStation) => {
    setFavorites((prev) => {
      if (prev.find((f) => f.id === station.id)) return prev;
      const newFavs = [...prev, station];
      localStorage.setItem("trainflow_favorites", JSON.stringify(newFavs));
      return newFavs;
    });
  }, []);

  const removeFavorite = useCallback((id: string) => {
    setFavorites((prev) => {
      const newFavs = prev.filter((f) => f.id !== id);
      localStorage.setItem("trainflow_favorites", JSON.stringify(newFavs));
      return newFavs;
    });
  }, []);

  const isFavorite = useCallback(
    (id: string) => {
      return favorites.some((f) => f.id === id);
    },
    [favorites],
  );

  const toggleFavorite = useCallback(
    (station: FavoriteStation) => {
      if (isFavorite(station.id)) {
        removeFavorite(station.id);
      } else {
        addFavorite(station);
      }
    },
    [isFavorite, addFavorite, removeFavorite],
  );

  return {
    favorites,
    addFavorite,
    removeFavorite,
    isFavorite,
    toggleFavorite,
  };
}
