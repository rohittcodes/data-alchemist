import { ParsedData } from '../data/parsers'
import fs from 'fs'
import path from 'path'

// Hybrid file-based store for development that persists across hot reloads
// In production, this would use Redis/Vercel KV
class FileKVStore {
  private uploadsDir = path.join(process.cwd(), 'uploads')

  constructor() {
    // Ensure uploads directory exists
    if (!fs.existsSync(this.uploadsDir)) {
      fs.mkdirSync(this.uploadsDir, { recursive: true })
    }
  }

  private getSessionPath(sessionId: string): string {
    return path.join(this.uploadsDir, `session_${sessionId}`)
  }

  private getSessionDataPath(sessionId: string): string {
    return path.join(this.getSessionPath(sessionId), 'session.json')
  }

  async get(key: string): Promise<any> {
    if (key.startsWith('session:')) {
      const sessionId = key.replace('session:', '')
      const sessionDataPath = this.getSessionDataPath(sessionId)
      
      try {
        if (fs.existsSync(sessionDataPath)) {
          const data = fs.readFileSync(sessionDataPath, 'utf8')
          return JSON.parse(data)
        }
      } catch (error) {
        console.error(`Error reading session ${sessionId}:`, error)
      }
    }
    return null
  }

  async set(key: string, value: any): Promise<void> {
    if (key.startsWith('session:')) {
      const sessionId = key.replace('session:', '')
      const sessionPath = this.getSessionPath(sessionId)
      const sessionDataPath = this.getSessionDataPath(sessionId)
      
      try {
        // Ensure session directory exists
        if (!fs.existsSync(sessionPath)) {
          fs.mkdirSync(sessionPath, { recursive: true })
        }
        
        // Write session data
        fs.writeFileSync(sessionDataPath, JSON.stringify(value, null, 2))
      } catch (error) {
        console.error(`Error writing session ${sessionId}:`, error)
        throw error
      }
    }
  }

  async delete(key: string): Promise<void> {
    if (key.startsWith('session:')) {
      const sessionId = key.replace('session:', '')
      const sessionPath = this.getSessionPath(sessionId)
      
      try {
        if (fs.existsSync(sessionPath)) {
          fs.rmSync(sessionPath, { recursive: true, force: true })
        }
      } catch (error) {
        console.error(`Error deleting session ${sessionId}:`, error)
      }
    }
  }

  async exists(key: string): Promise<boolean> {
    if (key.startsWith('session:')) {
      const sessionId = key.replace('session:', '')
      const sessionDataPath = this.getSessionDataPath(sessionId)
      return fs.existsSync(sessionDataPath)
    }
    return false
  }

  async keys(pattern?: string): Promise<string[]> {
    if (pattern === 'session:*') {
      try {
        const sessions = fs.readdirSync(this.uploadsDir)
          .filter(dir => dir.startsWith('session_'))
          .map(dir => dir.replace('session_', ''))
          .filter(sessionId => {
            const sessionDataPath = this.getSessionDataPath(sessionId)
            return fs.existsSync(sessionDataPath)
          })
          .map(sessionId => `session:${sessionId}`)
        
        return sessions
      } catch (error) {
        console.error('Error listing sessions:', error)
        return []
      }
    }
    
    return []
  }
}

// Singleton instance
const kvStore = new FileKVStore()

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
    console.log('SessionManager.getSession called for:', sessionId)
    const key = `session:${sessionId}`
    console.log('Looking for key:', key)
    const result = await kvStore.get(key)
    console.log('SessionManager.getSession result:', result ? 'found' : 'not found')
    if (!result) {
      // Debug: List all keys to see what's actually stored
      const allKeys = await kvStore.keys()
      console.log('All stored keys:', allKeys)
    }
    return result
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