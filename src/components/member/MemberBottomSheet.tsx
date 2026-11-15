'use client';

import { useEffect, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { cn } from '@/src/lib/utils';

interface MemberBottomSheetProps {
  open: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: ReactNode;
  maxWidthClass?: string;
}

export function MemberBottomSheet({
  open,
  title,
  subtitle,
  onClose,
  children,
  maxWidthClass = 'md:max-w-lg',
}: MemberBottomSheetProps) {
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="member-sheet-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.16 }}
          className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/60 backdrop-blur-[2px] md:items-center md:p-4"
          role="dialog"
          aria-modal="true"
          aria-label={title}
          onClick={onClose}
        >
          <motion.div
            initial={{ y: '100%', opacity: 0.9 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0.9 }}
            transition={{ type: 'spring', stiffness: 360, damping: 34 }}
            className={cn(
              'flex max-h-[88vh] w-full flex-col overflow-hidden rounded-t-3xl border-t border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900 md:rounded-3xl md:border',
              maxWidthClass
            )}
            onClick={(event) => event.stopPropagation()}
          >
            {/* Android Sheet Drag Handle (Mobile) */}
            <div className="flex justify-center pt-3 pb-1 md:hidden" aria-hidden="true">
              <span className="h-1.5 w-11 rounded-full bg-slate-300 dark:bg-slate-700" />
            </div>

            <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-5 py-3.5 dark:border-slate-800">
              <div className="min-w-0">
                <h2 className="truncate font-display text-base font-bold text-slate-900 dark:text-slate-100">
                  {title}
                </h2>
                {subtitle && (
                  <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">
                    {subtitle}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label={`Tutup ${title}`}
                className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 active:scale-95 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100 cursor-pointer"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
