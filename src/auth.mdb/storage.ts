import type {
  NodeSavedSession,
  NodeSavedSessionStore,
  NodeSavedState,
  NodeSavedStateStore,
} from '@atproto/oauth-client-node'
import type { Database } from '#/db'
import { MongoClient } from 'mongodb'
import { GetOptions, Awaitable } from '@atproto-labs/simple-store'

export class StateStore implements NodeSavedStateStore {
  private db
  private collection

  constructor(private dbm: MongoClient) {
    this.db = this.dbm.db('statusphere')
    this.collection = this.db.collection('auth_state')
  }
  async get(key: string): Promise<NodeSavedState | undefined> {
    const result = await this.collection.findOne({ key })
    if (!result) return
    return JSON.parse(result.state) as NodeSavedState
  }
  
  async set(key: string, val: NodeSavedState) {
    const state = JSON.stringify(val)
    await this.collection.insertOne({key: key, state: val})
  }
  
  async del(key: string) {
    await this.collection.deleteOne({ key: key})
  }
}

export class SessionStore implements NodeSavedSessionStore {
  constructor( private dbm: MongoClient) {}
  async get(key: string): Promise<NodeSavedSession | undefined> {
    const result = await this.db.selectFrom('auth_session').selectAll().where('key', '=', key).executeTakeFirst()
    if (!result) return
    return JSON.parse(result.session) as NodeSavedSession
  }
  async set(key: string, val: NodeSavedSession) {
    const session = JSON.stringify(val)
    await this.db
      .insertInto('auth_session')
      .values({ key, session })
      .onConflict((oc) => oc.doUpdateSet({ session }))
      .execute()
  }
  async del(key: string) {
    await this.db.deleteFrom('auth_session').where('key', '=', key).execute()
  }
}
