'use client';

import { AnimatePresence, motion } from 'framer-motion';

export default function BottomSheet({
  open,
  onClose,
  children,
  className = '',
  mobileOnly = true,
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className={`fixed inset-0 z-40 flex items-end justify-center bg-black/30 ${
            mobileOnly ? 'sm:hidden' : ''
          }`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className={`w-full max-w-md rounded-t-2xl bg-white px-4 pt-4 pb-6 shadow-xl ${className}`}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 32 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={0.2}
            onClick={(e) => e.stopPropagation()}
            onDragEnd={(_, info) => {
              if (info.offset.y > 80 || info.velocity.y > 500) {
                onClose?.();
              }
            }}
          >
            <div className="mb-3 flex justify-center pt-1 pb-2 cursor-pointer" onClick={onClose}>
              <div className="h-1 w-10 rounded-full bg-[#e5e3d8]" />
            </div>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
