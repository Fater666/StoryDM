import { useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/stores';
import { aiService } from '@/services/ai';
import { getAIConfig } from '@/services/db';
import { Layout } from '@/components/layout/Layout';
import { HomePage } from '@/components/home/HomePage';
import { WorldCreator } from '@/components/world/WorldCreator';
import { WorldView } from '@/components/world/WorldView';
import { CharacterCreator } from '@/components/character/CharacterCreator';
import { GameSession } from '@/components/session/GameSession';
import { SettingsPage } from '@/components/settings/SettingsPage';

function App() {
  const { currentView, setAIConfig } = useAppStore();
  
  // 初始化时加载AI配置
  useEffect(() => {
    const initConfig = async () => {
      const config = await getAIConfig();
      if (config) {
        setAIConfig(config);
        aiService.setConfig(config);
      }
    };
    initConfig();
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
  
  return (
    <Layout>
      <AnimatePresence mode="wait">
        {renderView()}
      </AnimatePresence>
    </Layout>
  );
}

export default App;

