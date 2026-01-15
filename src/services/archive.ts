import { db } from './db';
import { logger, LogCategories } from './logger';
import type { World, Character, Session, MainQuest } from '@/types';

// 存档数据结构
export interface WorldArchive {
  version: string;
  exportedAt: string;
  world: World;
  characters: Character[];
  sessions: Session[];
  mainQuest?: MainQuest;
}

export interface CharacterArchive {
  version: string;
  exportedAt: string;
  character: Character;
  worldName?: string;
}

export interface FullArchive {
  version: string;
  exportedAt: string;
  worlds: World[];
  characters: Character[];
  sessions: Session[];
  mainQuests: MainQuest[];
}

const ARCHIVE_VERSION = '1.0.0';

class ArchiveService {
  // ==================== 导出功能 ====================
  
  // 导出单个世界（包含角色、会话、主线）
  async exportWorld(worldId: string): Promise<WorldArchive | null> {
    try {
      logger.info(LogCategories.ARCHIVE, `开始导出世界: ${worldId}`);
      
      const world = await db.worlds.get(worldId);
      if (!world) {
        logger.error(LogCategories.ARCHIVE, `世界不存在: ${worldId}`);
        return null;
      }
      
      const characters = await db.characters.where('worldId').equals(worldId).toArray();
      const sessions = await db.sessions.where('worldId').equals(worldId).toArray();
      const mainQuest = await db.mainQuests.where('worldId').equals(worldId).first();
      
      const archive: WorldArchive = {
        version: ARCHIVE_VERSION,
        exportedAt: new Date().toISOString(),
        world,
        characters,
        sessions,
        mainQuest,
      };
      
      logger.info(LogCategories.ARCHIVE, `世界导出成功`, {
        worldName: world.name,
        charactersCount: characters.length,
        sessionsCount: sessions.length,
      });
      
      return archive;
    } catch (error) {
      logger.error(LogCategories.ARCHIVE, `世界导出失败`, error);
      throw error;
    }
  }
  
  // 导出单个角色
  async exportCharacter(characterId: string): Promise<CharacterArchive | null> {
    try {
      logger.info(LogCategories.ARCHIVE, `开始导出角色: ${characterId}`);
      
      const character = await db.characters.get(characterId);
      if (!character) {
        logger.error(LogCategories.ARCHIVE, `角色不存在: ${characterId}`);
        return null;
      }
      
      const world = await db.worlds.get(character.worldId);
      
      const archive: CharacterArchive = {
        version: ARCHIVE_VERSION,
        exportedAt: new Date().toISOString(),
        character,
        worldName: world?.name,
      };
      
      logger.info(LogCategories.ARCHIVE, `角色导出成功`, {
        characterName: character.name,
        worldName: world?.name,
      });
      
      return archive;
    } catch (error) {
      logger.error(LogCategories.ARCHIVE, `角色导出失败`, error);
      throw error;
    }
  }
  
  // 导出全部数据
  async exportAll(): Promise<FullArchive> {
    try {
      logger.info(LogCategories.ARCHIVE, `开始导出全部数据`);
      
      const worlds = await db.worlds.toArray();
      const characters = await db.characters.toArray();
      const sessions = await db.sessions.toArray();
      const mainQuests = await db.mainQuests.toArray();
      
      const archive: FullArchive = {
        version: ARCHIVE_VERSION,
        exportedAt: new Date().toISOString(),
        worlds,
        characters,
        sessions,
        mainQuests,
      };
      
      logger.info(LogCategories.ARCHIVE, `全部数据导出成功`, {
        worldsCount: worlds.length,
        charactersCount: characters.length,
        sessionsCount: sessions.length,
      });
      
      return archive;
    } catch (error) {
      logger.error(LogCategories.ARCHIVE, `全部数据导出失败`, error);
      throw error;
    }
  }
  
  // ==================== 导入功能 ====================
  
