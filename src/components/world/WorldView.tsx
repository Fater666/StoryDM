import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Globe, MapPin, Users, Clock, Swords, Plus, Play, Settings, Trash2, Download, Upload, Loader2, Eye, Heart, Target, Link, AlertTriangle, Scroll, X, Flag, CheckCircle2, Circle, ChevronRight, Lightbulb } from 'lucide-react';
import { Button, Card, CardContent, CardHeader, Tabs, TabsList, TabsTrigger, TabsContent, Modal } from '@/components/ui';
import { useWorldStore, useCharacterStore, useSessionStore, useAppStore } from '@/stores';
import { cn } from '@/utils/cn';
import { archiveService, type WorldArchive, type CharacterArchive } from '@/services/archive';
import { logger, LogCategories } from '@/services/logger';
import { getMainQuestByWorld, updateMainQuest } from '@/services/db';
import type { Character, MainQuest } from '@/types';
import { getAttributeModifier, formatModifier } from '@/utils/dice';

export function WorldView() {
  const { currentWorldId, setCurrentView } = useAppStore();
  const { currentWorld, loadWorld, deleteWorld, loadWorlds } = useWorldStore();
  const { characters, loadCharactersByWorld } = useCharacterStore();
  const { sessions, loadSessionsByWorld } = useSessionStore();
  
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const characterFileInputRef = useRef<HTMLInputElement>(null);
  
  // 角色详情模态框
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [showCharacterModal, setShowCharacterModal] = useState(false);
  
  // 主线任务
  const [mainQuest, setMainQuest] = useState<MainQuest | null>(null);
  
  const handleViewCharacter = (char: Character) => {
    setSelectedCharacter(char);
    setShowCharacterModal(true);
  };
  
  // 加载主线任务
  const loadMainQuest = async () => {
    if (currentWorldId) {
      const quest = await getMainQuestByWorld(currentWorldId);
      setMainQuest(quest || null);
    }
  };
  
  // 切换阶段完成状态
  const handleToggleStage = async (stageId: string) => {
    if (!mainQuest) return;
    
    const updatedStages = mainQuest.stages.map(s => 
      s.id === stageId ? { ...s, completed: !s.completed } : s
    );
    
    await updateMainQuest(mainQuest.id, { stages: updatedStages });
    setMainQuest({ ...mainQuest, stages: updatedStages });
  };
  
  useEffect(() => {
    if (currentWorldId) {
      loadWorld(currentWorldId);
      loadCharactersByWorld(currentWorldId);
      loadSessionsByWorld(currentWorldId);
      loadMainQuest();
    }
  }, [currentWorldId]);
  
  if (!currentWorld) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-parchment-light/40">加载中...</div>
      </div>
    );
  }
  
  const handleDelete = async () => {
    if (confirm('确定要删除这个世界吗？所有相关的角色和会话也将被删除。')) {
      await deleteWorld(currentWorld.id);
      setCurrentView('home');
    }
  };
  
  // 导出世界
  const handleExportWorld = async () => {
    setIsExporting(true);
    try {
      const archive = await archiveService.exportWorld(currentWorld.id);
      if (archive) {
        const filename = `${currentWorld.name}_世界存档_${new Date().toISOString().split('T')[0]}.json`;
        archiveService.downloadAsFile(archive, filename);
      }
    } catch (error) {
      logger.error(LogCategories.ARCHIVE, '导出世界失败', error);
      alert('导出失败，请重试');
    } finally {
      setIsExporting(false);
    }
  };
  
  // 导出角色
  const handleExportCharacter = async (characterId: string, characterName: string) => {
    try {
      const archive = await archiveService.exportCharacter(characterId);
      if (archive) {
        const filename = `${characterName}_角色存档_${new Date().toISOString().split('T')[0]}.json`;
        archiveService.downloadAsFile(archive, filename);
      }
    } catch (error) {
      logger.error(LogCategories.ARCHIVE, '导出角色失败', error);
      alert('导出失败，请重试');
    }
  };
  
  // 导入角色
  const handleImportCharacter = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    setIsImporting(true);
    try {
      const data = await archiveService.readFromFile(file);
      const validation = archiveService.validateArchive(data);
      
      if (!validation.valid || validation.type !== 'character') {
        alert('无效的角色存档文件');
        return;
      }
      
      await archiveService.importCharacter(data as CharacterArchive, currentWorld.id);
      await loadCharactersByWorld(currentWorld.id);
      alert('角色导入成功！');
    } catch (error) {
      logger.error(LogCategories.ARCHIVE, '导入角色失败', error);
      alert('导入失败: ' + (error as Error).message);
    } finally {
      setIsImporting(false);
      if (characterFileInputRef.current) {
        characterFileInputRef.current.value = '';
      }
    }
  };
  
  return (
    <div className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto">
        {/* 世界头部 */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 rounded-xl bg-arcane-primary/20 flex items-center justify-center">
                  <Globe className="w-6 h-6 text-arcane-glow" />
                </div>
                <h1 className="text-3xl font-display font-bold title-arcane">
                  {currentWorld.name}
                </h1>
              </div>
              <p className="text-parchment-light/60 max-w-2xl">
                {currentWorld.background.slice(0, 200)}
                {currentWorld.background.length > 200 && '...'}
              </p>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="secondary" 
                size="sm" 
                onClick={handleExportWorld}
                disabled={isExporting}
                title="导出世界存档"
              >
                {isExporting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
              </Button>
              <Button variant="secondary" size="sm" onClick={handleDelete} title="删除世界">
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </motion.div>
        
        {/* 快捷操作 */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card variant="hover" className="p-4" onClick={() => setCurrentView('character-create')}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-arcane-primary/20 flex items-center justify-center">
                <Plus className="w-5 h-5 text-arcane-glow" />
              </div>
              <div>
                <h3 className="font-display font-semibold text-parchment-light">创建角色</h3>
                <p className="text-xs text-parchment-light/60">添加新的 AI 扮演角色</p>
              </div>
            </div>
          </Card>
          
          <Card
            variant="hover"
            className={cn('p-4', characters.length === 0 && 'opacity-50 cursor-not-allowed')}
            onClick={() => characters.length > 0 && setCurrentView('session')}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gold-primary/20 flex items-center justify-center">
                <Play className="w-5 h-5 text-gold-light" />
              </div>
              <div>
                <h3 className="font-display font-semibold text-parchment-light">开始冒险</h3>
                <p className="text-xs text-parchment-light/60">
                  {characters.length > 0 ? '创建新的游戏会话' : '需要先创建角色'}
                </p>
              </div>
            </div>
          </Card>
          
          <Card variant="hover" className="p-4" onClick={() => setCurrentView('settings')}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-forge-border flex items-center justify-center">
                <Settings className="w-5 h-5 text-parchment-light/60" />
              </div>
              <div>
                <h3 className="font-display font-semibold text-parchment-light">AI 设置</h3>
                <p className="text-xs text-parchment-light/60">配置私有模型</p>
              </div>
            </div>
          </Card>
        </motion.div>
        
        {/* 主要内容区 */}
        <Tabs defaultValue={mainQuest ? "mainquest" : "characters"} className="space-y-6">
          <TabsList>
            {mainQuest && (
              <TabsTrigger value="mainquest">
                <Flag className="w-4 h-4 mr-2" />
                主线
              </TabsTrigger>
            )}
            <TabsTrigger value="characters">
              <Users className="w-4 h-4 mr-2" />
              角色 ({characters.length})
            </TabsTrigger>
            <TabsTrigger value="locations">
              <MapPin className="w-4 h-4 mr-2" />
              地点 ({currentWorld.locations.length})
            </TabsTrigger>
            <TabsTrigger value="factions">
              <Swords className="w-4 h-4 mr-2" />
              势力 ({currentWorld.factions.length})
            </TabsTrigger>
            <TabsTrigger value="history">
              <Clock className="w-4 h-4 mr-2" />
              历史 ({currentWorld.history.length})
            </TabsTrigger>
            <TabsTrigger value="sessions">
              <Play className="w-4 h-4 mr-2" />
              会话 ({sessions.length})
            </TabsTrigger>
          </TabsList>
          
          {/* 主线任务 */}
          {mainQuest && (
            <TabsContent value="mainquest">
              <div className="space-y-6">
                {/* 主线标题和描述 */}
                <Card className="p-6 bg-gradient-to-r from-gold-primary/10 to-transparent border-gold-primary/30">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gold-primary/20 flex items-center justify-center">
                      <Flag className="w-6 h-6 text-gold-primary" />
                    </div>
                    <div className="flex-1">
                      <h2 className="text-2xl font-display font-bold text-parchment-light mb-2">
                        {mainQuest.title}
                      </h2>
                      <p className="text-parchment-light/70">
                        {mainQuest.description}
                      </p>
                      
                      {/* 进度条 */}
                      <div className="mt-4">
                        <div className="flex justify-between text-sm text-parchment-light/60 mb-1">
                          <span>主线进度</span>
                          <span>
                            {mainQuest.stages.filter(s => s.completed).length} / {mainQuest.stages.length}
                          </span>
                        </div>
                        <div className="h-2 bg-forge-surface rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-gold-primary to-gold-light transition-all duration-500"
                            style={{ 
                              width: `${(mainQuest.stages.filter(s => s.completed).length / mainQuest.stages.length) * 100}%` 
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
                
                {/* 阶段列表 */}
                <div>
                  <h3 className="text-sm font-display text-parchment-light/60 mb-4 flex items-center gap-2">
                    <Target className="w-4 h-4" />
                    任务阶段
                  </h3>
                  <div className="space-y-3">
                    {mainQuest.stages.sort((a, b) => a.order - b.order).map((stage, index) => (
                      <Card 
                        key={stage.id} 
                        className={cn(
                          'p-4 transition-all cursor-pointer',
                          stage.completed 
                            ? 'bg-green-900/20 border-green-500/30' 
                            : 'hover:border-gold-primary/50'
                        )}
                        onClick={() => handleToggleStage(stage.id)}
                      >
                        <div className="flex items-start gap-4">
                          {/* 完成状态图标 */}
                          <div className={cn(
                            'w-8 h-8 rounded-full flex items-center justify-center transition-all',
                            stage.completed 
                              ? 'bg-green-500/20 text-green-400' 
                              : 'bg-forge-surface text-parchment-light/40'
                          )}>
                            {stage.completed ? (
                              <CheckCircle2 className="w-5 h-5" />
                            ) : (
                              <span className="font-display font-bold">{index + 1}</span>
                            )}
                          </div>
                          
                          <div className="flex-1">
                            <h4 className={cn(
                              'font-display font-semibold mb-2 transition-all',
                              stage.completed 
                                ? 'text-green-400 line-through opacity-70' 
                                : 'text-parchment-light'
                            )}>
                              {stage.objective}
                            </h4>
                            
                            {/* 提示 */}
                            {!stage.completed && stage.hints.length > 0 && (
                              <div className="space-y-1">
                                {stage.hints.map((hint, i) => (
                                  <div key={i} className="flex items-center gap-2 text-sm text-parchment-light/50">
                                    <Lightbulb className="w-3 h-3 text-gold-primary/60" />
                                    <span>{hint}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                          
                          {/* 点击提示 */}
                          <div className="text-xs text-parchment-light/30">
                            点击{stage.completed ? '取消' : '完成'}
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
                
                {/* 可能发生的事件 */}
                {mainQuest.potentialEvents.length > 0 && (
                  <div>
                    <h3 className="text-sm font-display text-parchment-light/60 mb-4 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" />
                      可能发生的事件（DM 参考）
                    </h3>
                    <Card className="p-4">
                      <div className="flex flex-wrap gap-2">
                        {mainQuest.potentialEvents.map((event, i) => (
                          <span 
                            key={i}
                            className="px-3 py-1 rounded-full text-sm bg-forge-surface text-parchment-light/70"
                          >
                            {event}
                          </span>
                        ))}
                      </div>
                    </Card>
                  </div>
                )}
                
                {/* 世界走向 */}
                {mainQuest.worldDirection && (
                  <div>
                    <h3 className="text-sm font-display text-parchment-light/60 mb-4 flex items-center gap-2">
                      <ChevronRight className="w-4 h-4" />
                      世界走向（DM 参考）
                    </h3>
                    <Card className="p-4">
                      <p className="text-parchment-light/70 italic">
                        "{mainQuest.worldDirection}"
                      </p>
                    </Card>
                  </div>
                )}
              </div>
            </TabsContent>
          )}
          
          <TabsContent value="characters">
            {/* 隐藏的文件输入 */}
            <input
              ref={characterFileInputRef}
              type="file"
              accept=".json"
              className="hidden"
              onChange={handleImportCharacter}
            />
            
            {/* 角色操作栏 */}
            <div className="flex justify-end gap-2 mb-4">
              <Button 
                variant="secondary" 
                size="sm"
                onClick={() => characterFileInputRef.current?.click()}
                disabled={isImporting}
              >
                {isImporting ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4 mr-2" />
                )}
                导入角色
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {characters.length > 0 ? (
                characters.map((char) => (
                  <Card 
                    key={char.id} 
                    variant="hover" 
                    className="p-0 group overflow-hidden cursor-pointer"
                    onClick={() => handleViewCharacter(char)}
                  >
                    {/* 角色头部 */}
                    <div className="p-4 bg-gradient-to-r from-arcane-primary/20 to-transparent border-b border-forge-border">
                      <div className="flex items-center gap-3">
                        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-arcane-primary to-arcane-secondary flex items-center justify-center text-white font-display font-bold text-xl shadow-lg">
                          {char.name.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-display font-bold text-lg text-parchment-light truncate">
                            {char.name}
                          </h3>
                          <p className="text-sm text-parchment-light/70">
                            {char.race} · {char.class}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-parchment-light/50">等级</div>
                          <div className="text-2xl font-display font-bold text-arcane-glow">
                            {char.level}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* 角色简介 */}
                    <div className="p-4 space-y-3">
                      {/* 性格摘要 */}
                      {char.background.personality && (
                        <p className="text-xs text-parchment-light/60 line-clamp-2">
                          "{char.background.personality.slice(0, 60)}..."
                        </p>
                      )}
                      
                      {/* 属性预览 */}
                      <div className="flex justify-between text-xs">
                        <span className="text-parchment-light/50">
                          力{char.attributes.strength} 敏{char.attributes.dexterity} 体{char.attributes.constitution}
                        </span>
                        <span className="text-parchment-light/50">
                          智{char.attributes.intelligence} 感{char.attributes.wisdom} 魅{char.attributes.charisma}
                        </span>
                      </div>
                      
                      {/* 操作按钮 */}
                      <div className="flex items-center justify-between pt-2 border-t border-forge-border/50">
                        <span className={cn(
                          'text-xs px-2 py-1 rounded',
                          char.status === 'active' ? 'bg-green-500/20 text-green-400' :
                          char.status === 'incapacitated' ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-red-500/20 text-red-400'
                        )}>
                          {char.status === 'active' ? '活跃' : char.status === 'incapacitated' ? '失能' : '死亡'}
                        </span>
                        <div className="flex gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewCharacter(char);
                            }}
                            className="p-1.5 hover:bg-forge-hover rounded transition-colors"
                            title="查看详情"
                          >
                            <Eye className="w-4 h-4 text-arcane-glow" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleExportCharacter(char.id, char.name);
                            }}
                            className="p-1.5 hover:bg-forge-hover rounded transition-colors"
                            title="导出存档"
                          >
                            <Download className="w-4 h-4 text-parchment-light/60" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))
              ) : (
                <div className="col-span-full text-center py-12">
                  <Users className="w-12 h-12 text-parchment-light/20 mx-auto mb-4" />
                  <p className="text-parchment-light/40 mb-4">还没有角色</p>
                  <div className="flex justify-center gap-3">
                    <Button onClick={() => setCurrentView('character-create')}>
                      <Plus className="w-4 h-4 mr-2" />
                      创建角色
                    </Button>
                    <Button 
                      variant="secondary"
                      onClick={() => characterFileInputRef.current?.click()}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      导入角色
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="locations">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {currentWorld.locations.length > 0 ? (
                currentWorld.locations.map((loc) => (
                  <Card key={loc.id} className="p-4">
                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-arcane-glow mt-0.5" />
                      <div>
                        <h3 className="font-display font-semibold text-parchment-light">
                          {loc.name}
                        </h3>
                        <p className="text-sm text-parchment-light/60 mt-1">
                          {loc.description}
                        </p>
                      </div>
                    </div>
                  </Card>
                ))
              ) : (
                <div className="col-span-full text-center py-12">
                  <MapPin className="w-12 h-12 text-parchment-light/20 mx-auto mb-4" />
                  <p className="text-parchment-light/40">暂无地点信息</p>
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="factions">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {currentWorld.factions.length > 0 ? (
                currentWorld.factions.map((faction) => (
                  <Card key={faction.id} className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-display font-semibold text-parchment-light">
                          {faction.name}
                        </h3>
                        <p className="text-sm text-parchment-light/60 mt-1">
                          {faction.description}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-parchment-light/40">影响力</div>
                        <div className="text-lg font-display font-bold text-arcane-glow">
                          {faction.influence}/10
                        </div>
                      </div>
                    </div>
                  </Card>
                ))
              ) : (
                <div className="col-span-full text-center py-12">
                  <Swords className="w-12 h-12 text-parchment-light/20 mx-auto mb-4" />
                  <p className="text-parchment-light/40">暂无势力信息</p>
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="history">
            <div className="space-y-4">
              {currentWorld.history.length > 0 ? (
                currentWorld.history.map((event) => (
                  <Card key={event.id} className="p-4">
                    <div className="flex items-start gap-4">
                      <div className="text-center min-w-[80px]">
                        <div className="text-xs text-gold-primary">{event.era}</div>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-display font-semibold text-parchment-light">
                          {event.name}
                        </h3>
                        <p className="text-sm text-parchment-light/60 mt-1">
                          {event.description}
                        </p>
                      </div>
                    </div>
                  </Card>
                ))
              ) : (
                <div className="text-center py-12">
                  <Clock className="w-12 h-12 text-parchment-light/20 mx-auto mb-4" />
                  <p className="text-parchment-light/40">暂无历史事件</p>
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="sessions">
            <div className="space-y-4">
              {sessions.length > 0 ? (
                sessions.map((session) => (
                  <Card key={session.id} variant="hover" className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-display font-semibold text-parchment-light">
                          {session.name}
                        </h3>
                        <p className="text-sm text-parchment-light/60">
                          回合 {session.currentTurn} · {session.characters.length} 名角色
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          'text-xs px-2 py-1 rounded',
                          session.status === 'active' && 'bg-arcane-primary/20 text-arcane-glow',
                          session.status === 'paused' && 'bg-gold-primary/20 text-gold-primary',
                          session.status === 'completed' && 'bg-forge-border text-parchment-light/60'
                        )}>
                          {session.status === 'active' ? '进行中' : session.status === 'paused' ? '暂停' : '已完成'}
                        </span>
                        <Button size="sm" variant="secondary">
                          继续
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))
              ) : (
                <div className="text-center py-12">
                  <Play className="w-12 h-12 text-parchment-light/20 mx-auto mb-4" />
                  <p className="text-parchment-light/40 mb-4">还没有游戏会话</p>
                  {characters.length > 0 && (
                    <Button onClick={() => setCurrentView('session')}>
                      <Plus className="w-4 h-4 mr-2" />
                      开始新冒险
                    </Button>
                  )}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
      
      {/* 角色详情模态框 */}
      <Modal
        isOpen={showCharacterModal}
        onClose={() => setShowCharacterModal(false)}
        title={selectedCharacter?.name || '角色详情'}
        size="lg"
      >
        {selectedCharacter && (
          <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
            {/* 角色头部 */}
            <div className="flex items-center gap-4 pb-4 border-b border-forge-border">
              <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-arcane-primary to-arcane-secondary flex items-center justify-center text-white font-display font-bold text-3xl shadow-lg">
                {selectedCharacter.name.charAt(0)}
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-display font-bold text-parchment-light">
                  {selectedCharacter.name}
                </h2>
                <p className="text-parchment-light/70">
                  {selectedCharacter.race} · {selectedCharacter.class} · 等级 {selectedCharacter.level}
                </p>
                <div className="flex gap-2 mt-2">
                  <span className="text-xs px-2 py-1 rounded bg-forge-surface text-parchment-light/60">
                    {selectedCharacter.alignment.replace('-', ' ')}
                  </span>
                  <span className={cn(
                    'text-xs px-2 py-1 rounded',
                    selectedCharacter.status === 'active' ? 'bg-green-500/20 text-green-400' :
                    selectedCharacter.status === 'incapacitated' ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-red-500/20 text-red-400'
                  )}>
                    HP: {selectedCharacter.currentHP}/{selectedCharacter.maxHP}
                  </span>
                </div>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleExportCharacter(selectedCharacter.id, selectedCharacter.name)}
              >
                <Download className="w-4 h-4 mr-2" />
                导出存档
              </Button>
            </div>
            
            {/* 属性面板 */}
            <div>
              <h3 className="text-sm font-display text-parchment-light/60 mb-3 flex items-center gap-2">
                <Target className="w-4 h-4" />
                属性
              </h3>
              <div className="grid grid-cols-6 gap-2">
                {[
                  { key: 'strength', name: '力量', abbr: 'STR' },
                  { key: 'dexterity', name: '敏捷', abbr: 'DEX' },
                  { key: 'constitution', name: '体质', abbr: 'CON' },
                  { key: 'intelligence', name: '智力', abbr: 'INT' },
                  { key: 'wisdom', name: '感知', abbr: 'WIS' },
                  { key: 'charisma', name: '魅力', abbr: 'CHA' },
                ].map(attr => {
                  const value = selectedCharacter.attributes[attr.key as keyof typeof selectedCharacter.attributes];
                  const mod = getAttributeModifier(value);
                  return (
                    <div key={attr.key} className="text-center p-3 bg-forge-surface rounded-lg">
                      <div className="text-xs text-arcane-glow font-mono">{attr.abbr}</div>
                      <div className="text-2xl font-display font-bold text-parchment-light">{value}</div>
                      <div className={cn(
                        'text-sm font-mono',
                        mod >= 0 ? 'text-green-400' : 'text-red-400'
                      )}>
                        {formatModifier(mod)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            
            {/* 背景故事 */}
            {selectedCharacter.backstory && (
              <div>
                <h3 className="text-sm font-display text-parchment-light/60 mb-3 flex items-center gap-2">
                  <Scroll className="w-4 h-4" />
                  背景故事
                </h3>
                <p className="text-parchment-light/80 leading-relaxed bg-forge-surface/50 p-4 rounded-lg">
                  {selectedCharacter.backstory}
                </p>
              </div>
            )}
            
            {/* 背景要素 */}
            <div className="grid grid-cols-2 gap-4">
              {selectedCharacter.background.personality && (
                <div className="p-4 bg-forge-surface rounded-lg">
                  <h4 className="text-xs text-arcane-glow font-display mb-2 flex items-center gap-1">
                    <Heart className="w-3 h-3" />
                    性格特质
                  </h4>
                  <p className="text-sm text-parchment-light/80">
                    {selectedCharacter.background.personality}
                  </p>
                </div>
              )}
              
              {selectedCharacter.background.ideal && (
                <div className="p-4 bg-forge-surface rounded-lg">
                  <h4 className="text-xs text-gold-primary font-display mb-2 flex items-center gap-1">
                    <Target className="w-3 h-3" />
                    理想信念
                  </h4>
                  <p className="text-sm text-parchment-light/80">
                    {selectedCharacter.background.ideal}
                  </p>
                </div>
              )}
              
              {selectedCharacter.background.bond && (
                <div className="p-4 bg-forge-surface rounded-lg">
                  <h4 className="text-xs text-blue-400 font-display mb-2 flex items-center gap-1">
                    <Link className="w-3 h-3" />
                    羁绊牵挂
                  </h4>
                  <p className="text-sm text-parchment-light/80">
                    {selectedCharacter.background.bond}
                  </p>
                </div>
              )}
              
              {selectedCharacter.background.flaw && (
                <div className="p-4 bg-forge-surface rounded-lg">
                  <h4 className="text-xs text-red-400 font-display mb-2 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    性格缺陷
                  </h4>
                  <p className="text-sm text-parchment-light/80">
                    {selectedCharacter.background.flaw}
                  </p>
                </div>
              )}
            </div>
            
            {/* 技能面板 */}
            <div>
              <h3 className="text-sm font-display text-parchment-light/60 mb-3">技能</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {(['combat', 'social', 'exploration', 'knowledge'] as const).map(category => (
                  <div key={category} className="space-y-1">
                    <h4 className="text-xs text-arcane-glow uppercase tracking-wider mb-2">
                      {category === 'combat' && '战斗'}
                      {category === 'social' && '社交'}
                      {category === 'exploration' && '探索'}
                      {category === 'knowledge' && '学识'}
                    </h4>
                    {Object.entries(selectedCharacter.skills[category]).map(([skill, value]) => (
                      <div key={skill} className="flex justify-between text-xs">
                        <span className="text-parchment-light/60">{skill}</span>
                        <span className={cn(
                          'font-mono',
                          value > 0 ? 'text-green-400' : value < 0 ? 'text-red-400' : 'text-parchment-light/40'
                        )}>
                          {value >= 0 ? `+${value}` : value}
                        </span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

