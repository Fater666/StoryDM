import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Settings, Key, Server, Brain, Save, Check, AlertCircle } from 'lucide-react';
import { Button, Input, Card, CardHeader, CardContent } from '@/components/ui';
import { useAppStore } from '@/stores';
import { aiService } from '@/services/ai';
import { saveAIConfig, getAIConfig } from '@/services/db';
import type { AIConfig } from '@/types';

export function SettingsPage() {
  const { aiConfig, setAIConfig, setCurrentView } = useAppStore();
  const [localConfig, setLocalConfig] = useState<AIConfig>(aiConfig);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testMessage, setTestMessage] = useState('');
  
  useEffect(() => {
    // 加载保存的配置
    const loadConfig = async () => {
      const savedConfig = await getAIConfig();
      if (savedConfig) {
        setLocalConfig(savedConfig);
        setAIConfig(savedConfig);
        aiService.setConfig(savedConfig);
      }
    };
    loadConfig();
  }, []);
  
  const handleSave = async () => {
    setIsSaving(true);
    setSaveStatus('idle');
    
    try {
      await saveAIConfig(localConfig);
      setAIConfig(localConfig);
      aiService.setConfig(localConfig);
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (error) {
      console.error('保存配置失败:', error);
      setSaveStatus('error');
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleTest = async () => {
    setTestStatus('testing');
    setTestMessage('');
    
    // 临时设置配置进行测试
    aiService.setConfig(localConfig);
    
    try {
      const response = await aiService.chat([
        { role: 'user', content: 'Say "Connection successful" in exactly those words.' }
      ]);
      
      if (response.content) {
        setTestStatus('success');
        setTestMessage('连接成功！AI响应正常。');
      } else {
        setTestStatus('error');
        setTestMessage('收到空响应');
      }
    } catch (error) {
      setTestStatus('error');
      setTestMessage(error instanceof Error ? error.message : '连接失败');
    }
  };
  
  return (
    <div className="min-h-screen p-8">
      <div className="max-w-2xl mx-auto">
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-arcane-primary/20 flex items-center justify-center">
              <Settings className="w-6 h-6 text-arcane-glow" />
            </div>
            <div>
              <h1 className="text-3xl font-display font-bold title-arcane">
                AI 设置
              </h1>
              <p className="text-parchment-light/60">
                配置私有模型连接
              </p>
            </div>
          </div>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Server className="w-5 h-5 text-arcane-glow" />
                <h2 className="text-lg font-display font-semibold text-parchment-light">
                  模型配置
                </h2>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <label className="block text-sm font-display text-parchment-light/80 mb-2">
                  <span className="flex items-center gap-2">
                    <Server className="w-4 h-4" />
                    API 地址 (model_url)
                  </span>
                </label>
                <Input
                  placeholder="https://api.openai.com/v1/chat/completions"
                  value={localConfig.modelUrl}
                  onChange={(e) => setLocalConfig({ ...localConfig, modelUrl: e.target.value })}
                />
                <p className="mt-1 text-xs text-parchment-light/40">
                  支持 OpenAI 兼容的 API 格式
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-display text-parchment-light/80 mb-2">
                  <span className="flex items-center gap-2">
                    <Brain className="w-4 h-4" />
                    模型名称 (model_name)
                  </span>
                </label>
                <Input
                  placeholder="gpt-3.5-turbo"
                  value={localConfig.modelName}
                  onChange={(e) => setLocalConfig({ ...localConfig, modelName: e.target.value })}
                />
              </div>
              
              <div>
                <label className="block text-sm font-display text-parchment-light/80 mb-2">
                  <span className="flex items-center gap-2">
                    <Key className="w-4 h-4" />
                    API 密钥 (api_key)
                  </span>
                </label>
                <Input
                  type="password"
                  placeholder="sk-..."
                  value={localConfig.apiKey}
                  onChange={(e) => setLocalConfig({ ...localConfig, apiKey: e.target.value })}
                />
              </div>
              
              <div>
                <label className="block text-sm font-display text-parchment-light/80 mb-2">
                  <span className="flex items-center gap-2">
                    <Server className="w-4 h-4" />
                    Embedding 地址 (可选)
                  </span>
                </label>
                <Input
                  placeholder="https://api.openai.com/v1/embeddings"
                  value={localConfig.embeddingUrl || ''}
                  onChange={(e) => setLocalConfig({ ...localConfig, embeddingUrl: e.target.value })}
                />
              </div>
              
              {/* 测试状态 */}
              {testStatus !== 'idle' && (
                <div className={`p-4 rounded-lg flex items-center gap-3 ${
                  testStatus === 'testing' ? 'bg-arcane-primary/20' :
                  testStatus === 'success' ? 'bg-green-900/30 border border-green-500/30' :
                  'bg-blood-primary/20 border border-blood-primary/30'
                }`}>
                  {testStatus === 'testing' ? (
                    <div className="w-5 h-5 border-2 border-arcane-glow border-t-transparent rounded-full animate-spin" />
                  ) : testStatus === 'success' ? (
                    <Check className="w-5 h-5 text-green-400" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-blood-primary" />
                  )}
                  <span className={
                    testStatus === 'success' ? 'text-green-400' :
                    testStatus === 'error' ? 'text-blood-primary' :
                    'text-parchment-light'
                  }>
                    {testStatus === 'testing' ? '测试连接中...' : testMessage}
                  </span>
                </div>
              )}
              
              <div className="flex gap-3 pt-4">
                <Button
                  variant="secondary"
                  onClick={handleTest}
                  disabled={!localConfig.modelUrl || !localConfig.apiKey || testStatus === 'testing'}
                >
                  测试连接
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={isSaving}
                >
                  {saveStatus === 'success' ? (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      已保存
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      保存配置
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        
        {/* 使用说明 */}
        <motion.div
          className="mt-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <h2 className="text-lg font-display font-semibold text-parchment-light">
                使用说明
              </h2>
            </CardHeader>
            <CardContent>
              <div className="prose prose-invert prose-sm max-w-none">
                <ul className="space-y-2 text-parchment-light/80">
                  <li>
                    <strong className="text-parchment-light">OpenAI API：</strong>
                    使用 <code className="text-arcane-glow">https://api.openai.com/v1/chat/completions</code> 作为 API 地址
                  </li>
                  <li>
                    <strong className="text-parchment-light">本地模型：</strong>
                    支持 Ollama、LM Studio 等本地部署的模型，只需填入对应的 API 地址
                  </li>
                  <li>
                    <strong className="text-parchment-light">其他兼容服务：</strong>
                    支持任何兼容 OpenAI API 格式的服务，如 Azure OpenAI、Anthropic Claude 等
                  </li>
                  <li>
                    <strong className="text-parchment-light">无 AI 模式：</strong>
                    不配置 AI 也可以使用，AI 角色将使用简单的预设回复
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        
        <div className="mt-6 flex justify-center">
          <Button variant="secondary" onClick={() => setCurrentView('home')}>
            返回首页
          </Button>
        </div>
      </div>
    </div>
  );
}