  // 导入世界存档
  async importWorld(archive: WorldArchive, options?: { 
    overwrite?: boolean;
    newId?: boolean;
  }): Promise<{ worldId: string; imported: { characters: number; sessions: number } }> {
    try {
      logger.info(LogCategories.ARCHIVE, `开始导入世界存档`, { worldName: archive.world.name });
      
      const { overwrite = false, newId = true } = options || {};
      
      // 生成新ID或使用原ID
      const worldId = newId ? crypto.randomUUID() : archive.world.id;
      
      // 检查是否已存在
      if (!newId) {
        const existing = await db.worlds.get(worldId);
        if (existing && !overwrite) {
          throw new Error(`世界已存在: ${worldId}`);
        }
        if (existing && overwrite) {
          // 删除旧数据
          await db.characters.where('worldId').equals(worldId).delete();
          await db.sessions.where('worldId').equals(worldId).delete();
          await db.mainQuests.where('worldId').equals(worldId).delete();
          await db.worlds.delete(worldId);
        }
      }
      
      // 导入世界
      await db.worlds.add({
        ...archive.world,
        id: worldId,
        createdAt: new Date(archive.world.createdAt),
        updatedAt: new Date(),
      });
      
      // 导入角色
      let charactersImported = 0;
      for (const char of archive.characters) {
        await db.characters.add({
          ...char,
          id: newId ? crypto.randomUUID() : char.id,
          worldId,
          createdAt: new Date(char.createdAt),
        });
        charactersImported++;
      }
      
      // 导入会话
      let sessionsImported = 0;
      for (const session of archive.sessions) {
        await db.sessions.add({
          ...session,
          id: newId ? crypto.randomUUID() : session.id,
          worldId,
          createdAt: new Date(session.createdAt),
          updatedAt: new Date(),
        });
        sessionsImported++;
      }
      
      // 导入主线
      if (archive.mainQuest) {
        await db.mainQuests.add({
          ...archive.mainQuest,
          id: newId ? crypto.randomUUID() : archive.mainQuest.id,
          worldId,
        });
      }
      
      logger.info(LogCategories.ARCHIVE, `世界导入成功`, {
        worldId,
        worldName: archive.world.name,
        charactersImported,
        sessionsImported,
      });
      
      return {
        worldId,
        imported: {
          characters: charactersImported,
          sessions: sessionsImported,
        },
      };
    } catch (error) {
      logger.error(LogCategories.ARCHIVE, `世界导入失败`, error);
      throw error;
    }
  }
  
  // 导入角色存档到指定世界
  async importCharacter(archive: CharacterArchive, targetWorldId: string): Promise<string> {
    try {
      logger.info(LogCategories.ARCHIVE, `开始导入角色`, { 
        characterName: archive.character.name,
        targetWorldId,
      });
      
      // 检查目标世界是否存在
      const world = await db.worlds.get(targetWorldId);
      if (!world) {
        throw new Error(`目标世界不存在: ${targetWorldId}`);
      }
      
      const characterId = crypto.randomUUID();
      
      await db.characters.add({
        ...archive.character,
        id: characterId,
        worldId: targetWorldId,
        createdAt: new Date(),
      });
      
      logger.info(LogCategories.ARCHIVE, `角色导入成功`, {
        characterId,
        characterName: archive.character.name,
        worldName: world.name,
      });
      
      return characterId;
    } catch (error) {
      logger.error(LogCategories.ARCHIVE, `角色导入失败`, error);
      throw error;
    }
  }
  
