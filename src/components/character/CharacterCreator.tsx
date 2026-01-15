import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Dices, BookOpen, Brain, Heart, Sparkles, ChevronRight, ChevronLeft, Loader2 } from 'lucide-react';
import { Button, Input, Textarea, Card, Select } from '@/components/ui';
import { useCharacterStore, useAppStore } from '@/stores';
import type { Alignment, CharacterAttributes, CharacterSkills, CharacterBackground } from '@/types';
import { cn } from '@/utils/cn';
import { getAttributeModifier, formatModifier } from '@/utils/dice';

const ALIGNMENTS: { value: Alignment; label: string }[] = [
  { value: 'lawful-good', label: '守序善良' },
  { value: 'neutral-good', label: '中立善良' },
  { value: 'chaotic-good', label: '混乱善良' },
  { value: 'lawful-neutral', label: '守序中立' },
  { value: 'true-neutral', label: '绝对中立' },
  { value: 'chaotic-neutral', label: '混乱中立' },
  { value: 'lawful-evil', label: '守序邪恶' },
  { value: 'neutral-evil', label: '中立邪恶' },
  { value: 'chaotic-evil', label: '混乱邪恶' },
];

const RACES = [
  '人类', '精灵', '矮人', '半身人', '龙裔', '侏儒', '半精灵', '半兽人', '提夫林', '其他',
];

const CLASSES = [
  '战士', '法师', '游侠', '盗贼', '牧师', '圣骑士', '野蛮人', '吟游诗人', '德鲁伊', '武僧', '术士', '邪术师', '其他',
];

const ATTRIBUTE_NAMES: { key: keyof CharacterAttributes; name: string; abbr: string }[] = [
  { key: 'strength', name: '力量', abbr: 'STR' },
  { key: 'dexterity', name: '敏捷', abbr: 'DEX' },
  { key: 'constitution', name: '体质', abbr: 'CON' },
  { key: 'intelligence', name: '智力', abbr: 'INT' },
  { key: 'wisdom', name: '感知', abbr: 'WIS' },
  { key: 'charisma', name: '魅力', abbr: 'CHA' },
];

const DEFAULT_SKILLS: CharacterSkills = {
  combat: { '近战攻击': 0, '远程攻击': 0, '防御': 0, '先攻': 0 },
  social: { '说服': 0, '欺骗': 0, '威吓': 0, '表演': 0 },
  exploration: { '察觉': 0, '潜行': 0, '调查': 0, '生存': 0 },
  knowledge: { '奥秘': 0, '历史': 0, '自然': 0, '宗教': 0 },
};

