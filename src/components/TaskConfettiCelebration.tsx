import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, X } from 'lucide-react';

interface Particle {
  id: number;
  x: number;
  y: number;
  rotation: number;
  scale: number;
  color: string;
  shape: 'circle' | 'square' | 'strip';
  delay: number;
}

const CONFETTI_COLORS = [
  '#10b981', // Emerald
  '#059669', // Dark Emerald
  '#3b82f6', // Sky Blue
  '#2563eb', // Royal Blue
  '#f59e0b', // Amber
  '#d97706', // Warm Gold
  '#8b5cf6', // Violet
  '#ec4899', // Pink
  '#14b8a6', // Teal
];

// Generate subtle confetti particles
const generateParticles = (count: number = 32): Particle[] => {
  return Array.from({ length: count }, (_, i) => {
    const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
    const distance = 60 + Math.random() * 110;
    const shapes: ('circle' | 'square' | 'strip')[] = ['circle', 'square', 'strip'];
    return {
      id: i,
      x: Math.cos(angle) * distance,
      y: Math.sin(angle) * distance - 20,
      rotation: Math.random() * 360,
      scale: 0.6 + Math.random() * 0.7,
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      shape: shapes[Math.floor(Math.random() * shapes.length)],
      delay: Math.random() * 0.1,
    };
  });
};

interface TaskConfettiCelebrationProps {
  show: boolean;
  taskTitle?: string;
  onDismiss: () => void;
}

