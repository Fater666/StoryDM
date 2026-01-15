import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { cn } from '@/utils/cn';
import type { DiceType, DiceRoll } from '@/types';
import { rollDiceSet, formatDiceRoll, isCriticalSuccess, isCriticalFailure } from '@/utils/dice';

interface DiceRollerProps {
  diceType: DiceType;
  count?: number;
  modifier?: number;
  onRoll?: (result: DiceRoll) => void;
  size?: 'sm' | 'md' | 'lg';
}

export function DiceRoller({ diceType, count = 1, modifier = 0, onRoll, size = 'md' }: DiceRollerProps) {
  const [isRolling, setIsRolling] = useState(false);
  const [result, setResult] = useState<DiceRoll | null>(null);
  
  const sizes = {
    sm: 'w-12 h-12 text-lg',
    md: 'w-16 h-16 text-xl',
    lg: 'w-20 h-20 text-2xl',
  };
  
  const handleRoll = () => {
    setIsRolling(true);
    setResult(null);
    
    // 模拟掷骰动画时间
    setTimeout(() => {
      const roll = rollDiceSet(diceType, count, modifier);
      setResult(roll);
      setIsRolling(false);
      onRoll?.(roll);
    }, 600);
  };
  
  const isCrit = result && isCriticalSuccess(result.results, diceType);
  const isFumble = result && isCriticalFailure(result.results, diceType);
  
  return (
    <div className="flex flex-col items-center gap-3">
      <motion.button
        className={cn(
          'relative flex items-center justify-center rounded-xl',
          'bg-gradient-to-br from-arcane-primary to-arcane-secondary',
          'text-white font-mono font-bold',
          'shadow-arcane hover:shadow-arcane-lg transition-shadow',
          'cursor-pointer select-none',
          sizes[size]
        )}
        onClick={handleRoll}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        animate={isRolling ? {
          rotate: [0, 90, 180, 270, 360],
          scale: [1, 1.1, 1, 1.1, 1],
        } : {}}
        transition={{ duration: 0.6, ease: 'easeInOut' }}
      >
        {/* 骰子图标装饰 */}
        <div className="absolute inset-0 rounded-xl border-2 border-arcane-glow/30" />
        <span className="relative z-10">
          {isRolling ? '?' : diceType.toUpperCase()}
        </span>
      </motion.button>
      
      <AnimatePresence mode="wait">
        {result && (
          <motion.div
            className={cn(
              'text-center',
              isCrit && 'text-gold-light',
              isFumble && 'text-blood-primary'
            )}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
          >
            <div className={cn(
              'text-2xl font-display font-bold',
              isCrit && 'animate-pulse text-shadow-glow',
              isFumble && 'opacity-70'
            )}>
              {result.total}
            </div>
            <div className="text-sm text-parchment-light/60">
              {formatDiceRoll(result)}
            </div>
            {isCrit && (
              <motion.div
                className="text-gold-light font-display text-sm mt-1"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
              >
                ⚔️ 大成功！
              </motion.div>
            )}
            {isFumble && (
              <motion.div
                className="text-blood-primary font-display text-sm mt-1"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
              >
                💀 大失败...
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// 骰子结果展示组件
interface DiceResultProps {
  roll: DiceRoll;
  label?: string;
}

export function DiceResult({ roll, label }: DiceResultProps) {
  const isCrit = isCriticalSuccess(roll.results, roll.type);
  const isFumble = isCriticalFailure(roll.results, roll.type);
  
  return (
    <div className={cn(
      'inline-flex items-center gap-2 px-3 py-1.5 rounded-lg',
      'bg-forge-surface border border-forge-border',
      isCrit && 'border-gold-primary bg-gold-primary/10',
      isFumble && 'border-blood-primary bg-blood-primary/10'
    )}>
      <span className={cn(
        'w-8 h-8 flex items-center justify-center rounded',
        'bg-arcane-primary text-white font-mono font-bold text-sm'
      )}>
        {roll.type}
      </span>
      <div>
        {label && <div className="text-xs text-parchment-light/60">{label}</div>}
        <div className={cn(
          'font-display font-bold',
          isCrit && 'text-gold-light',
          isFumble && 'text-blood-primary'
        )}>
          {roll.total}
        </div>
      </div>
    </div>
  );
}

