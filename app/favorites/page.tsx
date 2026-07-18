"use client";

import { useFavorites } from "@/hooks/use-favorites";
import { motion } from "framer-motion";
import { Star, Rocket, Activity, Image as ImageIcon, AlertTriangle } from "lucide-react";
import Image from "next/image";
import { FavoriteButton } from "@/components/ui/favorite-button";
import { formatDistanceToNow } from "date-fns";

export default function FavoritesPage() {
  const { favorites } = useFavorites();

  const getIcon = (type: string) => {
    switch (type) {
      case "apod":
        return <ImageIcon className="w-5 h-5 text-blue-400" />;
      case "spacex":
        return <Rocket className="w-5 h-5 text-violet-400" />;
      case "earthquake":
        return <Activity className="w-5 h-5 text-emerald-400" />;
      case "asteroid":
        return <AlertTriangle className="w-5 h-5 text-orange-400" />;
      default:
        return <Star className="w-5 h-5 text-yellow-400" />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-6 border border-yellow-500/20"
      >
        <div className="flex items-center gap-3 mb-2">
          <Star className="w-6 h-6 text-yellow-400 fill-yellow-400" />
          <h1 className="text-2xl font-bold text-white">Your Favorites</h1>
        </div>
        <p className="text-white/50">
          Saved space events, imagery, and alerts.
        </p>
      </motion.div>

      {favorites.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-20"
        >
          <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
            <Star className="w-8 h-8 text-white/20" />
          </div>
          <h3 className="text-white font-medium text-lg">No favorites yet</h3>
          <p className="text-white/40 mt-1">
            Click the star icon on any card to save it here.
          </p>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {favorites.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="glass-card overflow-hidden flex flex-col"
            >
              {item.imageUrl && (
                <div className="relative h-48 w-full">
                  <Image
                    src={item.imageUrl}
                    alt={item.title}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                </div>
              )}
              <div className="p-4 flex-1 flex flex-col relative z-10">
                <div className="flex items-start justify-between gap-4 mb-2">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-white/5 backdrop-blur-sm border border-white/10">
                      {getIcon(item.type)}
                    </div>
                    <div>
                      <h3 className="text-white font-medium leading-tight">{item.title}</h3>
                      {item.subtitle && (
                        <p className="text-white/50 text-xs mt-0.5">{item.subtitle}</p>
                      )}
                    </div>
                  </div>
                  <FavoriteButton item={item} />
                </div>
                {item.date && (
                  <p className="text-white/30 text-xs mt-auto pt-4">
                    {formatDistanceToNow(new Date(item.date), { addSuffix: true })}
                  </p>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
