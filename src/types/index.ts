// ==================== 世界系统类型 ====================

export type WorldSourceType = 'manual' | 'novel' | 'url';

export interface WorldLocation {
  id: string;
  name: string;
  description: string;
  parentId?: string;
  tags: string[];
}

export interface WorldFaction {
  id: string;
  name: string;
  description: string;
  influence: number; // 1-10
  relations: { factionId: string; type: 'ally' | 'neutral' | 'enemy' }[];
}

export interface WorldEvent {
  id: string;
  name: string;
  description: string;
  era: string;
  impact: string;
}

export interface WorldConflict {
  id: string;
  name: string;
  description: string;
  factions: string[];
  status: 'dormant' | 'brewing' | 'active' | 'resolved';
}

export interface World {
  id: string;
  name: string;
  sourceType: WorldSourceType;
  sourceContent?: string;
  background: string;
  locations: WorldLocation[];
  factions: WorldFaction[];
  history: WorldEvent[];
  conflicts: WorldConflict[];
  createdAt: Date;
  updatedAt: Date;
}

// ==================== 角色系统类型 ====================

export type Alignment = 
  | 'lawful-good' | 'neutral-good' | 'chaotic-good'
  | 'lawful-neutral' | 'true-neutral' | 'chaotic-neutral'
  | 'lawful-evil' | 'neutral-evil' | 'chaotic-evil';

export interface CharacterAttributes {
  strength: number;      // STR 力量
  dexterity: number;     // DEX 敏捷
  constitution: number;  // CON 体质
  intelligence: number;  // INT 智力
  wisdom: number;        // WIS 感知
  charisma: number;      // CHA 魅力
}

export interface CharacterSkills {
  combat: Record<string, number>;    // 战斗技能
  social: Record<string, number>;    // 社交技能
  exploration: Record<string, number>; // 探索技能
  knowledge: Record<string, number>; // 学识技能
}

export interface CharacterBackground {
  personality: string;   // 性格特质
  ideal: string;         // 理想
  bond: string;          // 羁绊
  flaw: string;          // 缺陷
}

export interface CharacterMemory {
  id: string;
  content: string;
  importance: number; // 1-10
  timestamp: Date;
  relatedCharacters?: string[];
  relatedLocations?: string[];
}

export interface Character {
  id: string;
  worldId: string;
  name: string;
  race: string;
  class: string;
  alignment: Alignment;
  level: number;
  backstory: string;
  attributes: CharacterAttributes;
  skills: CharacterSkills;
  background: CharacterBackground;
  memories: CharacterMemory[];
  currentHP: number;
  maxHP: number;
  status: 'active' | 'incapacitated' | 'dead';
  createdAt: Date;
}

// ==================== 主线系统类型 ====================

export interface MainQuestStage {
  id: string;
  order: number;
  objective: string;
  hints: string[];
  completed: boolean;
}

export interface MainQuest {
  id: string;
  worldId: string;
  title: string;
  description: string;
  stages: MainQuestStage[];
  potentialEvents: string[];
  worldDirection: string;
}

// ==================== 回合系统类型 ====================

export type DiceType = 'd4' | 'd6' | 'd8' | 'd10' | 'd12' | 'd20' | 'd100';

export type CheckType = 
  | 'strength' | 'dexterity' | 'constitution' | 'intelligence' | 'wisdom' | 'charisma'
  | 'attack' | 'save' | 'skill';

export interface DiceRoll {
  type: DiceType;
  count: number;
  modifier: number;
  results: number[];
  total: number;
}

export interface TurnAction {
  id: string;
  characterId: string;
  characterName: string;
  proposedAction: string;
  aiReasoning: string;
}

export interface TurnCheck {
  id: string;
  actionId: string;
  checkType: CheckType;
  skillName?: string;
  difficulty: number;
  diceRoll: DiceRoll;
}

export interface TurnResult {
  id: string;
  checkId: string;
  success: boolean;
  dmNarration: string;
  worldChanges: string[];
}

export interface Turn {
  id: string;
  sessionId: string;
  turnNumber: number;
  actions: TurnAction[];
  checks: TurnCheck[];
  results: TurnResult[];
  worldState: string;
  timestamp: Date;
}

// ==================== 会话系统类型 ====================

export interface Session {
  id: string;
  worldId: string;
  name: string;
  characters: string[]; // character IDs
  turns: Turn[];
  currentTurn: number;
  timeline: TimelineEvent[];
  adventureLogs: AdventureLog[];
  status: 'active' | 'paused' | 'completed';
  createdAt: Date;
  updatedAt: Date;
}

export interface TimelineEvent {
  id: string;
  timestamp: Date;
  turnNumber: number;
  event: string;
  significance: 'minor' | 'moderate' | 'major' | 'critical';
}

export interface AdventureLog {
  id: string;
  characterId: string;
  characterName: string;
  turnNumber: number;
  content: string;
  emotion: string;
}

// ==================== AI 服务类型 ====================

export interface AIConfig {
  modelUrl: string;
  modelName: string;
  apiKey: string;
  embeddingUrl?: string;
}

export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AIResponse {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

// ==================== 应用状态类型 ====================

export type AppView = 
  | 'home' 
  | 'world-create' 
  | 'world-view'
  | 'character-create'
  | 'character-view'
  | 'session'
  | 'settings'
  | 'export';

export interface AppState {
  currentView: AppView;
  currentWorldId: string | null;
  currentSessionId: string | null;
  sidebarOpen: boolean;
  aiConfig: AIConfig;
}