export function CharacterCreator() {
  const [step, setStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // 基础信息
  const [name, setName] = useState('');
  const [race, setRace] = useState('人类');
  const [charClass, setCharClass] = useState('战士');
  const [alignment, setAlignment] = useState<Alignment>('true-neutral');
  const [level, setLevel] = useState(1);
  const [backstory, setBackstory] = useState('');
  
  // 属性
  const [attributes, setAttributes] = useState<CharacterAttributes>({
    strength: 10,
    dexterity: 10,
    constitution: 10,
    intelligence: 10,
    wisdom: 10,
    charisma: 10,
  });
  
  // 技能
  const [skills, setSkills] = useState<CharacterSkills>(DEFAULT_SKILLS);
  
  // 背景
  const [background, setBackground] = useState<CharacterBackground>({
    personality: '',
    ideal: '',
    bond: '',
    flaw: '',
  });
  
  const { createCharacter } = useCharacterStore();
  const { currentWorldId, setCurrentView } = useAppStore();
  
  const updateAttribute = (key: keyof CharacterAttributes, value: number) => {
    setAttributes(prev => ({ ...prev, [key]: Math.max(1, Math.min(20, value)) }));
  };
  
  const updateSkill = (category: keyof CharacterSkills, skillName: string, value: number) => {
    setSkills(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [skillName]: Math.max(-5, Math.min(10, value)),
      },
    }));
  };
  
  // 随机生成属性（4d6取最高3个）
  const rollAttributes = () => {
    const roll4d6 = () => {
      const rolls = Array.from({ length: 4 }, () => Math.floor(Math.random() * 6) + 1);
      rolls.sort((a, b) => b - a);
      return rolls.slice(0, 3).reduce((a, b) => a + b, 0);
    };
    
    setAttributes({
      strength: roll4d6(),
      dexterity: roll4d6(),
      constitution: roll4d6(),
      intelligence: roll4d6(),
      wisdom: roll4d6(),
      charisma: roll4d6(),
    });
  };
  
  const handleCreate = async () => {
    if (!currentWorldId || !name.trim()) return;
    
    setIsProcessing(true);
    try {
      await createCharacter({
        worldId: currentWorldId,
        name,
        race,
        class: charClass,
        alignment,
        level,
        backstory,
        attributes,
        skills,
        background,
      });
      setCurrentView('world-view');
    } catch (error) {
      console.error('创建角色失败:', error);
    } finally {
      setIsProcessing(false);
    }
  };
  
  const canProceed = () => {
    switch (step) {
      case 1: return name.trim().length > 0;
      case 2: return true;
      case 3: return true;
      case 4: return background.personality.trim().length > 0;
      default: return true;
    }
  };
  
  const steps = [
    { icon: User, title: '基础信息' },
    { icon: Dices, title: '属性面板' },
    { icon: Brain, title: '技能列表' },
    { icon: Heart, title: '背景要素' },
  ];
  
  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        {/* 标题 */}
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-4xl font-display font-bold title-arcane mb-4">
            创建角色
          </h1>
          <p className="text-parchment-light/60">
            塑造一个独特的灵魂，让AI赋予它生命
          </p>
        </motion.div>
        
        {/* 步骤指示器 */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {steps.map((s, i) => (
            <div key={i} className="flex items-center">
              <button
                onClick={() => i + 1 < step && setStep(i + 1)}
                className={cn(
                  'flex items-center gap-2 px-3 py-2 rounded-lg transition-all',
                  step === i + 1
                    ? 'bg-arcane-primary/20 text-arcane-glow'
                    : step > i + 1
                      ? 'text-parchment-light/60 hover:text-parchment-light cursor-pointer'
                      : 'text-parchment-light/30 cursor-not-allowed'
                )}
                disabled={i + 1 > step}
              >
                <s.icon className="w-4 h-4" />
                <span className="text-sm font-display hidden sm:inline">{s.title}</span>
              </button>
              {i < steps.length - 1 && (
                <ChevronRight className={cn(
                  'w-4 h-4 mx-1',
                  step > i + 1 ? 'text-arcane-primary' : 'text-forge-border'
                )} />
              )}
            </div>
          ))}
        </div>
        
        <AnimatePresence mode="wait">
          {/* 步骤 1: 基础信息 */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <Card className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <Input
                      label="角色姓名"
                      placeholder="输入角色的名字"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>
                  
                  <Select
                    label="种族"
                    options={RACES.map(r => ({ value: r, label: r }))}
                    value={race}
                    onChange={(e) => setRace(e.target.value)}
                  />
                  
                  <Select
                    label="职业"
                    options={CLASSES.map(c => ({ value: c, label: c }))}
                    value={charClass}
                    onChange={(e) => setCharClass(e.target.value)}
                  />
                  
                  <Select
                    label="阵营"
                    options={ALIGNMENTS}
                    value={alignment}
                    onChange={(e) => setAlignment(e.target.value as Alignment)}
                  />
                  
                  <div>
                    <label className="block text-sm font-display text-parchment-light/80 mb-2">
                      等级
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={20}
                      value={level}
                      onChange={(e) => setLevel(Math.max(1, Math.min(20, parseInt(e.target.value) || 1)))}
                      className="w-full px-4 py-3 bg-forge-surface border border-forge-border rounded-lg text-parchment-light focus:outline-none focus:border-arcane-primary/50 focus:ring-2 focus:ring-arcane-primary/20"
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <Textarea
                      label="背景故事"
                      placeholder="描述这个角色的过去、经历、动机..."
                      value={backstory}
                      onChange={(e) => setBackstory(e.target.value)}
                      className="min-h-[150px]"
                    />
                  </div>
                </div>
              </Card>
            </motion.div>
          )}
          
          {/* 步骤 2: 属性面板 */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <Card className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-display font-semibold text-parchment-light">
                    属性面板
                  </h3>
                  <Button variant="secondary" size="sm" onClick={rollAttributes}>
                    <Dices className="w-4 h-4 mr-2" />
                    随机掷骰
                  </Button>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {ATTRIBUTE_NAMES.map(({ key, name, abbr }) => (
                    <div
                      key={key}
                      className="p-4 bg-forge-surface rounded-lg border border-forge-border"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-arcane-glow font-mono">{abbr}</span>
                        <span className="text-sm text-parchment-light/60">{name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateAttribute(key, attributes[key] - 1)}
                          className="w-8 h-8 rounded bg-forge-hover flex items-center justify-center text-parchment-light/60 hover:text-parchment-light"
                        >
                          -
                        </button>
                        <div className="flex-1 text-center">
                          <div className="text-2xl font-display font-bold text-parchment-light">
                            {attributes[key]}
                          </div>
                          <div className={cn(
                            'text-sm font-mono',
                            getAttributeModifier(attributes[key]) >= 0 ? 'text-arcane-glow' : 'text-blood-primary'
                          )}>
                            {formatModifier(getAttributeModifier(attributes[key]))}
                          </div>
                        </div>
                        <button
                          onClick={() => updateAttribute(key, attributes[key] + 1)}
                          className="w-8 h-8 rounded bg-forge-hover flex items-center justify-center text-parchment-light/60 hover:text-parchment-light"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </motion.div>
          )}
          
          {/* 步骤 3: 技能列表 */}
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <Card className="p-8">
                <h3 className="text-lg font-display font-semibold text-parchment-light mb-6">
                  技能列表
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {(['combat', 'social', 'exploration', 'knowledge'] as const).map((category) => (
                    <div key={category} className="space-y-3">
                      <h4 className="text-sm font-display text-arcane-glow uppercase tracking-wider">
                        {category === 'combat' && '战斗'}
                        {category === 'social' && '社交'}
                        {category === 'exploration' && '探索'}
                        {category === 'knowledge' && '学识'}
                      </h4>
                      {Object.entries(skills[category]).map(([skillName, value]) => (
                        <div
                          key={skillName}
                          className="flex items-center justify-between p-2 bg-forge-surface rounded-lg"
                        >
                          <span className="text-sm text-parchment-light/80">{skillName}</span>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => updateSkill(category, skillName, value - 1)}
                              className="w-6 h-6 rounded bg-forge-hover flex items-center justify-center text-parchment-light/60 hover:text-parchment-light text-sm"
                            >
                              -
                            </button>
                            <span className={cn(
                              'w-8 text-center font-mono text-sm',
                              value > 0 ? 'text-arcane-glow' : value < 0 ? 'text-blood-primary' : 'text-parchment-light/60'
                            )}>
                              {value >= 0 ? `+${value}` : value}
                            </span>
                            <button
                              onClick={() => updateSkill(category, skillName, value + 1)}
                              className="w-6 h-6 rounded bg-forge-hover flex items-center justify-center text-parchment-light/60 hover:text-parchment-light text-sm"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </Card>
            </motion.div>
          )}
          
          {/* 步骤 4: 背景要素 */}
          {step === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <Card className="p-8">
                <h3 className="text-lg font-display font-semibold text-parchment-light mb-6">
                  背景要素
                </h3>
                
                <div className="space-y-6">
                  <Textarea
                    label="性格特质"
                    placeholder="描述角色的性格特点，例如：总是保持乐观，喜欢帮助他人..."
                    value={background.personality}
                    onChange={(e) => setBackground(prev => ({ ...prev, personality: e.target.value }))}
                    className="min-h-[100px]"
                  />
                  
                  <Textarea
                    label="理想"
                    placeholder="角色追求的信念或价值观，例如：自由、荣誉、知识..."
                    value={background.ideal}
                    onChange={(e) => setBackground(prev => ({ ...prev, ideal: e.target.value }))}
                  />
                  
                  <Textarea
                    label="羁绊"
                    placeholder="角色与世界的联系，例如：我必须保护我的家乡..."
                    value={background.bond}
                    onChange={(e) => setBackground(prev => ({ ...prev, bond: e.target.value }))}
                  />
                  
                  <Textarea
                    label="缺陷"
                    placeholder="角色的弱点或坏习惯，例如：无法拒绝赌博的诱惑..."
                    value={background.flaw}
                    onChange={(e) => setBackground(prev => ({ ...prev, flaw: e.target.value }))}
                  />
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* 导航按钮 */}
        <div className="flex justify-between mt-8">
          <Button
            variant="secondary"
            onClick={() => step > 1 ? setStep(step - 1) : setCurrentView('world-view')}
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            {step > 1 ? '上一步' : '返回'}
          </Button>
          
          {step < 4 ? (
            <Button
              onClick={() => setStep(step + 1)}
              disabled={!canProceed()}
            >
              下一步
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button
              variant="gold"
              onClick={handleCreate}
              disabled={!canProceed() || isProcessing}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  创建中...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  创建角色
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

