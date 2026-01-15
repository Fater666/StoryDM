import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AppView, AIConfig } from '@/types';

interface AppState {
  // 当前视图
  currentView: AppView;
  setCurrentView: (view: AppView) => void;
  
  // 当前选中的世界和会话
  currentWorldId: string | null;
  currentSessionId: string | null;
  setCurrentWorld: (id: string | null) => void;
  setCurrentSession: (id: string | null) => void;
  
  // 侧边栏状态
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  
  // AI 配置
  aiConfig: AIConfig;
  setAIConfig: (config: AIConfig) => void;
  
  // 导航历史
  navigationHistory: AppView[];
  goBack: () => void;
}

const defaultAIConfig: AIConfig = {
  modelUrl: 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
  modelName: 'gemini-2.0-flash',
  apiKey: 'AIzaSyCnCkszEY0Mm08iUN3TtfZVbpBlDXwV3qY',
  embeddingUrl: '',
};

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      currentView: 'home',
      setCurrentView: (view) => {
        const { currentView, navigationHistory } = get();
        set({
          currentView: view,
          navigationHistory: [...navigationHistory.slice(-10), currentView],
        });
      },
      
      currentWorldId: null,
      currentSessionId: null,
      setCurrentWorld: (id) => set({ currentWorldId: id }),
      setCurrentSession: (id) => set({ currentSessionId: id }),
      
      sidebarOpen: true,
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      
      aiConfig: defaultAIConfig,
      setAIConfig: (config) => set({ aiConfig: config }),
      
      navigationHistory: [],
      goBack: () => {
        const { navigationHistory } = get();
        if (navigationHistory.length > 0) {
          const previousView = navigationHistory[navigationHistory.length - 1];
          set({
            currentView: previousView,
            navigationHistory: navigationHistory.slice(0, -1),
          });
        }
      },
    }),
    {
      name: 'storyforge-app',
      partialize: (state) => ({
        aiConfig: state.aiConfig,
        sidebarOpen: state.sidebarOpen,
      }),
    }
  )
);

