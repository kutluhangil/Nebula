"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, Star, Rocket, Activity, AlertTriangle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

export function SearchModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setQuery("");
    }
  }, [isOpen]);

  // We could fetch actual data, or just use some mock search logic. Let's do a basic quick-search across routes and known events.
  // For a real app, this would hit an API endpoint like /api/search?q=query
  
  const handleSelect = (href: string) => {
    router.push(href);
    onClose();
  };

  const results = [
    { label: "Dashboard", href: "/dashboard", icon: Activity, type: "Page" },
    { label: "Space Observatory", href: "/space", icon: Star, type: "Page" },
    { label: "Earth Intelligence", href: "/earth", icon: Activity, type: "Page" },
    { label: "SpaceX Launches", href: "/launches", icon: Rocket, type: "Page" },
    { label: "Favorites", href: "/favorites", icon: Star, type: "Page" },
  ].filter((item) => item.label.toLowerCase().includes(query.toLowerCase()));

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-start justify-center pt-20 px-4 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: -20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: -20 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-xl bg-[#0a0a0a] border border-white/10 rounded-2xl overflow-hidden shadow-2xl"
          >
            <div className="flex items-center px-4 py-3 border-b border-white/10">
              <Search className="w-5 h-5 text-white/40" />
              <input
                ref={inputRef}
                type="text"
                placeholder="Search planets, missions, events..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="flex-1 bg-transparent border-none text-white px-4 py-2 focus:outline-none placeholder:text-white/30"
              />
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-white/40 hover:bg-white/10 hover:text-white/80 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="max-h-[60vh] overflow-y-auto p-2">
              {query.length > 0 && results.length === 0 ? (
                <div className="p-8 text-center text-white/40">
                  No results found for "{query}"
                </div>
              ) : (
                <div className="space-y-1">
                  {results.map((result, i) => (
                    <button
                      key={i}
                      onClick={() => handleSelect(result.href)}
                      className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/[0.04] text-left transition-colors group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-white/[0.02] border border-white/[0.05] flex items-center justify-center flex-shrink-0 group-hover:bg-white/[0.08] transition-colors">
                        <result.icon className="w-4 h-4 text-white/40 group-hover:text-white/80" />
                      </div>
                      <div>
                        <div className="text-white/80 font-medium">{result.label}</div>
                        <div className="text-white/30 text-xs">{result.type}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
