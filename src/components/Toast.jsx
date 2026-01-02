import { motion, AnimatePresence } from 'framer-motion';

export function Toast({ notification }) {
  return (
    <AnimatePresence>
      {notification && (
        <motion.div 
          initial={{ opacity: 0, y: -20, x: '-50%' }} 
          animate={{ opacity: 1, y: 0, x: '-50%' }} 
          exit={{ opacity: 0, y: -20, x: '-50%' }}
          className={`fixed top-6 left-1/2 z-[60] px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 border ${
            notification.type === 'success' ? 'bg-zinc-900 text-white border-zinc-800' : 'bg-red-600 text-white border-red-700'
          }`}
        >
          <span className="font-medium text-sm">{notification.message}</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}