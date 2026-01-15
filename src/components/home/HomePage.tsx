import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Globe, Plus, Play, Settings, Scroll, Users, Dices, Clock, Sparkles } from 'lucide-react';
import { Button, Card } from '@/components/ui';
import { useWorldStore, useAppStore } from '@/stores';
import { cn } from '@/utils/cn';

export function HomePage() {
  const { worlds, loadWorlds, isLoading } = useWorldStore();
  const { setCurrentView, setCurrentWorld, aiConfig } = useAppStore();
  
  useEffect(() => {
    loadWorlds();
  }, []);
  
  const handleWorldClick = (worldId: string) => {
    setCurrentWorld(worldId);
    setCurrentView('world-view');
  };
  
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* 背景装饰 */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-arcane-primary/10 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-gold-primary/5 rounded-full blur-[100px]" />
        </div>
        
        <div className="relative max-w-6xl mx-auto px-8 pt-16 pb-12">
          <motion.div
            className="text-center"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Logo */}
            <motion.div
              className="w-24 h-24 mx-auto mb-8 relative"
              animate={{ rotateY: [0, 360] }}
              transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-arcane-primary to-arcane-secondary rounded-2xl transform rotate-45" />
              <div className="absolute inset-2 bg-forge-bg rounded-xl transform rotate-45" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Dices className="w-10 h-10 text-arcane-glow" />
              </div>
            </motion.div>
            
            <h1 className="text-5xl md:text-6xl font-display font-bold mb-4">
              <span className="title-arcane">StoryForge</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-gold-light font-display mb-6">
              AI 跑团创世引擎
            </p>
            
            <p className="max-w-2xl mx-auto text-parchment-light/70 text-lg leading-relaxed mb-8">
              在这里，你是 DM，而跑团玩家却是你设计的AI。
              <br />
              你的乐趣，是看着他们在规则中走向不可预测的命运。
            </p>
            
            <div className="flex flex-wrap justify-center gap-4">
              <Button
                variant="gold"
                size="lg"
                onClick={() => setCurrentView('world-create')}
              >
                <Plus className="w-5 h-5 mr-2" />
                创造新世界
              </Button>
              <Button
                variant="secondary"
                size="lg"
                onClick={() => setCurrentView('settings')}
              >
                <Settings className="w-5 h-5 mr-2" />
                配置 AI
              </Button>
            </div>
            
            {/* AI 配置状态 */}
            <div className="mt-6">
              {aiConfig.modelUrl && aiConfig.apiKey ? (
                <span className="inline-flex items-center gap-2 text-sm text-green-400">
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  AI 已配置
                </span>
              ) : (
                <span className="inline-flex items-center gap-2 text-sm text-parchment-light/40">
                  <span className="w-2 h-2 bg-parchment-light/40 rounded-full" />
                  未配置 AI（可使用基础模式）
                </span>
              )}
            </div>
          </motion.div>
        </div>
      </div>
      
      {/* 特性展示 */}
      <div className="max-w-6xl mx-auto px-8 py-12">
        <motion.div
          className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-16"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          {[
            {
              icon: Globe,
              title: '世界创建',
              desc: '手写、小说、URL三种方式',
            },
            {
              icon: Users,
              title: 'AI 玩家',
              desc: '完整角色卡驱动的智能体',
            },
            {
              icon: Dices,
              title: '骰子系统',
              desc: 'd20/百分骰/自定义骰',
            },
            {
              icon: Scroll,
              title: '故事输出',
              desc: '时间线、日志、小说草稿',
            },
          ].map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + index * 0.1 }}
            >
              <Card className="p-6 h-full text-center">
                <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-arcane-primary/20 flex items-center justify-center">
                  <feature.icon className="w-6 h-6 text-arcane-glow" />
                </div>
                <h3 className="font-display font-semibold text-parchment-light mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-parchment-light/60">
                  {feature.desc}
                </p>
              </Card>
            </motion.div>
          ))}
        </motion.div>
        
        {/* 世界列表 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-display font-bold text-parchment-light">
              你的世界
            </h2>
            {worlds.length > 0 && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setCurrentView('world-create')}
              >
                <Plus className="w-4 h-4 mr-2" />
                新建
              </Button>
            )}
          </div>
          
          {isLoading ? (
            <div className="text-center py-12">
              <div className="w-8 h-8 border-2 border-arcane-primary border-t-transparent rounded-full animate-spin mx-auto" />
            </div>
          ) : worlds.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {worlds.map((world, index) => (
                <motion.div
                  key={world.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 + index * 0.05 }}
                >
                  <Card
                    variant="hover"
                    className="p-6 h-full"
                    onClick={() => handleWorldClick(world.id)}
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-arcane-primary to-arcane-secondary flex items-center justify-center flex-shrink-0">
                        <Globe className="w-7 h-7 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-display font-semibold text-lg text-parchment-light mb-1 truncate">
                          {world.name}
                        </h3>
                        <p className="text-sm text-parchment-light/60 line-clamp-2 mb-3">
                          {world.background.slice(0, 100)}...
                        </p>
                        <div className="flex flex-wrap gap-2">
                          <span className="inline-flex items-center gap-1 text-xs text-parchment-light/40">
                            <Clock className="w-3 h-3" />
                            {new Date(world.updatedAt).toLocaleDateString()}
                          </span>
                          {world.locations.length > 0 && (
                            <span className="text-xs text-arcane-glow">
                              {world.locations.length} 个地点
                            </span>
                          )}
                          {world.factions.length > 0 && (
                            <span className="text-xs text-gold-primary">
                              {world.factions.length} 个势力
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          ) : (
            <Card className="p-12 text-center">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-forge-surface flex items-center justify-center">
                <Sparkles className="w-10 h-10 text-parchment-light/20" />
              </div>
              <h3 className="text-xl font-display font-semibold text-parchment-light mb-2">
                还没有世界
              </h3>
              <p className="text-parchment-light/60 mb-6">
                创造你的第一个世界，开始你的跑团之旅
              </p>
              <Button
                variant="gold"
                onClick={() => setCurrentView('world-create')}
              >
                <Plus className="w-4 h-4 mr-2" />
                创造新世界
              </Button>
            </Card>
          )}
        </motion.div>
      </div>
      
      {/* 底部引用 */}
      <div className="max-w-4xl mx-auto px-8 py-16 text-center">
        <div className="divider-arcane mb-8" />
        <motion.blockquote
          className="text-lg text-parchment-light/60 italic font-body"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          "你不会控制故事。你只是看着这些角色——
          <br />
          在规则与骰子之下，一步步走向你从未预料的结局。"
        </motion.blockquote>
      </div>
    </div>
  );
}

