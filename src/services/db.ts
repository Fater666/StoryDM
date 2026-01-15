import Dexie, { type Table } from 'dexie';
import type { World, Character, Session, MainQuest, AIConfig } from '@/types';

// 数据库版本和结构定义
export class StoryForgeDB extends Dexie {
  worlds!: Table<World>;
  characters!: Table<Character>;
  sessions!: Table<Session>;
  mainQuests!: Table<MainQuest>;
  settings!: Table<{ key: string; value: AIConfig }>;

  constructor() {
    super('StoryForgeDB');
    
    this.version(1).stores({
      worlds: 'id, name, sourceType, createdAt',
      characters: 'id, worldId, name, race, class, status, createdAt',
      sessions: 'id, worldId, name, status, createdAt',
      mainQuests: 'id, worldId, title',
      settings: 'key',
    });
  }
}

export const db = new StoryForgeDB();

// ==================== 世界相关操作 ====================

export async function createWorld(world: Omit<World, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const id = crypto.randomUUID();
  const now = new Date();
  await db.worlds.add({
    ...world,
    id,
    createdAt: now,
    updatedAt: now,
  });
  return id;
}

export async function updateWorld(id: string, updates: Partial<World>): Promise<void> {
  await db.worlds.update(id, {
    ...updates,
    updatedAt: new Date(),
  });
}

export async function deleteWorld(id: string): Promise<void> {
  // 删除世界及其相关数据
  await db.transaction('rw', [db.worlds, db.characters, db.sessions, db.mainQuests], async () => {
    await db.characters.where('worldId').equals(id).delete();
    await db.sessions.where('worldId').equals(id).delete();
    await db.mainQuests.where('worldId').equals(id).delete();
    await db.worlds.delete(id);
  });
}

export async function getWorld(id: string): Promise<World | undefined> {
  return db.worlds.get(id);
}

export async function getAllWorlds(): Promise<World[]> {
  return db.worlds.orderBy('updatedAt').reverse().toArray();
}

// ==================== 角色相关操作 ====================

export async function createCharacter(character: Omit<Character, 'id' | 'createdAt'>): Promise<string> {
  const id = crypto.randomUUID();
  await db.characters.add({
    ...character,
    id,
    createdAt: new Date(),
  });
  return id;
}

export async function updateCharacter(id: string, updates: Partial<Character>): Promise<void> {
  await db.characters.update(id, updates);
}

export async function deleteCharacter(id: string): Promise<void> {
  await db.characters.delete(id);
}

export async function getCharacter(id: string): Promise<Character | undefined> {
  return db.characters.get(id);
}

export async function getCharactersByWorld(worldId: string): Promise<Character[]> {
  return db.characters.where('worldId').equals(worldId).toArray();
}

// ==================== 会话相关操作 ====================

export async function createSession(session: Omit<Session, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const id = crypto.randomUUID();
  const now = new Date();
  await db.sessions.add({
    ...session,
    id,
    createdAt: now,
    updatedAt: now,
  });
  return id;
}

export async function updateSession(id: string, updates: Partial<Session>): Promise<void> {
  await db.sessions.update(id, {
    ...updates,
    updatedAt: new Date(),
  });
}

export async function deleteSession(id: string): Promise<void> {
  await db.sessions.delete(id);
}

export async function getSession(id: string): Promise<Session | undefined> {
  return db.sessions.get(id);
}

export async function getSessionsByWorld(worldId: string): Promise<Session[]> {
  return db.sessions.where('worldId').equals(worldId).orderBy('updatedAt').reverse().toArray();
}

// ==================== 主线相关操作 ====================

export async function createMainQuest(quest: Omit<MainQuest, 'id'>): Promise<string> {
  const id = crypto.randomUUID();
  await db.mainQuests.add({
    ...quest,
    id,
  });
  return id;
}

export async function updateMainQuest(id: string, updates: Partial<MainQuest>): Promise<void> {
  await db.mainQuests.update(id, updates);
}

export async function getMainQuestByWorld(worldId: string): Promise<MainQuest | undefined> {
  return db.mainQuests.where('worldId').equals(worldId).first();
}

// ==================== 设置相关操作 ====================

export async function saveAIConfig(config: AIConfig): Promise<void> {
  await db.settings.put({ key: 'aiConfig', value: config });
}

export async function getAIConfig(): Promise<AIConfig | null> {
  const setting = await db.settings.get('aiConfig');
  return setting?.value ?? null;
}

