import type { AIConfig, AIMessage, AIResponse, Character, World, TurnAction } from '@/types';

// AI 服务类
class AIService {
  private config: AIConfig | null = null;
  
  setConfig(config: AIConfig) {
    this.config = config;
  }
  
  getConfig(): AIConfig | null {
    return this.config;
  }
  
  isConfigured(): boolean {
    return !!(this.config?.modelUrl && this.config?.apiKey);
  }
  
  // 通用 API 调用
  async chat(messages: AIMessage[]): Promise<AIResponse> {
    if (!this.config?.modelUrl || !this.config?.apiKey) {
      throw new Error('AI 服务未配置');
    }
    
    const response = await fetch(this.config.modelUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify({
        model: this.config.modelName || 'gpt-3.5-turbo',
        messages,
        temperature: 0.8,
        max_tokens: 2000,
      }),
    });
    
    if (!response.ok) {
      throw new Error(`AI 请求失败: ${response.status}`);
    }
    
    const data = await response.json();
    
    return {
      content: data.choices?.[0]?.message?.content || '',
      usage: data.usage ? {
        promptTokens: data.usage.prompt_tokens,
        completionTokens: data.usage.completion_tokens,
        totalTokens: data.usage.total_tokens,
      } : undefined,
    };
  }
  
  // 解析世界设定
  async parseWorldContent(content: string, sourceType: string): Promise<{
    background: string;
    locations: { name: string; description: string }[];
    factions: { name: string; description: string; influence: number }[];
    history: { name: string; description: string; era: string }[];
    conflicts: { name: string; description: string; status: string }[];
  }> {
    const systemPrompt = `你是一个专业的世界观解析器。用户会提供${
      sourceType === 'novel' ? '小说文本' : sourceType === 'url' ? 'URL内容' : '手写设定'
    }。

请从中提取并生成以下信息（以JSON格式返回）：
1. background: 世界背景概述（200-500字）
2. locations: 重要地点列表，每个包含 name 和 description
3. factions: 势力/派系列表，每个包含 name、description 和 influence（1-10）
4. history: 重要历史事件，每个包含 name、description 和 era（时代）
5. conflicts: 潜在冲突，每个包含 name、description 和 status（dormant/brewing/active）

请确保输出是有效的JSON格式。如果某些信息不明确，可以基于上下文合理推断。`;

    const messages: AIMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `请解析以下内容：\n\n${content}` },
    ];
    
    const response = await this.chat(messages);
    
    try {
      // 尝试提取JSON
      const jsonMatch = response.content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      throw new Error('无法解析响应');
    } catch {
      // 返回默认结构
      return {
        background: response.content,
        locations: [],
        factions: [],
        history: [],
        conflicts: [],
      };
    }
  }
  
  // 生成主线剧情
  async generateMainQuest(world: World): Promise<{
    title: string;
    description: string;
    stages: { objective: string; hints: string[] }[];
    potentialEvents: string[];
    worldDirection: string;
  }> {
    const systemPrompt = `你是一个专业的跑团DM助手。基于世界设定，生成一条隐藏的主线剧情结构。

这个主线仅作为DM的参考，不会强制AI角色执行。

请以JSON格式返回：
1. title: 主线标题
2. description: 主线描述（100-200字）
3. stages: 阶段目标数组，每个包含 objective 和 hints（提示数组）
4. potentialEvents: 可能触发的关键事件列表
5. worldDirection: 世界可能的走向建议`;

    const worldContext = `
世界名称：${world.name}
背景：${world.background}
势力：${world.factions.map(f => f.name).join('、')}
冲突：${world.conflicts.map(c => c.name).join('、')}
`;

    const messages: AIMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: worldContext },
    ];
    
    const response = await this.chat(messages);
    
    try {
      const jsonMatch = response.content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      throw new Error('无法解析响应');
    } catch {
      return {
        title: '未知的命运',
        description: response.content,
        stages: [],
        potentialEvents: [],
        worldDirection: '',
      };
    }
  }
  
  // AI 角色提出行动
  async proposeAction(
    character: Character,
    world: World,
    currentSituation: string,
    recentEvents: string[]
  ): Promise<TurnAction> {
    const systemPrompt = `你正在扮演一个跑团角色。你只知道自己的角色卡信息、当前世界状态和个人记忆。
你对主线和未来一无所知。

请根据角色的性格、背景和当前处境，提出一个合理的行动。

角色信息：
- 姓名：${character.name}
- 种族：${character.race}
- 职业：${character.class}
- 阵营：${character.alignment}
- 性格特质：${character.background.personality}
- 理想：${character.background.ideal}
- 羁绊：${character.background.bond}
- 缺陷：${character.background.flaw}

属性：
- 力量 ${character.attributes.strength}
- 敏捷 ${character.attributes.dexterity}
- 体质 ${character.attributes.constitution}
- 智力 ${character.attributes.intelligence}
- 感知 ${character.attributes.wisdom}
- 魅力 ${character.attributes.charisma}

请以JSON格式返回：
{
  "proposedAction": "描述角色想要执行的具体行动",
  "aiReasoning": "角色做出这个决定的内心想法（第一人称）"
}

保持角色性格一致性，行动要符合角色的能力和动机。`;

    const memories = character.memories
      .sort((a, b) => b.importance - a.importance)
      .slice(0, 5)
      .map(m => m.content)
      .join('\n');

    const userContent = `
当前处境：
${currentSituation}

最近发生的事件：
${recentEvents.join('\n')}

你的重要记忆：
${memories || '（无特别记忆）'}

请提出你的行动。`;

    const messages: AIMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userContent },
    ];
    
    const response = await this.chat(messages);
    
    try {
      const jsonMatch = response.content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          id: crypto.randomUUID(),
          characterId: character.id,
          characterName: character.name,
          proposedAction: parsed.proposedAction || response.content,
          aiReasoning: parsed.aiReasoning || '',
        };
      }
    } catch {
      // 解析失败时的回退
    }
    
    return {
      id: crypto.randomUUID(),
      characterId: character.id,
      characterName: character.name,
      proposedAction: response.content,
      aiReasoning: '（未能解析内心想法）',
    };
  }
  
  // 生成结果叙述
  async generateNarration(
    action: TurnAction,
    checkResult: { success: boolean; roll: number; difficulty: number },
    world: World
  ): Promise<string> {
    const systemPrompt = `你是一个跑团DM的叙述助手。根据角色的行动和骰子结果，生成一段生动的叙述。

骰子结果：${checkResult.roll} vs 难度 ${checkResult.difficulty}
判定：${checkResult.success ? '成功' : '失败'}

请生成一段50-150字的叙述，描述这个行动的过程和结果。
- 如果成功，描述角色如何完成了行动
- 如果失败，描述发生了什么意外或问题
- 保持世界观一致性
- 不要过度解释或添加不必要的后果`;

    const messages: AIMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `角色 ${action.characterName} 尝试：${action.proposedAction}` },
    ];
    
    const response = await this.chat(messages);
    return response.content;
  }
}

export const aiService = new AIService();

