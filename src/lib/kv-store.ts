import { ParsedData } from './parsers'

// Simple in-memory store for development
// In production, this would use Redis/Vercel KV
class MemoryKVStore {
  private store = new Map<string, any>()

  async get(key: string): Promise<any> {
    return this.store.get(key)
  }

  async set(key: string, value: any): Promise<void> {
    this.store.set(key, value)
  }

  async delete(key: string): Promise<void> {
    this.store.delete(key)
  }

  async exists(key: string): Promise<boolean> {
    return this.store.has(key)
  }

  async keys(pattern?: string): Promise<string[]> {
    const allKeys = Array.from(this.store.keys())
    if (!pattern) return allKeys
    
    // Simple pattern matching for session keys
    if (pattern === 'session:*') {
      return allKeys.filter(key => key.startsWith('session:'))
    }
    
    return allKeys
  }
}

// Singleton instance
const kvStore = new MemoryKVStore()

export interface SessionData {
  sessionId: string
  clients?: ParsedData
  workers?: ParsedData
  tasks?: ParsedData
  created: number
  lastModified: number
  status: 'uploaded' | 'processing' | 'completed' | 'error'
}

export class SessionManager {
  static async createSession(sessionId: string): Promise<SessionData> {
    console.log('SessionManager.createSession called with:', sessionId)
    const sessionData: SessionData = {
      sessionId,
      created: Date.now(),
      lastModified: Date.now(),
      status: 'uploaded'
    }
    
    console.log('SessionManager.createSession storing:', sessionData)
    await kvStore.set(`session:${sessionId}`, sessionData)
    console.log('SessionManager.createSession stored successfully')
    return sessionData
  }

  static async getSession(sessionId: string): Promise<SessionData | null> {
    return await kvStore.get(`session:${sessionId}`)
  }

  static async updateSession(sessionId: string, updates: Partial<SessionData>): Promise<SessionData | null> {
    console.log(`SessionManager.updateSession called for session ${sessionId}`)
    const existing = await kvStore.get(`session:${sessionId}`)
    if (!existing) {
      console.error(`SessionManager.updateSession: Session ${sessionId} not found`)
      return null
    }

    console.log('SessionManager.updateSession existing session:', existing)
    const updated = {
      ...existing,
      ...updates,
      lastModified: Date.now()
    }

    console.log('SessionManager.updateSession new data:', updated)
    await kvStore.set(`session:${sessionId}`, updated)
    console.log('SessionManager.updateSession stored successfully')
    return updated
  }

  static async deleteSession(sessionId: string): Promise<void> {
    await kvStore.delete(`session:${sessionId}`)
  }

  static async listSessions(): Promise<string[]> {
    return await kvStore.keys('session:*')
  }

  static async addParsedData(
    sessionId: string, 
    type: 'clients' | 'workers' | 'tasks', 
    data: ParsedData
  ): Promise<SessionData | null> {
    console.log(`SessionManager.addParsedData called for ${type} with session ${sessionId}`)
    const updates: Partial<SessionData> = {}
    updates[type] = data
    
    console.log('SessionManager.addParsedData updates:', updates)
    const result = await this.updateSession(sessionId, updates)
    console.log('SessionManager.addParsedData result:', result ? 'success' : 'failed')
    return result
  }
}

export default kvStore