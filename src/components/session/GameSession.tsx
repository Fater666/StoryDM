import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, Dices, MessageSquare, Clock, Users, Scroll, ChevronRight, Loader2, Send, Wand2, Sparkles, Swords, Compass, MessageCircle, HelpCircle, Coffee } from 'lucide-react';
import { Button, Card, Textarea, Modal, Select } from '@/components/ui';
import { DiceRoller, DiceResult } from '@/components/ui/Dice';
import { useSessionStore, useCharacterStore, useWorldStore, useAppStore } from '@/stores';
import { aiService } from '@/services/ai';
import type { TurnAction, TurnCheck, TurnResult, DiceRoll, DiceType, CheckType, Character } from '@/types';
import { cn } from '@/utils/cn';
import { rollDiceSet, getAttributeModifier, isCheckSuccessful, isCriticalSuccess, isCriticalFailure } from '@/utils/dice';

const CHECK_TYPES: { value: CheckType; label: string }[] = [
  { value: 'strength', label: '力量检定' },
  { value: 'dexterity', label: '敏捷检定' },
  { value: 'constitution', label: '体质检定' },
  { value: 'intelligence', label: '智力检定' },
  { value: 'wisdom', label: '感知检定' },
  { value: 'charisma', label: '魅力检定' },
  { value: 'attack', label: '攻击检定' },
  { value: 'save', label: '豁免检定' },
  { value: 'skill', label: '技能检定' },
];

const DIFFICULTY_PRESETS = [
  { value: 5, label: '极易 (DC 5)' },
  { value: 10, label: '简单 (DC 10)' },
  { value: 15, label: '中等 (DC 15)' },
  { value: 20, label: '困难 (DC 20)' },
  { value: 25, label: '极难 (DC 25)' },
  { value: 30, label: '近乎不可能 (DC 30)' },
];

