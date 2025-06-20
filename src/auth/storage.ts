import type {
  NodeSavedSession,
  NodeSavedSessionStore,
  NodeSavedState,
  NodeSavedStateStore,
} from '@atproto/oauth-client-node'
import type { Database } from '#/db'

export class StateStore implements NodeSavedStateStore {
  constructor(private db: Database) {}
  async get(key: string): Promise<NodeSavedState | undefined> {
    const result = await this.db.selectFrom('auth_state').selectAll().where('key', '=', key).executeTakeFirst()
    if (!result) return
    return JSON.parse(result.state) as NodeSavedState
  }
  async set(key: string, val: NodeSavedState) {
    const state = JSON.stringify(val)
    await this.db
      .insertInto('auth_state')
      .values({ key, state })
      .onConflict((oc) => oc.doUpdateSet({ state }))
      .execute()
  }
  async del(key: string) {
    await this.db.deleteFrom('auth_state').where('key', '=', key).execute()
  }
}

export class SessionStore implements NodeSavedSessionStore {
  constructor(private db: Database) {}
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