export const TaskConfettiCelebration: React.FC<TaskConfettiCelebrationProps> = ({
  show,
  taskTitle,
  onDismiss,
}) => {
  const particles = React.useMemo(() => generateParticles(36), [show]);

  useEffect(() => {
    if (!show) return;
    const timer = setTimeout(() => {
      onDismiss();
    }, 4000);
    return () => clearTimeout(timer);
  }, [show, onDismiss]);

  return (
    <AnimatePresence>
      {show && (
        <div className="fixed inset-0 pointer-events-none z-50 flex items-start justify-center pt-8 sm:pt-12 px-4">
          {/* Subtle Confetti Particles Burst from Top-Center */}
          <div className="absolute top-20 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
            {particles.map((p) => (
              <motion.div
                key={p.id}
                initial={{
                  x: 0,
                  y: 0,
                  scale: 0,
                  rotate: 0,
                  opacity: 1,
                }}
                animate={{
                  x: p.x * 2.2,
                  y: p.y * 2.2 + 80,
                  scale: p.scale,
                  rotate: p.rotation + 360,
                  opacity: [1, 1, 0.8, 0],
                }}
                transition={{
                  duration: 1.8 + Math.random() * 0.6,
                  ease: [0.25, 0.1, 0.25, 1],
                  delay: p.delay,
                }}
                style={{
                  backgroundColor: p.color,
                  width: p.shape === 'strip' ? '12px' : p.shape === 'circle' ? '8px' : '9px',
                  height: p.shape === 'strip' ? '5px' : p.shape === 'circle' ? '8px' : '9px',
                  borderRadius: p.shape === 'circle' ? '9999px' : p.shape === 'strip' ? '2px' : '3px',
                }}
                className="absolute shadow-xs"
              />
            ))}
          </div>

          {/* Celebratory Floating Toast Card with Framer Motion Check-Mark */}
          <motion.div
            initial={{ opacity: 0, y: -30, scale: 0.88 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.92, transition: { duration: 0.2 } }}
            transition={{ type: 'spring', stiffness: 450, damping: 28 }}
            className="pointer-events-auto bg-white/95 backdrop-blur-md border border-emerald-200/90 shadow-2xl rounded-2xl p-3.5 sm:p-4 max-w-md w-full flex items-center justify-between gap-3 text-slate-800 ring-1 ring-emerald-500/10"
          >
            <div className="flex items-center space-x-3 min-w-0">
              {/* Animated SVG Check-mark in glowing emerald circle */}
              <div className="relative shrink-0 flex items-center justify-center">
                <motion.div
                  initial={{ scale: 0, rotate: -45 }}
                  animate={{ scale: [0, 1.28, 1], rotate: 0 }}
                  transition={{ duration: 0.5, ease: 'backOut' }}
                  className="h-10 w-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-0.5 shadow-md shadow-emerald-500/25 flex items-center justify-center text-white"
                >
                  <div className="h-full w-full bg-emerald-600 rounded-[10px] flex items-center justify-center">
                    <svg
                      className="h-5 w-5 text-white"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <motion.path
                        d="M4.5 12.75l6 6 9-13.5"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 0.45, delay: 0.15, ease: 'easeOut' }}
                      />
                    </svg>
                  </div>
                </motion.div>

                {/* Subtle ping pulse */}
                <motion.div
                  initial={{ scale: 0.8, opacity: 0.8 }}
                  animate={{ scale: 1.8, opacity: 0 }}
                  transition={{ duration: 1, repeat: 1, ease: 'easeOut' }}
                  className="absolute inset-0 rounded-xl bg-emerald-400 -z-10"
                />
              </div>

              <div className="min-w-0">
                <div className="flex items-center space-x-1.5">
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-1.5">
                    <span>Task Completed!</span>
                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-md">
                      <Sparkles className="h-3 w-3 text-emerald-600" />
                      100%
                    </span>
                  </h4>
                </div>
                <p className="text-[11px] text-slate-600 truncate mt-0.5 max-w-[240px] sm:max-w-[280px]">
                  {taskTitle ? `"${taskTitle}"` : 'Great progress on this deliverable!'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onDismiss}
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer shrink-0"
              title="Dismiss"
            >
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

// Interactive Micro-Checkmark Component with local confetti burst for individual task cards
interface TaskCardCheckmarkProps {
  isCompleted: boolean;
  isCelebrating: boolean;
  disabled?: boolean;
  onToggle: () => void;
}

export const TaskCardCheckmark: React.FC<TaskCardCheckmarkProps> = ({
  isCompleted,
  isCelebrating,
  disabled = false,
  onToggle,
}) => {
  const localParticles = React.useMemo(() => {
    return Array.from({ length: 14 }, (_, i) => {
      const angle = (Math.PI * 2 * i) / 14 + (Math.random() - 0.5) * 0.3;
      const distance = 24 + Math.random() * 28;
      return {
        id: i,
        x: Math.cos(angle) * distance,
        y: Math.sin(angle) * distance,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        scale: 0.5 + Math.random() * 0.5,
      };
    });
  }, [isCelebrating]);

  return (
    <div className="relative flex items-center justify-center shrink-0">
      {/* Local micro confetti burst on complete */}
      {isCelebrating && (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-20">
          {localParticles.map((p) => (
            <motion.div
              key={p.id}
              initial={{ x: 0, y: 0, scale: 0, opacity: 1 }}
              animate={{
                x: p.x,
                y: p.y,
                scale: p.scale,
                opacity: [1, 1, 0],
              }}
              transition={{
                duration: 0.85,
                ease: 'easeOut',
              }}
              style={{
                backgroundColor: p.color,
                width: '5px',
                height: '5px',
                borderRadius: '9999px',
              }}
              className="absolute"
            />
          ))}
        </div>
      )}

      <motion.button
        type="button"
        whileTap={{ scale: disabled ? 1 : 0.88 }}
        whileHover={{ scale: disabled ? 1 : 1.08 }}
        onClick={(e) => {
          e.stopPropagation();
          if (!disabled) onToggle();
        }}
        disabled={disabled}
        aria-label={isCompleted ? 'Mark task as incomplete' : 'Mark task as complete'}
        className={`h-6 w-6 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
          isCompleted
            ? 'bg-emerald-500 text-white shadow-xs shadow-emerald-500/30'
            : 'border-2 border-slate-300 hover:border-emerald-500 hover:bg-emerald-50/50 text-transparent'
        } ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
        title={
          disabled
            ? 'Only assigned member or super admin can toggle status'
            : isCompleted
              ? 'Click to reopen task'
              : 'Click to mark as complete'
        }
      >
        <svg
          className="h-3.5 w-3.5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {isCompleted ? (
            <motion.path
              d="M4.5 12.75l6 6 9-13.5"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.32, ease: 'easeOut' }}
            />
          ) : (
            <path d="M4.5 12.75l6 6 9-13.5" className="opacity-0 hover:opacity-30 stroke-emerald-500" />
          )}
        </svg>
      </motion.button>
    </div>
  );
};
