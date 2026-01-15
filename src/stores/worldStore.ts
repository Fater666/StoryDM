import { create } from 'zustand';
import type { World, WorldSourceType } from '@/types';
import * as db from '@/services/db';

interface WorldState {
  worlds: World[];
  currentWorld: World | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  loadWorlds: () => Promise<void>;
  loadWorld: (id: string) => Promise<void>;
  createWorld: (data: {
    name: string;
    sourceType: WorldSourceType;
    sourceContent?: string;
    background: string;
  }) => Promise<string>;
  updateWorld: (id: string, updates: Partial<World>) => Promise<void>;
  deleteWorld: (id: string) => Promise<void>;
  clearError: () => void;
}

export const useWorldStore = create<WorldState>((set, get) => ({
  worlds: [],
  currentWorld: null,
  isLoading: false,
  error: null,
  
  loadWorlds: async () => {
    set({ isLoading: true, error: null });
    try {
      const worlds = await db.getAllWorlds();
      set({ worlds, isLoading: false });
    } catch (err) {
      set({ error: '加载世界列表失败', isLoading: false });
    }
  },
  
  loadWorld: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const world = await db.getWorld(id);
      if (world) {
        set({ currentWorld: world, isLoading: false });
      } else {
        set({ error: '世界不存在', isLoading: false });
      }
    } catch (err) {
      set({ error: '加载世界失败', isLoading: false });
    }
  },
  
  createWorld: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const id = await db.createWorld({
        name: data.name,
        sourceType: data.sourceType,
        sourceContent: data.sourceContent,
        background: data.background,
        locations: [],
        factions: [],
        history: [],
        conflicts: [],
      });
      await get().loadWorlds();
      set({ isLoading: false });
      return id;
    } catch (err) {
      set({ error: '创建世界失败', isLoading: false });
      throw err;
    }
  },
  
  updateWorld: async (id, updates) => {
    set({ isLoading: true, error: null });
    try {
      await db.updateWorld(id, updates);
      const { currentWorld } = get();
      if (currentWorld?.id === id) {
        set({ currentWorld: { ...currentWorld, ...updates } as World });
      }
      await get().loadWorlds();
      set({ isLoading: false });
    } catch (err) {
      set({ error: '更新世界失败', isLoading: false });
    }
  },
  
  deleteWorld: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await db.deleteWorld(id);
      const { currentWorld } = get();
      if (currentWorld?.id === id) {
        set({ currentWorld: null });
      }
      await get().loadWorlds();
      set({ isLoading: false });
    } catch (err) {
      set({ error: '删除世界失败', isLoading: false });
    }
  },
  
  clearError: () => set({ error: null }),
}));

