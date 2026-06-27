'use client'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface BloomieProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  message?: string
  animate?: boolean
  className?: string
}

const sizes = { sm: 48, md: 80, lg: 120, xl: 160 }

export function BloomieAvatar({ size = 'md', animate = true, className }: Omit<BloomieProps, 'message'>) {
  const px = sizes[size]
  return (
    <motion.div
      className={cn('relative select-none', className)}
      animate={animate ? { y: [0, -8, 0] } : undefined}
      transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
      style={{ width: px, height: px }}
    >
      <svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg" width={px} height={px}>
        {/* Glow */}
        <defs>
          <radialGradient id="bloomGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#A78BFA" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#A78BFA" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="bodyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#C4B5FD" />
            <stop offset="100%" stopColor="#A78BFA" />
          </linearGradient>
        </defs>
        <circle cx="60" cy="60" r="56" fill="url(#bloomGlow)" />
        {/* Body */}
        <circle cx="60" cy="64" r="42" fill="url(#bodyGrad)" />
        {/* Cheeks */}
        <ellipse cx="42" cy="72" rx="9" ry="6" fill="#F472B6" opacity="0.5" />
        <ellipse cx="78" cy="72" rx="9" ry="6" fill="#F472B6" opacity="0.5" />
        {/* Eyes */}
        <ellipse cx="48" cy="60" rx="7" ry="8" fill="#1a0a2e" />
        <ellipse cx="72" cy="60" rx="7" ry="8" fill="#1a0a2e" />
        <circle cx="51" cy="57" r="2.5" fill="white" />
        <circle cx="75" cy="57" r="2.5" fill="white" />
        {/* Smile */}
        <path d="M50 76 Q60 85 70 76" stroke="#1a0a2e" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        {/* Ears */}
        <ellipse cx="20" cy="54" rx="8" ry="12" fill="#C4B5FD" />
        <ellipse cx="100" cy="54" rx="8" ry="12" fill="#C4B5FD" />
        <ellipse cx="20" cy="54" rx="4" ry="8" fill="#F472B6" opacity="0.5" />
        <ellipse cx="100" cy="54" rx="4" ry="8" fill="#F472B6" opacity="0.5" />
        {/* Sparkles */}
        <text x="8" y="24" fontSize="14">✨</text>
        <text x="94" y="22" fontSize="12">🌸</text>
      </svg>
    </motion.div>
  )
}

export function BloomieChat({ message, size = 'md', className }: BloomieProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn('flex items-end gap-3', className)}
    >
      <BloomieAvatar size={size} />
      <div className="glass px-4 py-3 rounded-2xl rounded-bl-sm max-w-xs">
        <p className="text-sm text-white/90 leading-relaxed">{message}</p>
      </div>
    </motion.div>
  )
}
