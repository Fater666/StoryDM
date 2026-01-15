import { create } from 'zustand';
import type { Session, Turn, TurnAction, TurnCheck, TurnResult, DiceRoll, CheckType, TimelineEvent, AdventureLog } from '@/types';
import * as db from '@/services/db';

interface SessionState {
  sessions: Session[];
  currentSession: Session | null;
  isLoading: boolean;
  error: string | null;
  
  // 当前回合状态
  pendingActions: TurnAction[];
  pendingChecks: TurnCheck[];
  
  // Actions
  loadSessionsByWorld: (worldId: string) => Promise<void>;
  loadSession: (id: string) => Promise<void>;
  createSession: (data: {
    worldId: string;
    name: string;
    characters: string[];
  }) => Promise<string>;
  updateSession: (id: string, updates: Partial<Session>) => Promise<void>;
  deleteSession: (id: string) => Promise<void>;
  
  // 回合流程
  addPendingAction: (action: TurnAction) => void;
  clearPendingActions: () => void;
  addPendingCheck: (check: TurnCheck) => void;
  clearPendingChecks: () => void;
  completeTurn: (results: TurnResult[], worldState: string) => Promise<void>;
  
  // 时间线和日志
  addTimelineEvent: (event: Omit<TimelineEvent, 'id'>) => Promise<void>;
  addAdventureLog: (log: Omit<AdventureLog, 'id'>) => Promise<void>;
  
  clearError: () => void;
}

export const useSessionStore = create<SessionState>((set, get) => ({
  sessions: [],
  currentSession: null,
  isLoading: false,
  error: null,
  pendingActions: [],
  pendingChecks: [],
  
  loadSessionsByWorld: async (worldId: string) => {
    set({ isLoading: true, error: null });
    try {
      const sessions = await db.getSessionsByWorld(worldId);
      set({ sessions, isLoading: false });
    } catch (err) {
      set({ error: '加载会话列表失败', isLoading: false });
    }
  },
  
  loadSession: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const session = await db.getSession(id);
      if (session) {
        set({ currentSession: session, isLoading: false });
      } else {
        set({ error: '会话不存在', isLoading: false });
      }
    } catch (err) {
      set({ error: '加载会话失败', isLoading: false });
    }
  },
  
  createSession: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const id = await db.createSession({
        ...data,
        turns: [],
        currentTurn: 0,
        timeline: [],
        adventureLogs: [],
        status: 'active',
      });
      await get().loadSessionsByWorld(data.worldId);
      set({ isLoading: false });
      return id;
    } catch (err) {
      set({ error: '创建会话失败', isLoading: false });
      throw err;
    }
  },
  
  updateSession: async (id, updates) => {
    set({ isLoading: true, error: null });
    try {
      await db.updateSession(id, updates);
      const { currentSession } = get();
      if (currentSession?.id === id) {
        set({ currentSession: { ...currentSession, ...updates } as Session });
      }
      set({ isLoading: false });
    } catch (err) {
      set({ error: '更新会话失败', isLoading: false });
    }
  },
  
  deleteSession: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const { sessions, currentSession } = get();
      const worldId = sessions.find(s => s.id === id)?.worldId;
      
      await db.deleteSession(id);
      
      if (currentSession?.id === id) {
        set({ currentSession: null });
      }
      
      if (worldId) {
        await get().loadSessionsByWorld(worldId);
      }
      
      set({ isLoading: false });
    } catch (err) {
      set({ error: '删除会话失败', isLoading: false });
    }
  },
  
  // 回合流程
  addPendingAction: (action) => {
    set((state) => ({
      pendingActions: [...state.pendingActions, action],
    }));
  },
  
  clearPendingActions: () => set({ pendingActions: [] }),
  
  addPendingCheck: (check) => {
    set((state) => ({
      pendingChecks: [...state.pendingChecks, check],
    }));
  },
  
  clearPendingChecks: () => set({ pendingChecks: [] }),
  
  completeTurn: async (results, worldState) => {
    const { currentSession, pendingActions, pendingChecks } = get();
    if (!currentSession) return;
    
    const newTurn: Turn = {
      id: crypto.randomUUID(),
      sessionId: currentSession.id,
      turnNumber: currentSession.currentTurn + 1,
      actions: [...pendingActions],
      checks: [...pendingChecks],
      results,
      worldState,
      timestamp: new Date(),
    };
    
    const updatedTurns = [...currentSession.turns, newTurn];
    
    await db.updateSession(currentSession.id, {
      turns: updatedTurns,
      currentTurn: newTurn.turnNumber,
    });
    
    set({
      currentSession: {
        ...currentSession,
        turns: updatedTurns,
        currentTurn: newTurn.turnNumber,
      },
      pendingActions: [],
      pendingChecks: [],
    });
  },
  
  addTimelineEvent: async (event) => {
    const { currentSession } = get();
    if (!currentSession) return;
    
    const newEvent: TimelineEvent = {
      ...event,
      id: crypto.randomUUID(),
    };
    
    const updatedTimeline = [...currentSession.timeline, newEvent];
    
    await db.updateSession(currentSession.id, {
      timeline: updatedTimeline,
    });
    
    set({
      currentSession: {
        ...currentSession,
        timeline: updatedTimeline,
      },
    });
  },
  
  addAdventureLog: async (log) => {
    const { currentSession } = get();
    if (!currentSession) return;
    
    const newLog: AdventureLog = {
      ...log,
      id: crypto.randomUUID(),
    };
    
    const updatedLogs = [...currentSession.adventureLogs, newLog];
    
    await db.updateSession(currentSession.id, {
      adventureLogs: updatedLogs,
    });
    
    set({
      currentSession: {
        ...currentSession,
        adventureLogs: updatedLogs,
      },
    });
  },
  
  clearError: () => set({ error: null }),
}));

