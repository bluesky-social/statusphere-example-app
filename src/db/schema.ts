export type DatabaseSchema = {
  did_cache: DidCache
  status: Status
  auth_session: AuthSession
  auth_state: AuthState
}

export type DidCache = {
  did: string
  doc: string
  updatedAt: string
}

export type Status = {
  authorDid: string
  status: string
  updatedAt: string
  indexedAt: string
}

export type AuthSession = {
  key: string
  session: AuthSessionJson
}

export type AuthState = {
  key: string
  state: AuthStateJson
}

type AuthStateJson = string

type AuthSessionJson = string
