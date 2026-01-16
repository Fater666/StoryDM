import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useAppStore } from '@/stores';
import { aiService } from '@/services/ai';
import { getAIConfig, getAllWorlds } from '@/services/db';
import { archiveService } from '@/services/archive';
import { logger, LogCategories } from '@/services/logger';
import { Layout } from '@/components/layout/Layout';
import { HomePage } from '@/components/home/HomePage';
import { WorldCreator } from '@/components/world/WorldCreator';
import { WorldView } from '@/components/world/WorldView';
import { CharacterCreator } from '@/components/character/CharacterCreator';
import { GameSession } from '@/components/session/GameSession';
import { SettingsPage } from '@/components/settings/SettingsPage';

function App() {
  const { currentView, setAIConfig } = useAppStore();
  const [isLoading, setIsLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState('正在初始化...');
  
  // 初始化：加载AI配置 + 自动恢复本地存档
  useEffect(() => {
    const init = async () => {
      try {
        // 1. 加载AI配置（优先保证用户的AI设置）
        setLoadingMessage('加载AI配置...');
        const config = await getAIConfig();
        if (config) {
          setAIConfig(config);
          aiService.setConfig(config);
          logger.info(LogCategories.APP, 'AI配置加载成功', { modelName: config.modelName });
        }
        
        // 2. 检查数据库是否为空，如果为空则尝试从本地存档恢复
        const existingWorlds = await getAllWorlds();
        if (existingWorlds.length === 0 && archiveService.hasLocalArchive()) {
          setLoadingMessage('检测到本地存档，正在恢复...');
          logger.info(LogCategories.APP, '检测到本地存档，数据库为空，开始自动恢复');
          
          // 本地恢复会跳过AI配置，不会覆盖用户当前的设置
          const result = await archiveService.loadFromLocal();
          if (result.success) {
            logger.info(LogCategories.APP, '本地存档自动恢复成功', result.imported);
          } else {
            logger.warn(LogCategories.APP, '本地存档恢复失败', { error: result.error });
          }
        }
      } catch (error) {
        logger.error(LogCategories.APP, '初始化失败', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    init();
  }, []);
  
  const renderView = () => {
    switch (currentView) {
      case 'home':
        return <HomePage />;
      case 'world-create':
        return <WorldCreator />;
      case 'world-view':
        return <WorldView />;
      case 'character-create':
        return <CharacterCreator />;
      case 'session':
        return <GameSession />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <HomePage />;
    }
  };
  
  // 加载中显示
  if (isLoading) {
    return (
      <div className="min-h-screen bg-ancient-dark flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="w-16 h-16 border-4 border-arcane-glow border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-parchment-light/80 font-display">{loadingMessage}</p>
        </motion.div>
      </div>
    );
  }
  
  return (
    <Layout>
      <AnimatePresence mode="wait">
        {renderView()}
      </AnimatePresence>
    </Layout>
  );
}

export default App;

