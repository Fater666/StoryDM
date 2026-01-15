import { motion } from 'framer-motion';
import { Home, Globe, Users, Play, Settings, ChevronLeft, Menu, X, Dices } from 'lucide-react';
import { useAppStore } from '@/stores';
import { cn } from '@/utils/cn';
import type { AppView } from '@/types';

interface LayoutProps {
  children: React.ReactNode;
}

const navItems: { view: AppView; icon: typeof Home; label: string }[] = [
  { view: 'home', icon: Home, label: '首页' },
  { view: 'settings', icon: Settings, label: '设置' },
];

export function Layout({ children }: LayoutProps) {
  const { currentView, setCurrentView, sidebarOpen, toggleSidebar, goBack, navigationHistory } = useAppStore();
  
  const showBackButton = navigationHistory.length > 0 && currentView !== 'home';
  
  return (
    <div className="min-h-screen flex">
      {/* 移动端顶部栏 */}
      <div className="fixed top-0 left-0 right-0 h-14 bg-forge-surface/90 backdrop-blur-sm border-b border-forge-border z-40 flex items-center px-4 md:hidden">
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-lg hover:bg-forge-hover text-parchment-light/60"
        >
          {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
        <div className="flex-1 flex items-center justify-center gap-2">
          <Dices className="w-5 h-5 text-arcane-glow" />
          <span className="font-display font-semibold text-parchment-light">StoryForge</span>
        </div>
        {showBackButton && (
          <button
            onClick={goBack}
            className="p-2 rounded-lg hover:bg-forge-hover text-parchment-light/60"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}
      </div>
      
      {/* 侧边栏 */}
      <motion.aside
        className={cn(
          'fixed md:static top-14 md:top-0 bottom-0 left-0 z-30',
          'w-64 bg-forge-surface border-r border-forge-border',
          'transform transition-transform duration-300',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0 md:w-20'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo - 桌面端 */}
          <div className="hidden md:flex items-center gap-3 p-4 border-b border-forge-border">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-arcane-primary to-arcane-secondary flex items-center justify-center">
              <Dices className="w-5 h-5 text-white" />
            </div>
            {sidebarOpen && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <h1 className="font-display font-bold text-parchment-light">StoryForge</h1>
                <p className="text-xs text-parchment-light/40">AI 跑团引擎</p>
              </motion.div>
            )}
          </div>
          
          {/* 导航 */}
          <nav className="flex-1 p-4 space-y-2">
            {navItems.map((item) => (
              <button
                key={item.view}
                onClick={() => {
                  setCurrentView(item.view);
                  if (window.innerWidth < 768) toggleSidebar();
                }}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all',
                  currentView === item.view
                    ? 'bg-arcane-primary/20 text-arcane-glow'
                    : 'text-parchment-light/60 hover:text-parchment-light hover:bg-forge-hover'
                )}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {sidebarOpen && (
                  <span className="font-display text-sm">{item.label}</span>
                )}
              </button>
            ))}
          </nav>
          
          {/* 底部 */}
          <div className="p-4 border-t border-forge-border">
            <button
              onClick={toggleSidebar}
              className="hidden md:flex w-full items-center justify-center gap-2 px-3 py-2 rounded-lg text-parchment-light/40 hover:text-parchment-light hover:bg-forge-hover transition-all"
            >
              <ChevronLeft className={cn('w-5 h-5 transition-transform', !sidebarOpen && 'rotate-180')} />
              {sidebarOpen && <span className="text-sm">收起</span>}
            </button>
          </div>
        </div>
      </motion.aside>
      
      {/* 遮罩层 - 移动端 */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 md:hidden"
          onClick={toggleSidebar}
        />
      )}
      
      {/* 主内容区 */}
      <main className={cn(
        'flex-1 min-h-screen',
        'pt-14 md:pt-0',
        sidebarOpen ? 'md:ml-0' : 'md:ml-0'
      )}>
        <motion.div
          key={currentView}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
        >
          {children}
        </motion.div>
      </main>
    </div>
  );
}

