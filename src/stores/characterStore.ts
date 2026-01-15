import { create } from 'zustand';
import type { Character, CharacterAttributes, CharacterSkills, CharacterBackground, Alignment } from '@/types';
import * as db from '@/services/db';

interface CharacterState {
  characters: Character[];
  currentCharacter: Character | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  loadCharactersByWorld: (worldId: string) => Promise<void>;
  loadCharacter: (id: string) => Promise<void>;
  createCharacter: (data: {
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
  }) => Promise<string>;
  updateCharacter: (id: string, updates: Partial<Character>) => Promise<void>;
  deleteCharacter: (id: string) => Promise<void>;
  addMemory: (characterId: string, content: string, importance: number) => Promise<void>;
  clearError: () => void;
}

export const useCharacterStore = create<CharacterState>((set, get) => ({
  characters: [],
  currentCharacter: null,
  isLoading: false,
  error: null,
  
  loadCharactersByWorld: async (worldId: string) => {
    set({ isLoading: true, error: null });
    try {
      const characters = await db.getCharactersByWorld(worldId);
      set({ characters, isLoading: false });
    } catch (err) {
      set({ error: '加载角色列表失败', isLoading: false });
    }
  },
  
  loadCharacter: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const character = await db.getCharacter(id);
      if (character) {
        set({ currentCharacter: character, isLoading: false });
      } else {
        set({ error: '角色不存在', isLoading: false });
      }
    } catch (err) {
      set({ error: '加载角色失败', isLoading: false });
    }
  },
  
  createCharacter: async (data) => {
    set({ isLoading: true, error: null });
    try {
      // 计算初始HP (简化版: 体质修正 + 职业基础)
      const conMod = Math.floor((data.attributes.constitution - 10) / 2);
      const baseHP = 10 + conMod + data.level;
      
      const id = await db.createCharacter({
        ...data,
        memories: [],
        currentHP: baseHP,
        maxHP: baseHP,
        status: 'active',
      });
      await get().loadCharactersByWorld(data.worldId);
      set({ isLoading: false });
      return id;
    } catch (err) {
      set({ error: '创建角色失败', isLoading: false });
      throw err;
    }
  },
  
  updateCharacter: async (id, updates) => {
    set({ isLoading: true, error: null });
    try {
      await db.updateCharacter(id, updates);
      const { currentCharacter, characters } = get();
      
      if (currentCharacter?.id === id) {
        set({ currentCharacter: { ...currentCharacter, ...updates } as Character });
      }
      
      // 更新列表中的角色
      const worldId = characters.find(c => c.id === id)?.worldId;
      if (worldId) {
        await get().loadCharactersByWorld(worldId);
      }
      
      set({ isLoading: false });
    } catch (err) {
      set({ error: '更新角色失败', isLoading: false });
    }
  },
  
  deleteCharacter: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const { characters, currentCharacter } = get();
      const worldId = characters.find(c => c.id === id)?.worldId;
      
      await db.deleteCharacter(id);
      
      if (currentCharacter?.id === id) {
        set({ currentCharacter: null });
      }
      
      if (worldId) {
        await get().loadCharactersByWorld(worldId);
      }
      
      set({ isLoading: false });
    } catch (err) {
      set({ error: '删除角色失败', isLoading: false });
    }
  },
  
  addMemory: async (characterId, content, importance) => {
    try {
      const character = await db.getCharacter(characterId);
      if (!character) return;
      
      const newMemory = {
        id: crypto.randomUUID(),
        content,
        importance,
        timestamp: new Date(),
      };
      
      await db.updateCharacter(characterId, {
        memories: [...character.memories, newMemory],
      });
      
      const { currentCharacter } = get();
      if (currentCharacter?.id === characterId) {
        set({
          currentCharacter: {
            ...currentCharacter,
            memories: [...currentCharacter.memories, newMemory],
          },
        });
      }
    } catch (err) {
      set({ error: '添加记忆失败' });
    }
  },
  
  clearError: () => set({ error: null }),
}));

