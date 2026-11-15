'use client';

import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import type { AdBannerRecord } from '@/src/lib/dashboard-schema';

interface MemberAdPopupModalProps {
  open: boolean;
  ads: ReadonlyArray<AdBannerRecord>;
  onClose: () => void;
}

export function MemberAdPopupModal({
  open,
  ads,
  onClose,
}: MemberAdPopupModalProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  const handleClose = () => {
    setActiveIndex(0);
    onClose();
  };

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setActiveIndex(0);
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  const safeIndex = ads.length > 0 ? activeIndex % ads.length : 0;
  const currentAd = ads[safeIndex] ?? null;

  return (
    <AnimatePresence>
      {open && currentAd && (
        <motion.div
          key="member-ad-popup-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.16 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
          aria-labelledby="member-ad-popup-title"
          onClick={handleClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 10 }}
            transition={{ duration: 0.18 }}
            className="relative w-full max-w-sm overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={handleClose}
              aria-label="Tutup popup iklan"
              className="absolute right-3 top-3 z-20 inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white/95 text-slate-800 shadow-md transition-colors hover:bg-white hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-600 dark:border-slate-700 dark:bg-slate-900/95 dark:text-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>

            <div className="relative aspect-[3/4] w-full bg-slate-100 dark:bg-slate-950">
              <img
                src={currentAd.imageUrl}
                alt={currentAd.title}
                referrerPolicy="no-referrer"
                className="h-full w-full object-cover"
              />

              {ads.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() =>
                      setActiveIndex((prev) => (prev - 1 + ads.length) % ads.length)
                    }
                    aria-label="Iklan sebelumnya"
                    className="absolute left-3 top-1/2 z-10 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-slate-950/60 text-white hover:bg-slate-950/80 cursor-pointer"
                  >
                    <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setActiveIndex((prev) => (prev + 1) % ads.length)
                    }
                    aria-label="Iklan berikutnya"
                    className="absolute right-3 top-1/2 z-10 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-slate-950/60 text-white hover:bg-slate-950/80 cursor-pointer"
                  >
                    <ChevronRight className="h-4 w-4" aria-hidden="true" />
                  </button>
                </>
              )}
            </div>

            <div className="flex items-center justify-between gap-3 border-t border-slate-200 px-4 py-3 dark:border-slate-800">
              <div className="min-w-0">
                <h2
                  id="member-ad-popup-title"
                  className="truncate font-display text-sm font-bold text-slate-900 dark:text-slate-100"
                >
                  {currentAd.title}
                </h2>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                  {currentAd.showTime !== '-'
                    ? `Jadwal tampil: ${currentAd.showTime}`
                    : 'Promo aktif saat member login'}
                </p>
              </div>
              {ads.length > 1 && (
                <span className="shrink-0 font-mono-num text-xs font-medium text-slate-500 dark:text-slate-400">
                  {safeIndex + 1} / {ads.length}
                </span>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
