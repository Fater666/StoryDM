import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, BookOpen, Link2, Sparkles, ChevronRight, Loader2 } from 'lucide-react';
import { Button, Input, Textarea, Card, CardContent, Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui';
import { useWorldStore, useAppStore } from '@/stores';
import { aiService } from '@/services/ai';
import type { WorldSourceType } from '@/types';
import { cn } from '@/utils/cn';

const sourceOptions = [
  {
    type: 'manual' as WorldSourceType,
    icon: Globe,
    title: '手写设定',
    description: '从零开始创造你的世界',
  },
  {
    type: 'novel' as WorldSourceType,
    icon: BookOpen,
    title: '粘贴小说',
    description: '从现有文本中提取世界观',
  },
  {
    type: 'url' as WorldSourceType,
    icon: Link2,
    title: '提供 URL',
    description: '从网页内容解析世界设定',
  },
];

export function WorldCreator() {
  const [step, setStep] = useState(1);
  const [sourceType, setSourceType] = useState<WorldSourceType>('manual');
  const [worldName, setWorldName] = useState('');
  const [sourceContent, setSourceContent] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [parsedWorld, setParsedWorld] = useState<{
    background: string;
    locations: { name: string; description: string }[];
    factions: { name: string; description: string; influence: number }[];
    history: { name: string; description: string; era: string }[];
    conflicts: { name: string; description: string; status: string }[];
  } | null>(null);
  
  const { createWorld } = useWorldStore();
  const { setCurrentView, setCurrentWorld, aiConfig } = useAppStore();
  
  const handleSourceSelect = (type: WorldSourceType) => {
    setSourceType(type);
    setStep(2);
  };
  
  const handleParse = async () => {
    if (!sourceContent.trim()) return;
    
    setIsProcessing(true);
    try {
      if (aiService.isConfigured()) {
        const result = await aiService.parseWorldContent(sourceContent, sourceType);
        setParsedWorld(result);
      } else {
        // 如果没有配置AI，使用简单的默认解析
        setParsedWorld({
          background: sourceContent,
          locations: [],
          factions: [],
          history: [],
          conflicts: [],
        });
      }
      setStep(3);
    } catch (error) {
      console.error('解析失败:', error);
      // 即使失败也继续
      setParsedWorld({
        background: sourceContent,
        locations: [],
        factions: [],
        history: [],
        conflicts: [],
      });
      setStep(3);
    } finally {
      setIsProcessing(false);
    }
  };
  
  const handleCreate = async () => {
    if (!worldName.trim() || !parsedWorld) return;
    
    setIsProcessing(true);
    try {
      const worldId = await createWorld({
        name: worldName,
        sourceType,
        sourceContent,
        background: parsedWorld.background,
      });
      
      setCurrentWorld(worldId);
      setCurrentView('world-view');
    } catch (error) {
      console.error('创建世界失败:', error);
    } finally {
      setIsProcessing(false);
    }
  };
  
  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        {/* 标题 */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-4xl font-display font-bold title-arcane mb-4">
            创造新世界
          </h1>
          <p className="text-parchment-light/60">
            选择你的创世方式，让故事从这里开始
          </p>
        </motion.div>
        
        {/* 步骤指示器 */}
        <div className="flex items-center justify-center gap-4 mb-12">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center font-display font-bold text-sm transition-all',
                step >= s
                  ? 'bg-arcane-primary text-white shadow-arcane'
                  : 'bg-forge-surface text-parchment-light/40 border border-forge-border'
              )}>
                {s}
              </div>
              {s < 3 && (
                <div className={cn(
                  'w-12 h-0.5 transition-all',
                  step > s ? 'bg-arcane-primary' : 'bg-forge-border'
                )} />
              )}
            </div>
          ))}
        </div>
        
        <AnimatePresence mode="wait">
          {/* 步骤 1: 选择来源 */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-6"
            >
              {sourceOptions.map((option, index) => (
                <motion.div
                  key={option.type}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card
                    variant="hover"
                    className="p-6 h-full"
                    onClick={() => handleSourceSelect(option.type)}
                  >
                    <div className="flex flex-col items-center text-center gap-4">
                      <div className="w-16 h-16 rounded-2xl bg-arcane-primary/20 flex items-center justify-center">
                        <option.icon className="w-8 h-8 text-arcane-glow" />
                      </div>
                      <div>
                        <h3 className="text-lg font-display font-semibold text-parchment-light mb-2">
                          {option.title}
                        </h3>
                        <p className="text-sm text-parchment-light/60">
                          {option.description}
                        </p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-arcane-primary" />
                    </div>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          )}
          
          {/* 步骤 2: 输入内容 */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <Card className="p-8">
                <div className="space-y-6">
                  <div className="flex items-center gap-3 mb-6">
                    {sourceType === 'manual' && <Globe className="w-6 h-6 text-arcane-glow" />}
                    {sourceType === 'novel' && <BookOpen className="w-6 h-6 text-arcane-glow" />}
                    {sourceType === 'url' && <Link2 className="w-6 h-6 text-arcane-glow" />}
                    <h2 className="text-xl font-display font-semibold text-parchment-light">
                      {sourceType === 'manual' && '描述你的世界'}
                      {sourceType === 'novel' && '粘贴小说内容'}
                      {sourceType === 'url' && '输入网页 URL'}
                    </h2>
                  </div>
                  
                  {sourceType === 'url' ? (
                    <Input
                      placeholder="https://example.com/world-setting"
                      value={sourceContent}
                      onChange={(e) => setSourceContent(e.target.value)}
                    />
                  ) : (
                    <Textarea
                      placeholder={
                        sourceType === 'manual'
                          ? '描述这个世界的背景、历史、势力、魔法体系等...\n\n例如：这是一个剑与魔法的中世纪幻想世界，大陆被分为四个王国...'
                          : '将小说内容粘贴到这里...'
                      }
                      value={sourceContent}
                      onChange={(e) => setSourceContent(e.target.value)}
                      className="min-h-[300px]"
                    />
                  )}
                  
                  <div className="flex justify-between">
                    <Button variant="secondary" onClick={() => setStep(1)}>
                      返回
                    </Button>
                    <Button
                      onClick={handleParse}
                      disabled={!sourceContent.trim() || isProcessing}
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          解析中...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 mr-2" />
                          {aiService.isConfigured() ? 'AI 解析' : '继续'}
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          )}
          
          {/* 步骤 3: 确认和命名 */}
          {step === 3 && parsedWorld && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <Card className="p-8">
                <Input
                  label="为你的世界命名"
                  placeholder="例如：艾尔德兰大陆"
                  value={worldName}
                  onChange={(e) => setWorldName(e.target.value)}
                  className="text-xl"
                />
              </Card>
              
              <Tabs defaultValue="background" className="space-y-4">
                <TabsList className="w-full justify-start">
                  <TabsTrigger value="background">世界背景</TabsTrigger>
                  <TabsTrigger value="locations">地点</TabsTrigger>
                  <TabsTrigger value="factions">势力</TabsTrigger>
                  <TabsTrigger value="history">历史</TabsTrigger>
                  <TabsTrigger value="conflicts">冲突</TabsTrigger>
                </TabsList>
                
                <TabsContent value="background">
                  <Card className="p-6">
                    <Textarea
                      value={parsedWorld.background}
                      onChange={(e) => setParsedWorld({ ...parsedWorld, background: e.target.value })}
                      className="min-h-[200px]"
                    />
                  </Card>
                </TabsContent>
                
                <TabsContent value="locations">
                  <Card className="p-6">
                    {parsedWorld.locations.length > 0 ? (
                      <div className="space-y-4">
                        {parsedWorld.locations.map((loc, i) => (
                          <div key={i} className="p-4 bg-forge-surface rounded-lg">
                            <h4 className="font-display font-semibold text-parchment-light">{loc.name}</h4>
                            <p className="text-sm text-parchment-light/60 mt-1">{loc.description}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-parchment-light/40 text-center py-8">
                        暂无地点信息，可以稍后在世界编辑中添加
                      </p>
                    )}
                  </Card>
                </TabsContent>
                
                <TabsContent value="factions">
                  <Card className="p-6">
                    {parsedWorld.factions.length > 0 ? (
                      <div className="space-y-4">
                        {parsedWorld.factions.map((faction, i) => (
                          <div key={i} className="p-4 bg-forge-surface rounded-lg">
                            <div className="flex items-center justify-between">
                              <h4 className="font-display font-semibold text-parchment-light">{faction.name}</h4>
                              <span className="text-xs text-arcane-glow">影响力: {faction.influence}/10</span>
                            </div>
                            <p className="text-sm text-parchment-light/60 mt-1">{faction.description}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-parchment-light/40 text-center py-8">
                        暂无势力信息，可以稍后在世界编辑中添加
                      </p>
                    )}
                  </Card>
                </TabsContent>
                
                <TabsContent value="history">
                  <Card className="p-6">
                    {parsedWorld.history.length > 0 ? (
                      <div className="space-y-4">
                        {parsedWorld.history.map((event, i) => (
                          <div key={i} className="p-4 bg-forge-surface rounded-lg">
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gold-primary">{event.era}</span>
                              <h4 className="font-display font-semibold text-parchment-light">{event.name}</h4>
                            </div>
                            <p className="text-sm text-parchment-light/60 mt-1">{event.description}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-parchment-light/40 text-center py-8">
                        暂无历史事件，可以稍后在世界编辑中添加
                      </p>
                    )}
                  </Card>
                </TabsContent>
                
                <TabsContent value="conflicts">
                  <Card className="p-6">
                    {parsedWorld.conflicts.length > 0 ? (
                      <div className="space-y-4">
                        {parsedWorld.conflicts.map((conflict, i) => (
                          <div key={i} className="p-4 bg-forge-surface rounded-lg">
                            <div className="flex items-center justify-between">
                              <h4 className="font-display font-semibold text-parchment-light">{conflict.name}</h4>
                              <span className={cn(
                                'text-xs px-2 py-0.5 rounded',
                                conflict.status === 'active' && 'bg-blood-primary/20 text-blood-primary',
                                conflict.status === 'brewing' && 'bg-gold-primary/20 text-gold-primary',
                                conflict.status === 'dormant' && 'bg-forge-border text-parchment-light/60'
                              )}>
                                {conflict.status === 'active' ? '进行中' : conflict.status === 'brewing' ? '酝酿中' : '潜伏'}
                              </span>
                            </div>
                            <p className="text-sm text-parchment-light/60 mt-1">{conflict.description}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-parchment-light/40 text-center py-8">
                        暂无冲突信息，可以稍后在世界编辑中添加
                      </p>
                    )}
                  </Card>
                </TabsContent>
              </Tabs>
              
              <div className="flex justify-between">
                <Button variant="secondary" onClick={() => setStep(2)}>
                  返回
                </Button>
                <Button
                  variant="gold"
                  onClick={handleCreate}
                  disabled={!worldName.trim() || isProcessing}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      创建中...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      创造世界
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