export function GameSession() {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { currentWorldId, setCurrentView } = useAppStore();
  const { currentWorld, loadWorld } = useWorldStore();
  const { characters, loadCharactersByWorld } = useCharacterStore();
  const {
    currentSession,
    createSession,
    loadSession,
    sessions,
    loadSessionsByWorld,
    pendingActions,
    pendingChecks,
    addPendingAction,
    addPendingCheck,
    clearPendingActions,
    clearPendingChecks,
    completeTurn,
    addTimelineEvent,
    addAdventureLog,
  } = useSessionStore();
  
  // 状态
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [sessionName, setSessionName] = useState('');
  const [selectedCharacters, setSelectedCharacters] = useState<string[]>([]);
  const [currentSituation, setCurrentSituation] = useState('');
  const [isAIThinking, setIsAIThinking] = useState(false);
  const [gameLog, setGameLog] = useState<{
    type: 'narration' | 'action' | 'check' | 'result' | 'system';
    content: string;
    characterName?: string;
    roll?: DiceRoll;
    success?: boolean;
    timestamp: Date;
  }[]>([]);
  
  // 判定模态框状态
  const [showCheckModal, setShowCheckModal] = useState(false);
  const [currentAction, setCurrentAction] = useState<TurnAction | null>(null);
  const [checkType, setCheckType] = useState<CheckType>('skill');
  const [skillName, setSkillName] = useState('');
  const [difficulty, setDifficulty] = useState(15);
  const [lastRoll, setLastRoll] = useState<DiceRoll | null>(null);
  
  // DM叙述输入
  const [dmNarration, setDmNarration] = useState('');
  
  // AI 建议
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<{
    title: string;
    content: string;
    type: 'combat' | 'exploration' | 'social' | 'mystery' | 'rest';
  }[]>([]);
  
  useEffect(() => {
    if (currentWorldId) {
      loadWorld(currentWorldId);
      loadCharactersByWorld(currentWorldId);
      loadSessionsByWorld(currentWorldId);
    }
  }, [currentWorldId]);
  
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [gameLog]);
  
  const handleCreateSession = async () => {
    if (!currentWorldId || !sessionName.trim() || selectedCharacters.length === 0) return;
    
    setIsCreatingSession(true);
    try {
      const sessionId = await createSession({
        worldId: currentWorldId,
        name: sessionName,
        characters: selectedCharacters,
      });
      await loadSession(sessionId);
      
      // 添加开场日志
      setGameLog([{
        type: 'system',
        content: `冒险「${sessionName}」开始了！`,
        timestamp: new Date(),
      }]);
      
      setSessionName('');
      setSelectedCharacters([]);
    } catch (error) {
      console.error('创建会话失败:', error);
    } finally {
      setIsCreatingSession(false);
    }
  };
  
  const handleRequestAIActions = async () => {
    if (!currentSession || !currentWorld) return;
    
    setIsAIThinking(true);
    clearPendingActions();
    
    const recentEvents = gameLog
      .filter(log => log.type === 'narration' || log.type === 'result')
      .slice(-5)
      .map(log => log.content);
    
    try {
      for (const charId of currentSession.characters) {
        const character = characters.find(c => c.id === charId);
        if (!character || character.status !== 'active') continue;
        
        if (aiService.isConfigured()) {
          const action = await aiService.proposeAction(
            character,
            currentWorld,
            currentSituation || '冒险刚刚开始...',
            recentEvents
          );
          addPendingAction(action);
          
          setGameLog(prev => [...prev, {
            type: 'action',
            content: action.proposedAction,
            characterName: character.name,
            timestamp: new Date(),
          }]);
        } else {
          // 没有AI时的模拟
          const mockAction: TurnAction = {
            id: crypto.randomUUID(),
            characterId: character.id,
            characterName: character.name,
            proposedAction: `${character.name} 观察四周，准备行动。`,
            aiReasoning: '我需要先了解周围的环境。',
          };
          addPendingAction(mockAction);
          
          setGameLog(prev => [...prev, {
            type: 'action',
            content: mockAction.proposedAction,
            characterName: character.name,
            timestamp: new Date(),
          }]);
        }
      }
    } catch (error) {
      console.error('AI行动请求失败:', error);
      setGameLog(prev => [...prev, {
        type: 'system',
        content: 'AI行动请求失败，请检查AI配置',
        timestamp: new Date(),
      }]);
    } finally {
      setIsAIThinking(false);
    }
  };
  
  const handleOpenCheckModal = (action: TurnAction) => {
    setCurrentAction(action);
    setShowCheckModal(true);
    setLastRoll(null);
  };
  
  const handleRoll = (roll: DiceRoll) => {
    setLastRoll(roll);
  };
  
  const handleConfirmCheck = async () => {
    if (!currentAction || !lastRoll) return;
    
    const character = characters.find(c => c.id === currentAction.characterId);
    if (!character) return;
    
    // 计算修正值
    let modifier = 0;
    if (checkType !== 'skill' && checkType !== 'attack' && checkType !== 'save') {
      modifier = getAttributeModifier(character.attributes[checkType]);
    }
    
    const finalTotal = lastRoll.total + modifier;
    const success = isCheckSuccessful(finalTotal, difficulty);
    const isCrit = isCriticalSuccess(lastRoll.results, 'd20');
    const isFumble = isCriticalFailure(lastRoll.results, 'd20');
    
    // 添加判定记录
    const check: TurnCheck = {
      id: crypto.randomUUID(),
      actionId: currentAction.id,
      checkType,
      skillName: checkType === 'skill' ? skillName : undefined,
      difficulty,
      diceRoll: { ...lastRoll, modifier, total: finalTotal },
    };
    addPendingCheck(check);
    
    // 添加到游戏日志
    setGameLog(prev => [...prev, {
      type: 'check',
      content: `${checkType === 'skill' ? skillName : CHECK_TYPES.find(c => c.value === checkType)?.label} - DC ${difficulty}`,
      characterName: character.name,
      roll: { ...lastRoll, modifier, total: finalTotal },
      success,
      timestamp: new Date(),
    }]);
    
    // 生成结果叙述
    let narration = '';
    if (aiService.isConfigured()) {
      try {
        narration = await aiService.generateNarration(
          currentAction,
          { success, roll: finalTotal, difficulty },
          currentWorld!
        );
      } catch {
        narration = success
          ? `${character.name} 成功完成了行动。`
          : `${character.name} 的尝试失败了。`;
      }
    } else {
      if (isCrit) {
        narration = `大成功！${character.name} 完美地完成了行动，结果超出预期！`;
      } else if (isFumble) {
        narration = `大失败...${character.name} 的行动完全失败，事情变得更糟了。`;
      } else {
        narration = success
          ? `${character.name} 成功完成了行动。`
          : `${character.name} 的尝试失败了。`;
      }
    }
    
    setGameLog(prev => [...prev, {
      type: 'result',
      content: narration,
      characterName: character.name,
      success,
      timestamp: new Date(),
    }]);
    
    // 添加冒险日志
    await addAdventureLog({
      characterId: character.id,
      characterName: character.name,
      turnNumber: currentSession!.currentTurn + 1,
      content: `${currentAction.proposedAction}\n结果: ${narration}`,
      emotion: success ? '满意' : '沮丧',
    });
    
    setShowCheckModal(false);
    setCurrentAction(null);
    setLastRoll(null);
  };
  
  const handleEndTurn = async () => {
    if (!currentSession) return;
    
    const results: TurnResult[] = pendingChecks.map(check => ({
      id: crypto.randomUUID(),
      checkId: check.id,
      success: isCheckSuccessful(check.diceRoll.total, check.difficulty),
      dmNarration: '',
      worldChanges: [],
    }));
    
    await completeTurn(results, currentSituation);
    
    // 添加时间线事件
    await addTimelineEvent({
      timestamp: new Date(),
      turnNumber: currentSession.currentTurn + 1,
      event: `第 ${currentSession.currentTurn + 1} 回合结束`,
      significance: 'minor',
    });
    
    setGameLog(prev => [...prev, {
      type: 'system',
      content: `第 ${currentSession.currentTurn + 1} 回合结束`,
      timestamp: new Date(),
    }]);
  };
  
  const handleDMNarration = async () => {
    if (!dmNarration.trim()) return;
    
    const narrationText = dmNarration;
    
    setGameLog(prev => [...prev, {
      type: 'narration',
      content: narrationText,
      timestamp: new Date(),
    }]);
    
    setCurrentSituation(narrationText);
    setDmNarration('');
    setShowSuggestions(false);
    
    // 自动触发 AI 角色行动
    if (aiService.isConfigured() && currentSession && currentWorld) {
      // 延迟一小段时间，让用户看到场景描述
      setTimeout(() => {
        handleRequestAIActions();
      }, 500);
    }
  };
  
  // 获取 AI 建议
  const handleGetSuggestions = async () => {
    if (!currentWorld || !aiService.isConfigured()) {
      setGameLog(prev => [...prev, {
        type: 'system',
        content: '请先配置 AI 服务',
        timestamp: new Date(),
      }]);
      return;
    }
    
    setIsLoadingSuggestions(true);
    setShowSuggestions(true);
    
    const recentEvents = gameLog
      .filter(log => log.type === 'narration' || log.type === 'result')
      .slice(-5)
      .map(log => log.content);
    
    const sessionCharacters = characters.filter(c => 
      currentSession?.characters.includes(c.id)
    );
    
    try {
      const result = await aiService.generateDMSuggestions(
        currentWorld,
        sessionCharacters,
        recentEvents,
        currentSession?.currentTurn || 0
      );
      setAiSuggestions(result.suggestions);
    } catch (error) {
      console.error('获取 AI 建议失败:', error);
      setAiSuggestions([]);
      setGameLog(prev => [...prev, {
        type: 'system',
        content: '获取 AI 建议失败，请重试',
        timestamp: new Date(),
      }]);
    } finally {
      setIsLoadingSuggestions(false);
    }
  };
  
  // 选择 AI 建议
  const handleSelectSuggestion = (suggestion: typeof aiSuggestions[0]) => {
    setDmNarration(suggestion.content);
    setShowSuggestions(false);
  };
  
  // 获取场景类型图标
  const getSuggestionIcon = (type: string) => {
    switch (type) {
      case 'combat': return Swords;
      case 'exploration': return Compass;
      case 'social': return MessageCircle;
      case 'mystery': return HelpCircle;
      case 'rest': return Coffee;
      default: return Sparkles;
    }
  };
  
  // 获取场景类型颜色
  const getSuggestionColor = (type: string) => {
    switch (type) {
      case 'combat': return 'text-blood-primary border-blood-primary/30 bg-blood-primary/10';
      case 'exploration': return 'text-arcane-glow border-arcane-primary/30 bg-arcane-primary/10';
      case 'social': return 'text-gold-primary border-gold-primary/30 bg-gold-primary/10';
      case 'mystery': return 'text-purple-400 border-purple-400/30 bg-purple-400/10';
      case 'rest': return 'text-green-400 border-green-400/30 bg-green-400/10';
      default: return 'text-parchment-light border-forge-border bg-forge-surface';
    }
  };
  
  // 如果没有会话，显示创建界面
  if (!currentSession) {
    return (
      <div className="min-h-screen p-8">
        <div className="max-w-2xl mx-auto">
          <motion.div
            className="text-center mb-8"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-3xl font-display font-bold title-arcane mb-4">
              开始新冒险
            </h1>
            <p className="text-parchment-light/60">
              选择参与冒险的角色，开启一段新的旅程
            </p>
          </motion.div>
          
          <Card className="p-8">
            <div className="space-y-6">
              <Input
                label="冒险名称"
                placeholder="为这次冒险起个名字..."
                value={sessionName}
                onChange={(e) => setSessionName(e.target.value)}
              />
              
              <div>
                <label className="block text-sm font-display text-parchment-light/80 mb-3">
                  选择参与角色
                </label>
                <div className="space-y-2">
                  {characters.filter(c => c.status === 'active').map(char => (
                    <label
                      key={char.id}
                      className={cn(
                        'flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all',
                        selectedCharacters.includes(char.id)
                          ? 'bg-arcane-primary/20 border border-arcane-primary/50'
                          : 'bg-forge-surface border border-forge-border hover:border-arcane-primary/30'
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={selectedCharacters.includes(char.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedCharacters([...selectedCharacters, char.id]);
                          } else {
                            setSelectedCharacters(selectedCharacters.filter(id => id !== char.id));
                          }
                        }}
                        className="sr-only"
                      />
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-arcane-primary to-arcane-secondary flex items-center justify-center text-white font-display font-bold">
                        {char.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-display font-semibold text-parchment-light">
                          {char.name}
                        </div>
                        <div className="text-xs text-parchment-light/60">
                          {char.race} · {char.class} · Lv.{char.level}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
              
              <div className="flex justify-between pt-4">
                <Button variant="secondary" onClick={() => setCurrentView('world-view')}>
                  返回
                </Button>
                <Button
                  variant="gold"
                  onClick={handleCreateSession}
                  disabled={!sessionName.trim() || selectedCharacters.length === 0 || isCreatingSession}
                >
                  {isCreatingSession ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      创建中...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-2" />
                      开始冒险
                    </>
                  )}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }
  
  // 游戏会话界面
  return (
    <div className="h-screen flex flex-col">
      {/* 顶部栏 */}
      <div className="px-6 py-4 border-b border-forge-border bg-forge-surface/50 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-display font-bold text-parchment-light">
              {currentSession.name}
            </h1>
            <span className="text-sm text-parchment-light/60">
              第 {currentSession.currentTurn + 1} 回合
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={() => setCurrentView('world-view')}>
              返回世界
            </Button>
          </div>
        </div>
      </div>
      
      <div className="flex-1 flex overflow-hidden">
        {/* 主游戏区域 */}
        <div className="flex-1 flex flex-col">
          {/* 游戏日志 */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            <AnimatePresence>
              {gameLog.map((log, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    'p-4 rounded-lg',
                    log.type === 'system' && 'bg-forge-surface/50 text-center text-parchment-light/60 text-sm',
                    log.type === 'narration' && 'bg-forge-card border border-forge-border',
                    log.type === 'action' && 'bg-arcane-primary/10 border border-arcane-primary/30',
                    log.type === 'check' && 'bg-gold-primary/10 border border-gold-primary/30',
                    log.type === 'result' && (log.success ? 'bg-green-900/20 border border-green-500/30' : 'bg-blood-primary/10 border border-blood-primary/30')
                  )}
                >
                  {log.characterName && (
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-display font-semibold text-arcane-glow">
                        {log.characterName}
                      </span>
                      {log.type === 'action' && (
                        <span className="text-xs text-parchment-light/40">提出行动</span>
                      )}
                    </div>
                  )}
                  <p className="text-parchment-light">{log.content}</p>
                  {log.roll && (
                    <div className="mt-2">
                      <DiceResult roll={log.roll} />
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
            <div ref={messagesEndRef} />
          </div>
          
          {/* DM输入区 */}
          <div className="border-t border-forge-border bg-forge-surface/50">
            {/* AI 建议面板 */}
            <AnimatePresence>
              {showSuggestions && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden border-b border-forge-border"
                >
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-display text-parchment-light/80 flex items-center gap-2">
                        <Wand2 className="w-4 h-4 text-arcane-glow" />
                        AI 场景建议
                      </h4>
                      <button
                        onClick={() => setShowSuggestions(false)}
                        className="text-xs text-parchment-light/40 hover:text-parchment-light"
                      >
                        关闭
                      </button>
                    </div>
                    
                    {isLoadingSuggestions ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-6 h-6 text-arcane-glow animate-spin" />
                        <span className="ml-2 text-parchment-light/60">正在生成建议...</span>
                      </div>
                    ) : aiSuggestions.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {aiSuggestions.map((suggestion, index) => {
                          const Icon = getSuggestionIcon(suggestion.type);
                          return (
                            <motion.button
                              key={index}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.1 }}
                              onClick={() => handleSelectSuggestion(suggestion)}
                              className={cn(
                                'p-3 rounded-lg border text-left transition-all hover:scale-[1.02]',
                                getSuggestionColor(suggestion.type)
                              )}
                            >
                              <div className="flex items-center gap-2 mb-2">
                                <Icon className="w-4 h-4" />
                                <span className="font-display font-semibold text-sm">
                                  {suggestion.title}
                                </span>
                              </div>
                              <p className="text-xs text-parchment-light/70 line-clamp-3">
                                {suggestion.content}
                              </p>
                            </motion.button>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-4 text-parchment-light/40 text-sm">
                        暂无建议，请重试
                      </div>
                    )}
                    
                    <div className="mt-3 text-xs text-parchment-light/40 text-center">
                      点击选择建议填入输入框，可修改后发送
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            
            {/* 输入区 */}
            <div className="p-4">
              <div className="flex gap-3">
                <div className="flex-1 space-y-2">
                  <Textarea
                    placeholder="作为DM，描述当前场景或情境..."
                    value={dmNarration}
                    onChange={(e) => setDmNarration(e.target.value)}
                    className="min-h-[60px] max-h-[120px]"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleDMNarration();
                      }
                    }}
                  />
                  {/* AI 辅助按钮 */}
                  {aiService.isConfigured() && (
                    <button
                      onClick={handleGetSuggestions}
                      disabled={isLoadingSuggestions}
                      className="text-xs text-arcane-glow/70 hover:text-arcane-glow flex items-center gap-1 transition-colors"
                    >
                      {isLoadingSuggestions ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Wand2 className="w-3 h-3" />
                      )}
                      {showSuggestions ? '刷新 AI 建议' : '获取 AI 建议'}
                    </button>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <Button onClick={handleDMNarration} disabled={!dmNarration.trim()} title="发送场景描述">
                    <Send className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="gold"
                    onClick={handleRequestAIActions}
                    disabled={isAIThinking}
                    title="让 AI 角色行动"
                  >
                    {isAIThinking ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Users className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* 右侧面板 */}
        <div className="w-80 border-l border-forge-border bg-forge-surface/30 overflow-y-auto">
          <div className="p-4 space-y-4">
            {/* 待处理的行动 */}
            <div>
              <h3 className="text-sm font-display text-parchment-light/60 mb-3">待处理的行动</h3>
              {pendingActions.length > 0 ? (
                <div className="space-y-2">
                  {pendingActions.map(action => {
                    const hasCheck = pendingChecks.some(c => c.actionId === action.id);
                    return (
                      <Card
                        key={action.id}
                        className={cn(
                          'p-3 cursor-pointer transition-all',
                          hasCheck ? 'opacity-50' : 'hover:border-arcane-primary/50'
                        )}
                        onClick={() => !hasCheck && handleOpenCheckModal(action)}
                      >
                        <div className="text-sm font-display text-arcane-glow mb-1">
                          {action.characterName}
                        </div>
                        <div className="text-xs text-parchment-light/80 line-clamp-2">
                          {action.proposedAction}
                        </div>
                        {hasCheck && (
                          <div className="text-xs text-green-400 mt-2">✓ 已判定</div>
                        )}
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-parchment-light/40 text-center py-4">
                  点击上方按钮让AI角色提出行动
                </p>
              )}
            </div>
            
            {/* 回合控制 */}
            {pendingActions.length > 0 && pendingChecks.length === pendingActions.length && (
              <Button
                variant="gold"
                className="w-full"
                onClick={handleEndTurn}
              >
                <ChevronRight className="w-4 h-4 mr-2" />
                结束回合
              </Button>
            )}
            
            {/* 参与角色 */}
            <div>
              <h3 className="text-sm font-display text-parchment-light/60 mb-3">参与角色</h3>
              <div className="space-y-2">
                {currentSession.characters.map(charId => {
                  const char = characters.find(c => c.id === charId);
                  if (!char) return null;
                  return (
                    <div key={charId} className="flex items-center gap-2 p-2 bg-forge-surface rounded-lg">
                      <div className="w-8 h-8 rounded bg-gradient-to-br from-arcane-primary to-arcane-secondary flex items-center justify-center text-white font-display text-sm font-bold">
                        {char.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-display text-parchment-light truncate">
                          {char.name}
                        </div>
                        <div className="text-xs text-parchment-light/40">
                          HP: {char.currentHP}/{char.maxHP}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* 判定模态框 */}
      <Modal
        isOpen={showCheckModal}
        onClose={() => setShowCheckModal(false)}
        title="设置判定"
        size="md"
      >
        <div className="p-6 space-y-6">
          {currentAction && (
            <div className="p-4 bg-forge-surface rounded-lg">
              <div className="text-sm text-arcane-glow font-display mb-1">
                {currentAction.characterName} 的行动
              </div>
              <div className="text-parchment-light">
                {currentAction.proposedAction}
              </div>
              {currentAction.aiReasoning && (
                <div className="text-xs text-parchment-light/60 mt-2 italic">
                  内心独白：{currentAction.aiReasoning}
                </div>
              )}
            </div>
          )}
          
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="判定类型"
              options={CHECK_TYPES}
              value={checkType}
              onChange={(e) => setCheckType(e.target.value as CheckType)}
            />
            
            <Select
              label="难度等级"
              options={DIFFICULTY_PRESETS.map(d => ({ value: String(d.value), label: d.label }))}
              value={String(difficulty)}
              onChange={(e) => setDifficulty(parseInt(e.target.value))}
            />
          </div>
          
          {checkType === 'skill' && (
            <Input
              label="技能名称"
              placeholder="例如：潜行、说服、察觉..."
              value={skillName}
              onChange={(e) => setSkillName(e.target.value)}
            />
          )}
          
          <div className="flex justify-center">
            <DiceRoller
              diceType="d20"
              onRoll={handleRoll}
              size="lg"
            />
          </div>
          
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setShowCheckModal(false)}>
              取消
            </Button>
            <Button
              onClick={handleConfirmCheck}
              disabled={!lastRoll}
            >
              确认结果
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// Input 组件（简化版）
function Input({ label, ...props }: { label?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-display text-parchment-light/80 mb-2">
          {label}
        </label>
      )}
      <input
        className="w-full px-4 py-3 bg-forge-surface border border-forge-border rounded-lg text-parchment-light placeholder-parchment-light/40 focus:outline-none focus:border-arcane-primary/50 focus:ring-2 focus:ring-arcane-primary/20 transition-all duration-200"
        {...props}
      />
    </div>
  );
}