  // 导入全部数据
  async importAll(archive: FullArchive, options?: {
    overwrite?: boolean;
  }): Promise<{
    worlds: number;
    characters: number;
    sessions: number;
    mainQuests: number;
  }> {
    try {
      logger.info(LogCategories.ARCHIVE, `开始导入全部数据`);
      
      const { overwrite = false } = options || {};
      
      if (overwrite) {
        // 清空所有数据
        await db.worlds.clear();
        await db.characters.clear();
        await db.sessions.clear();
        await db.mainQuests.clear();
        logger.warn(LogCategories.ARCHIVE, `已清空现有数据`);
      }
      
      // 创建ID映射（旧ID -> 新ID）
      const worldIdMap = new Map<string, string>();
      const characterIdMap = new Map<string, string>();
      
      // 导入世界
      for (const world of archive.worlds) {
        const newId = crypto.randomUUID();
        worldIdMap.set(world.id, newId);
        await db.worlds.add({
          ...world,
          id: newId,
          createdAt: new Date(world.createdAt),
          updatedAt: new Date(),
        });
      }
      
      // 导入角色（使用新的worldId）
      for (const char of archive.characters) {
        const newWorldId = worldIdMap.get(char.worldId);
        if (!newWorldId) continue;
        
        const newId = crypto.randomUUID();
        characterIdMap.set(char.id, newId);
        await db.characters.add({
          ...char,
          id: newId,
          worldId: newWorldId,
          createdAt: new Date(char.createdAt),
        });
      }
      
      // 导入会话（使用新的worldId和characterId）
      for (const session of archive.sessions) {
        const newWorldId = worldIdMap.get(session.worldId);
        if (!newWorldId) continue;
        
        await db.sessions.add({
          ...session,
          id: crypto.randomUUID(),
          worldId: newWorldId,
          characters: session.characters.map(cId => characterIdMap.get(cId) || cId),
          createdAt: new Date(session.createdAt),
          updatedAt: new Date(),
        });
      }
      
      // 导入主线
      for (const quest of archive.mainQuests) {
        const newWorldId = worldIdMap.get(quest.worldId);
        if (!newWorldId) continue;
        
        await db.mainQuests.add({
          ...quest,
          id: crypto.randomUUID(),
          worldId: newWorldId,
        });
      }
      
      const result = {
        worlds: archive.worlds.length,
        characters: archive.characters.length,
        sessions: archive.sessions.length,
        mainQuests: archive.mainQuests.length,
      };
      
      logger.info(LogCategories.ARCHIVE, `全部数据导入成功`, result);
      
      return result;
    } catch (error) {
      logger.error(LogCategories.ARCHIVE, `全部数据导入失败`, error);
      throw error;
    }
  }
  
  // ==================== 文件操作 ====================
  
  // 下载存档为JSON文件
  downloadAsFile(data: any, filename: string) {
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    logger.info(LogCategories.ARCHIVE, `文件下载完成`, { filename });
  }
  
  // 从文件读取存档
  async readFromFile(file: File): Promise<any> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target?.result as string);
          logger.info(LogCategories.ARCHIVE, `文件读取成功`, { filename: file.name });
          resolve(data);
        } catch (error) {
          logger.error(LogCategories.ARCHIVE, `文件解析失败`, error);
          reject(new Error('无效的存档文件'));
        }
      };
      reader.onerror = () => {
        logger.error(LogCategories.ARCHIVE, `文件读取失败`);
        reject(new Error('文件读取失败'));
      };
      reader.readAsText(file);
    });
  }
  
  // 验证存档格式
  validateArchive(data: any): { valid: boolean; type: 'world' | 'character' | 'full' | null; error?: string } {
    if (!data || typeof data !== 'object') {
      return { valid: false, type: null, error: '无效的数据格式' };
    }
    
    if (!data.version) {
      return { valid: false, type: null, error: '缺少版本信息' };
    }
    
    // 判断存档类型
    if (data.world && data.characters) {
      return { valid: true, type: 'world' };
    }
    
    if (data.character) {
      return { valid: true, type: 'character' };
    }
    
    if (data.worlds && data.characters && data.sessions) {
      return { valid: true, type: 'full' };
    }
    
    return { valid: false, type: null, error: '未知的存档格式' };
  }
}

// 单例导出
export const archiveService = new ArchiveService();
