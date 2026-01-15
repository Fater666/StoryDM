import type { DiceType, DiceRoll } from '@/types';

// 获取骰子的最大值
export function getDiceMax(type: DiceType): number {
  const diceMaxMap: Record<DiceType, number> = {
    'd4': 4,
    'd6': 6,
    'd8': 8,
    'd10': 10,
    'd12': 12,
    'd20': 20,
    'd100': 100,
  };
  return diceMaxMap[type];
}

// 掷单个骰子
export function rollDice(type: DiceType): number {
  const max = getDiceMax(type);
  return Math.floor(Math.random() * max) + 1;
}

// 完整的掷骰系统
export function rollDiceSet(
  type: DiceType,
  count: number = 1,
  modifier: number = 0
): DiceRoll {
  const results: number[] = [];
  
  for (let i = 0; i < count; i++) {
    results.push(rollDice(type));
  }
  
  const sum = results.reduce((a, b) => a + b, 0);
  
  return {
    type,
    count,
    modifier,
    results,
    total: sum + modifier,
  };
}

// 格式化骰子结果为字符串
export function formatDiceRoll(roll: DiceRoll): string {
  const diceNotation = `${roll.count}${roll.type}`;
  const modifierStr = roll.modifier > 0 
    ? ` + ${roll.modifier}` 
    : roll.modifier < 0 
      ? ` - ${Math.abs(roll.modifier)}`
      : '';
  
  const resultsStr = roll.results.length > 1 
    ? ` (${roll.results.join(' + ')})` 
    : '';
  
  return `${diceNotation}${modifierStr}${resultsStr} = ${roll.total}`;
}

// 计算属性修正值 (D&D 5e 规则)
export function getAttributeModifier(value: number): number {
  return Math.floor((value - 10) / 2);
}

// 格式化修正值
export function formatModifier(modifier: number): string {
  return modifier >= 0 ? `+${modifier}` : `${modifier}`;
}

// 判定成功与否
export function isCheckSuccessful(roll: number, difficulty: number): boolean {
  return roll >= difficulty;
}

// 判定是否暴击 (自然20)
export function isCriticalSuccess(results: number[], diceType: DiceType): boolean {
  if (diceType !== 'd20') return false;
  return results.some(r => r === 20);
}

// 判定是否大失败 (自然1)
export function isCriticalFailure(results: number[], diceType: DiceType): boolean {
  if (diceType !== 'd20') return false;
  return results.every(r => r === 1);
}

