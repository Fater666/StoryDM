import type { AIConfig, AIMessage, AIResponse, Character, World, TurnAction, CharacterAttributes, CharacterSkills, CharacterBackground, Alignment } from '@/types';
import { logger, LogCategories } from './logger';

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
  
  // 从响应中提取 JSON（处理 markdown 代码块）
  private extractJSON(content: string): any {
    // 1. 先去掉 markdown 代码块标记和前后的非JSON内容
    let cleaned = content
      .replace(/```json\s*/gi, '')
      .replace(/```\s*/g, '')
      .replace(/^[^{]*/, '')  // 去掉开头的非JSON内容
      .replace(/[^}]*$/, '')  // 去掉结尾的非JSON内容
      .trim();
    
    logger.debug(LogCategories.AI, 'extractJSON 清理后', { 
      originalLength: content.length,
      cleanedLength: cleaned.length,
    });
    
    // 2. 尝试直接解析
    try {
      const result = JSON.parse(cleaned);
      logger.debug(LogCategories.AI, 'JSON 直接解析成功', { keys: Object.keys(result) });
      return result;
    } catch (e1) {
      logger.debug(LogCategories.AI, 'JSON 直接解析失败，尝试提取', { error: (e1 as Error).message });
      
      // 3. 尝试提取 JSON 对象（贪婪匹配最外层的 {}）
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const result = JSON.parse(jsonMatch[0]);
          logger.debug(LogCategories.AI, 'JSON 提取解析成功', { keys: Object.keys(result) });
          return result;
        } catch (e2) {
          logger.debug(LogCategories.AI, 'JSON 提取解析失败，尝试修复', { error: (e2 as Error).message });
          
          // 4. 尝试修复常见的 JSON 问题
          let fixedJson = jsonMatch[0];
          
          // 4a. 修复被截断的数组（未闭合的 []）
          const openBrackets = (fixedJson.match(/\[/g) || []).length;
          const closeBrackets = (fixedJson.match(/\]/g) || []).length;
          if (openBrackets > closeBrackets) {
            // 在最后一个有效内容后添加闭合括号
            fixedJson = fixedJson.replace(/,?\s*$/, '') + ']'.repeat(openBrackets - closeBrackets);
          }
          
          // 4b. 修复被截断的对象（未闭合的 {}）
          const openBraces = (fixedJson.match(/\{/g) || []).length;
          const closeBraces = (fixedJson.match(/\}/g) || []).length;
          if (openBraces > closeBraces) {
            fixedJson = fixedJson.replace(/,?\s*$/, '') + '}'.repeat(openBraces - closeBraces);
          }
          
          // 4c. 修复未闭合的字符串
          // 检测是否在字符串中间被截断
          const quoteCount = (fixedJson.match(/(?<!\\)"/g) || []).length;
          if (quoteCount % 2 !== 0) {
            // 奇数个引号，说明有未闭合的字符串
            fixedJson = fixedJson + '"';
            // 重新计算并补充闭合括号
            const newOpenBrackets = (fixedJson.match(/\[/g) || []).length;
            const newCloseBrackets = (fixedJson.match(/\]/g) || []).length;
            const newOpenBraces = (fixedJson.match(/\{/g) || []).length;
            const newCloseBraces = (fixedJson.match(/\}/g) || []).length;
            fixedJson += ']'.repeat(Math.max(0, newOpenBrackets - newCloseBrackets));
            fixedJson += '}'.repeat(Math.max(0, newOpenBraces - newCloseBraces));
          }
          
          try {
            const result = JSON.parse(fixedJson);
            logger.info(LogCategories.AI, 'JSON 修复后解析成功', { keys: Object.keys(result) });
            return result;
          } catch (e3) {
            logger.warn(LogCategories.AI, 'JSON 修复后仍然解析失败', { 
              error: (e3 as Error).message,
              fixedJsonPreview: fixedJson.slice(0, 200),
            });
          }
        }
      } else {
        logger.warn(LogCategories.AI, '未找到 JSON 对象', { cleanedPreview: cleaned.slice(0, 200) });
      }
    }
    
    return null;
  }
  
  // 通用 API 调用
  async chat(messages: AIMessage[]): Promise<AIResponse> {
    if (!this.config?.modelUrl || !this.config?.apiKey) {
      logger.error(LogCategories.AI, 'AI 服务未配置');
      throw new Error('AI 服务未配置');
    }
    
    logger.debug(LogCategories.AI, '发送 AI 请求', {
      model: this.config.modelName,
      messagesCount: messages.length,
    });
    
    const startTime = Date.now();
    
    try {
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
      
      const duration = Date.now() - startTime;
      
      if (!response.ok) {
        const errorText = await response.text();
        logger.error(LogCategories.AI, `AI 请求失败: ${response.status}`, { 
          status: response.status, 
          error: errorText,
          duration,
        });
        throw new Error(`AI 请求失败: ${response.status}`);
      }
      
      const data = await response.json();
      
      const result = {
        content: data.choices?.[0]?.message?.content || '',
        usage: data.usage ? {
          promptTokens: data.usage.prompt_tokens,
          completionTokens: data.usage.completion_tokens,
          totalTokens: data.usage.total_tokens,
        } : undefined,
      };
      
      logger.info(LogCategories.AI, 'AI 请求成功', {
        duration: `${duration}ms`,
        responseLength: result.content.length,
        usage: result.usage,
      });
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error(LogCategories.AI, 'AI 请求异常', { error, duration: `${duration}ms` });
      throw error;
    }
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

请从中提取并生成世界设定信息。

【输出格式要求】
必须严格按照以下JSON格式输出，不要添加任何其他内容，不要使用markdown代码块：

{
  "background": "世界背景概述，200-500字的完整描述",
  "locations": [
    {"name": "地点名称1", "description": "该地点的详细描述"},
    {"name": "地点名称2", "description": "该地点的详细描述"}
  ],
  "factions": [
    {"name": "势力名称1", "description": "势力描述", "influence": 8},
    {"name": "势力名称2", "description": "势力描述", "influence": 5}
  ],
  "history": [
    {"name": "历史事件1", "description": "事件描述", "era": "远古时代"},
    {"name": "历史事件2", "description": "事件描述", "era": "近代"}
  ],
  "conflicts": [
    {"name": "冲突名称1", "description": "冲突描述", "status": "active"},
    {"name": "冲突名称2", "description": "冲突描述", "status": "brewing"}
  ]
}

【字段说明】
- background: 世界背景概述（必填，200-500字）
- locations: 重要地点列表（至少2-5个）
- factions: 势力/派系列表，influence为1-10的整数
- history: 重要历史事件，era为时代名称
- conflicts: 潜在冲突，status只能是 "dormant"(潜伏)、"brewing"(酝酿中)、"active"(激活) 之一

【重要提醒】
1. 必须输出完整的JSON对象，包含所有5个字段
2. 每个数组至少包含2个元素
3. 如果原文信息不足，请基于上下文合理推断补充
4. 直接输出JSON，不要任何前缀或后缀文字`;

    const messages: AIMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `请解析以下内容并输出JSON：\n\n${content}` },
    ];
    
    logger.info(LogCategories.AI, '开始解析世界内容', { sourceType, contentLength: content.length });
    
    const response = await this.chat(messages);
    
    // 记录原始响应用于调试
    logger.debug(LogCategories.AI, 'AI 原始响应', { 
      responseLength: response.content.length,
      responsePreview: response.content.slice(0, 500),
    });
    
    const parsed = this.extractJSON(response.content);
    if (parsed && parsed.background) {
      logger.info(LogCategories.AI, '世界内容解析成功', {
        locationsCount: parsed.locations?.length || 0,
        factionsCount: parsed.factions?.length || 0,
        historyCount: parsed.history?.length || 0,
        conflictsCount: parsed.conflicts?.length || 0,
      });
      return {
        background: parsed.background || '',
        locations: Array.isArray(parsed.locations) ? parsed.locations : [],
        factions: Array.isArray(parsed.factions) ? parsed.factions : [],
        history: Array.isArray(parsed.history) ? parsed.history : [],
        conflicts: Array.isArray(parsed.conflicts) ? parsed.conflicts : [],
      };
    }
    
    logger.warn(LogCategories.AI, '世界内容解析返回默认结构', {
      parsedKeys: parsed ? Object.keys(parsed) : [],
      rawResponse: response.content.slice(0, 300),
    });
    // 返回默认结构
    return {
      background: response.content.replace(/```json\s*/gi, '').replace(/```/g, '').trim(),
      locations: [],
      factions: [],
      history: [],
      conflicts: [],
    };
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

【输出格式要求】
必须严格按照以下JSON格式输出，不要添加任何其他内容：

{
  "title": "主线标题（简短有力）",
  "description": "主线描述，100-200字，概述整个剧情走向",
  "stages": [
    {
      "objective": "第一阶段目标描述",
      "hints": ["提示1", "提示2", "提示3"]
    },
    {
      "objective": "第二阶段目标描述",
      "hints": ["提示1", "提示2"]
    }
  ],
  "potentialEvents": [
    "可能发生的关键事件1",
    "可能发生的关键事件2",
    "可能发生的关键事件3"
  ],
  "worldDirection": "世界可能的走向和发展建议"
}

【要求】
- stages 至少包含3个阶段
- potentialEvents 至少包含3个事件
- 直接输出JSON，不要任何前缀或后缀`;

    const worldContext = `请为以下世界生成主线剧情：

世界名称：${world.name}
背景：${world.background}
势力：${world.factions.map(f => f.name).join('、') || '暂无'}
冲突：${world.conflicts.map(c => c.name).join('、') || '暂无'}
`;

    const messages: AIMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: worldContext },
    ];
    
    const response = await this.chat(messages);
    
    const parsed = this.extractJSON(response.content);
    if (parsed && parsed.title) {
      return {
        title: parsed.title || '未知的命运',
        description: parsed.description || '',
        stages: parsed.stages || [],
        potentialEvents: parsed.potentialEvents || [],
        worldDirection: parsed.worldDirection || '',
      };
    }
    
    return {
      title: '未知的命运',
      description: response.content.replace(/```json\s*/gi, '').replace(/```/g, '').trim(),
      stages: [],
      potentialEvents: [],
      worldDirection: '',
    };
  }
  
  // AI 角色提出行动
  async proposeAction(
    character: Character,
    world: World,
    currentSituation: string,
    recentEvents: string[]
  ): Promise<TurnAction> {
    // 根据世界背景推断文风
    const worldStyle = world.background.slice(0, 200);
    
    const systemPrompt = `你是一名跑团玩家，正在扮演角色${character.name}。你需要以第一人称向DM描述你想要做的行动。

【世界背景】
${world.name}：${worldStyle}...

【你的角色】
- 姓名：${character.name}
- 身份：${character.race} ${character.class}
- 性格：${character.background.personality}
- 信念：${character.background.ideal}
- 牵挂：${character.background.bond}
- 弱点：${character.background.flaw}

【行为准则】
1. 完全代入角色的性格和动机
2. 用第一人称描述你想做什么，就像跑团玩家向DM宣言行动
3. 可以描述动作、对话、表情等，但要简洁
4. 不要使用"检定"、"骰子"、"DC"等游戏术语
5. 不要预设结果，只描述你想尝试做什么

【输出格式】
直接输出JSON，不要任何其他内容：

{"proposedAction": "用第一人称描述你想做的行动", "aiReasoning": "你的内心想法和动机"}

【示例】
{"proposedAction": "我走到窗边，望向远方的城堡。我想仔细观察一下城堡周围有没有巡逻的守卫。", "aiReasoning": "那座城堡里藏着我要找的答案。但现在贸然前往太危险了，我需要先弄清楚守卫的巡逻规律..."}
{"proposedAction": "我朝那个商人露出友善的微笑，走上前去打招呼：'您好，请问这附近有没有便宜的旅店？'", "aiReasoning": "看起来是个本地人，说不定能打听到一些有用的消息。"}

请根据当前处境，描述你想做什么。`;

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
    
    const parsed = this.extractJSON(response.content);
    if (parsed && parsed.proposedAction) {
      return {
        id: crypto.randomUUID(),
        characterId: character.id,
        characterName: character.name,
        proposedAction: parsed.proposedAction,
        aiReasoning: parsed.aiReasoning || '',
      };
    }
    
    return {
      id: crypto.randomUUID(),
      characterId: character.id,
      characterName: character.name,
      proposedAction: response.content.replace(/```json\s*/gi, '').replace(/```/g, '').trim(),
      aiReasoning: '（未能解析内心想法）',
    };
  }
  
  // 生成结果叙述
  async generateNarration(
    action: TurnAction,
    checkResult: { success: boolean; roll: number; difficulty: number },
    world: World
  ): Promise<string> {
    const systemPrompt = `你是一个小说叙述者。根据角色的行动和结果，生成一段生动的叙述。

【世界背景】
${world.name}：${world.background.slice(0, 200)}...

【行动结果】${checkResult.success ? '成功' : '失败'}

【写作要求】
1. 用小说的笔法描述这个场景，50-150字
2. 如果成功，描述角色如何达成目的，可以加入一些生动细节
3. 如果失败，描述遇到了什么阻碍或意外，但不要太严重
4. 文风要符合这个世界的氛围
5. 不要使用任何游戏术语（如"检定成功"、"掷骰"等）
6. 像写小说一样自然流畅`;

    const messages: AIMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `请描述：${action.proposedAction}` },
    ];
    
    const response = await this.chat(messages);
    return response.content;
  }
  
  // AI 生成 DM 场景描述建议
  async generateDMSuggestions(
    world: World,
    characters: Character[],
    recentEvents: string[],
    currentTurn: number
  ): Promise<{
    suggestions: {
      title: string;
      content: string;
      type: 'combat' | 'exploration' | 'social' | 'mystery' | 'rest';
    }[];
  }> {
    const charactersSummary = characters.map(c => 
      `${c.name}（${c.race} ${c.class}，${c.alignment}）`
    ).join('、');
    
    const recentEventsText = recentEvents.length > 0 
      ? recentEvents.join('\n') 
      : '冒险刚刚开始';

    const systemPrompt = `你是一个小说场景设计师。根据当前世界设定和剧情发展，生成3-4个可能的场景走向。

【世界观】
${world.name}
${world.background.slice(0, 400)}

地点：${world.locations.map(l => l.name).join('、') || '待探索'}
势力：${world.factions.map(f => f.name).join('、') || '暂无'}

【主要角色】
${charactersSummary}

【已发生的事】
${recentEventsText}

【写作风格要求】
1. 文风要完全符合这个世界的氛围和时代感
2. 像写小说开头一样，营造画面感和氛围
3. 不要使用任何游戏术语
4. 场景描述要自然流畅，引人入胜

【输出格式】
直接输出JSON：

{
  "suggestions": [
    {
      "title": "简短的场景标题",
      "content": "50-150字的场景描述，像小说段落一样有画面感，以省略号或悬念结尾...",
      "type": "场景类型"
    }
  ]
}

【type 类型】
- combat: 冲突/危机
- exploration: 发现/探索
- social: 相遇/对话
- mystery: 悬疑/谜团
- rest: 平静/过渡

生成3-4个不同类型的场景建议。`;

    const messages: AIMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: '请生成场景描述建议，直接输出JSON：' },
    ];
    
    logger.info(LogCategories.AI, '开始生成 DM 建议', { 
      worldName: world.name,
      charactersCount: characters.length,
      currentTurn,
    });
    
    const response = await this.chat(messages);
    
    const parsed = this.extractJSON(response.content);
    if (parsed && Array.isArray(parsed.suggestions)) {
      logger.info(LogCategories.AI, 'DM 建议生成成功', { 
        suggestionsCount: parsed.suggestions.length 
      });
      return {
        suggestions: parsed.suggestions.map((s: any) => ({
          title: s.title || '未命名场景',
          content: s.content || '',
          type: ['combat', 'exploration', 'social', 'mystery', 'rest'].includes(s.type) 
            ? s.type 
            : 'exploration',
        })),
      };
    }
    
    logger.warn(LogCategories.AI, 'DM 建议生成失败，返回默认建议');
    return {
      suggestions: [
        {
          title: '平静的旅途',
          content: '道路在脚下延伸，四周一片宁静。这是一个继续探索或休整的好时机...',
          type: 'rest',
        },
      ],
    };
  }
  
  // AI 生成角色
  async generateCharacter(
    prompt: string,
    world?: World
  ): Promise<{
    name: string;
    race: string;
    class: string;
    alignment: Alignment;
    level: number;
    backstory: string;
    attributes: CharacterAttributes;
    skills: CharacterSkills;
    background: CharacterBackground;
  }> {
    const worldContext = world ? `
当前世界设定：
- 世界名称：${world.name}
- 背景：${world.background}
- 主要势力：${world.factions.map(f => f.name).join('、') || '未知'}
- 重要地点：${world.locations.map(l => l.name).join('、') || '未知'}

请确保生成的角色与这个世界观相契合。` : '';

    const systemPrompt = `你是一个专业的跑团角色生成器。根据用户的描述，生成一个完整的D&D风格角色卡。
${worldContext}

【输出格式要求】
必须严格按照以下JSON格式输出，直接输出JSON，不要任何其他内容：

{
  "name": "艾莉娅·星语",
  "race": "精灵",
  "class": "法师",
  "alignment": "neutral-good",
  "level": 3,
  "backstory": "艾莉娅出生于银月森林的一个古老精灵家族...(100-300字的背景故事)",
  "attributes": {
    "strength": 8,
    "dexterity": 14,
    "constitution": 12,
    "intelligence": 17,
    "wisdom": 13,
    "charisma": 10
  },
  "skills": {
    "combat": {"近战攻击": -1, "远程攻击": 2, "防御": 0, "先攻": 2},
    "social": {"说服": 1, "欺骗": 0, "威吓": -1, "表演": 0},
    "exploration": {"察觉": 2, "潜行": 1, "调查": 3, "生存": 0},
    "knowledge": {"奥秘": 4, "历史": 2, "自然": 1, "宗教": 1}
  },
  "background": {
    "personality": "我对古老的魔法典籍有着近乎痴迷的热情，常常沉浸在研究中忘记时间。面对陌生人时会显得有些疏离，但对朋友则非常忠诚。",
    "ideal": "知识应该被分享，而不是被少数人垄断。我相信魔法可以让世界变得更美好。",
    "bond": "我的导师在一次实验中失踪，我发誓要找到他并解开那个实验的秘密。",
    "flaw": "我的好奇心常常让我陷入危险，明知是陷阱也忍不住想要一探究竟。"
  }
}

【字段说明】
- race: 人类、精灵、矮人、半身人、龙裔、侏儒、半精灵、半兽人、提夫林
- class: 战士、法师、游侠、盗贼、牧师、圣骑士、野蛮人、吟游诗人、德鲁伊、武僧、术士、邪术师
- alignment: lawful-good, neutral-good, chaotic-good, lawful-neutral, true-neutral, chaotic-neutral, lawful-evil, neutral-evil, chaotic-evil
- attributes: 每个值在3-18之间，符合职业特点分配
- skills: 每个值在-2到+5之间

【重要】
1. 直接输出JSON，不要任何前缀、后缀或解释
2. 角色要有鲜明个性和合理动机
3. 背景故事要有戏剧性冲突
4. 性格特质、理想、羁绊、缺陷要相互呼应`;

    const messages: AIMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt ? `请根据以下描述生成角色：\n${prompt}` : '请随机生成一个有趣的角色' },
    ];
    
    logger.info(LogCategories.AI, '开始 AI 生成角色', { 
      prompt: prompt || '随机生成',
      hasWorld: !!world,
    });
    
    const response = await this.chat(messages);
    
    const parsed = this.extractJSON(response.content);
    if (parsed && parsed.name) {
      logger.info(LogCategories.AI, 'AI 角色生成成功', {
        name: parsed.name,
        race: parsed.race,
        class: parsed.class,
      });
      // 验证并设置默认值
      return {
        name: parsed.name || '无名旅者',
        race: parsed.race || '人类',
        class: parsed.class || '战士',
        alignment: this.validateAlignment(parsed.alignment),
        level: Math.max(1, Math.min(20, parsed.level || 1)),
        backstory: parsed.backstory || '',
        attributes: this.validateAttributes(parsed.attributes),
        skills: this.validateSkills(parsed.skills),
        background: this.validateBackground(parsed.background),
      };
    }
    
    logger.warn(LogCategories.AI, 'AI 角色生成失败，返回默认角色');
    // 返回默认角色
    return this.getDefaultCharacter();
  }
  
  // AI 生成角色背景要素
  async generateCharacterBackground(
    characterInfo: {
      name: string;
      race: string;
      class: string;
      alignment: string;
      level: number;
      backstory: string;
    },
    world?: World
  ): Promise<CharacterBackground> {
    const worldContext = world ? `
当前世界：${world.name}
世界背景：${world.background.slice(0, 300)}...` : '';

    const systemPrompt = `你是一个专业的跑团角色背景生成器。根据角色的基础信息，生成符合角色特点的背景要素。
${worldContext}

角色信息：
- 姓名：${characterInfo.name}
- 种族：${characterInfo.race}
- 职业：${characterInfo.class}
- 阵营：${characterInfo.alignment}
- 等级：${characterInfo.level}
- 背景故事：${characterInfo.backstory || '暂无'}

【输出格式要求】
必须严格按照以下JSON格式输出，直接输出JSON，不要任何其他内容：

{
  "personality": "性格特质描述，50-100字。描述角色独特的性格特点、行为习惯、处事方式。要与职业和阵营相符。",
  "ideal": "理想信念，20-50字。角色追求的价值观或人生目标。",
  "bond": "羁绊联系，20-50字。角色与世界、他人或某事物的重要联系。",
  "flaw": "性格缺陷，20-50字。角色的弱点、坏习惯或致命缺点。"
}

【示例】
{
  "personality": "我习惯在战斗前仔细观察敌人，寻找弱点。平时沉默寡言，但一旦涉及正义之事就会变得滔滔不绝。我对弱者有着天生的同情心。",
  "ideal": "保护无辜者是我的使命，即使付出生命的代价也在所不惜。",
  "bond": "我的家乡被魔物毁灭，我发誓要找到并消灭那个罪魁祸首。",
  "flaw": "我无法坐视不公之事，即使明知是陷阱也会冲动行事。"
}

【要求】
1. 四个要素要相互呼应，形成完整人格
2. 要与角色的职业、种族、阵营特点相符
3. 背景故事中的元素可以体现在羁绊中
4. 缺陷要有戏剧性，能在冒险中制造冲突`;

    const messages: AIMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: '请为这个角色生成背景要素，直接输出JSON：' },
    ];
    
    logger.info(LogCategories.AI, '开始 AI 生成背景要素', { 
      characterName: characterInfo.name,
      characterClass: characterInfo.class,
    });
    
    const response = await this.chat(messages);
    
    const parsed = this.extractJSON(response.content);
    if (parsed && parsed.personality) {
      logger.info(LogCategories.AI, 'AI 背景要素生成成功');
      return {
        personality: parsed.personality || '',
        ideal: parsed.ideal || '',
        bond: parsed.bond || '',
        flaw: parsed.flaw || '',
      };
    }
    
    logger.warn(LogCategories.AI, 'AI 背景要素生成失败');
    return {
      personality: '',
      ideal: '',
      bond: '',
      flaw: '',
    };
  }
  
  // 辅助方法：验证阵营
  private validateAlignment(alignment: string): Alignment {
    const validAlignments: Alignment[] = [
      'lawful-good', 'neutral-good', 'chaotic-good',
      'lawful-neutral', 'true-neutral', 'chaotic-neutral',
      'lawful-evil', 'neutral-evil', 'chaotic-evil'
    ];
    return validAlignments.includes(alignment as Alignment) 
      ? alignment as Alignment 
      : 'true-neutral';
  }
  
  // 辅助方法：验证属性
  private validateAttributes(attrs: any): CharacterAttributes {
    const clamp = (val: number) => Math.max(3, Math.min(18, val || 10));
    return {
      strength: clamp(attrs?.strength),
      dexterity: clamp(attrs?.dexterity),
      constitution: clamp(attrs?.constitution),
      intelligence: clamp(attrs?.intelligence),
      wisdom: clamp(attrs?.wisdom),
      charisma: clamp(attrs?.charisma),
    };
  }
  
  // 辅助方法：验证技能
  private validateSkills(skills: any): CharacterSkills {
    const clampSkill = (val: number) => Math.max(-5, Math.min(10, val || 0));
    const validateCategory = (cat: any, defaults: Record<string, number>) => {
      const result: Record<string, number> = {};
      for (const key of Object.keys(defaults)) {
        result[key] = clampSkill(cat?.[key]);
      }
      return result;
    };
    
    return {
      combat: validateCategory(skills?.combat, { '近战攻击': 0, '远程攻击': 0, '防御': 0, '先攻': 0 }),
      social: validateCategory(skills?.social, { '说服': 0, '欺骗': 0, '威吓': 0, '表演': 0 }),
      exploration: validateCategory(skills?.exploration, { '察觉': 0, '潜行': 0, '调查': 0, '生存': 0 }),
      knowledge: validateCategory(skills?.knowledge, { '奥秘': 0, '历史': 0, '自然': 0, '宗教': 0 }),
    };
  }
  
  // 辅助方法：验证背景
  private validateBackground(bg: any): CharacterBackground {
    return {
      personality: bg?.personality || '',
      ideal: bg?.ideal || '',
      bond: bg?.bond || '',
      flaw: bg?.flaw || '',
    };
  }
  
  // 辅助方法：默认角色
  private getDefaultCharacter() {
    return {
      name: '无名旅者',
      race: '人类',
      class: '战士',
      alignment: 'true-neutral' as Alignment,
      level: 1,
      backstory: '',
      attributes: {
        strength: 10,
        dexterity: 10,
        constitution: 10,
        intelligence: 10,
        wisdom: 10,
        charisma: 10,
      },
      skills: {
        combat: { '近战攻击': 0, '远程攻击': 0, '防御': 0, '先攻': 0 },
        social: { '说服': 0, '欺骗': 0, '威吓': 0, '表演': 0 },
        exploration: { '察觉': 0, '潜行': 0, '调查': 0, '生存': 0 },
        knowledge: { '奥秘': 0, '历史': 0, '自然': 0, '宗教': 0 },
      },
      background: {
        personality: '',
        ideal: '',
        bond: '',
        flaw: '',
      },
    };
  }
}

export const aiService = new AIService();

