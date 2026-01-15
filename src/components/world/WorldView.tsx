import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Globe, MapPin, Users, Clock, Swords, Plus, Play, Settings, Trash2 } from 'lucide-react';
import { Button, Card, CardContent, CardHeader, Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui';
import { useWorldStore, useCharacterStore, useSessionStore, useAppStore } from '@/stores';
import { cn } from '@/utils/cn';

export function WorldView() {
  const { currentWorldId, setCurrentView } = useAppStore();
  const { currentWorld, loadWorld, deleteWorld } = useWorldStore();
  const { characters, loadCharactersByWorld } = useCharacterStore();
  const { sessions, loadSessionsByWorld } = useSessionStore();
  
  useEffect(() => {
    if (currentWorldId) {
      loadWorld(currentWorldId);
      loadCharactersByWorld(currentWorldId);
      loadSessionsByWorld(currentWorldId);
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
              <Button variant="secondary" size="sm" onClick={handleDelete}>
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
        <Tabs defaultValue="characters" className="space-y-6">
          <TabsList>
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
          
          <TabsContent value="characters">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {characters.length > 0 ? (
                characters.map((char) => (
                  <Card key={char.id} variant="hover" className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-arcane-primary to-arcane-secondary flex items-center justify-center text-white font-display font-bold text-lg">
                        {char.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-display font-semibold text-parchment-light truncate">
                          {char.name}
                        </h3>
                        <p className="text-sm text-parchment-light/60">
                          {char.race} · {char.class} · Lv.{char.level}
                        </p>
                        <div className="flex gap-1 mt-2">
                          <span className="text-xs px-2 py-0.5 rounded bg-forge-surface text-parchment-light/60">
                            {char.alignment.replace('-', ' ')}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))
              ) : (
                <div className="col-span-full text-center py-12">
                  <Users className="w-12 h-12 text-parchment-light/20 mx-auto mb-4" />
                  <p className="text-parchment-light/40 mb-4">还没有角色</p>
                  <Button onClick={() => setCurrentView('character-create')}>
                    <Plus className="w-4 h-4 mr-2" />
                    创建第一个角色
                  </Button>
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
    </div>
  );
}

