import {
  Kysely,
} from 'kysely'

// Types

export type DatabaseSchema = {
  status: Status
  auth_session: AuthSession
  auth_state: AuthState
}

export type Status = {
  uri: string
  authorDid: string
  status: string
  createdAt: string
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

export type Database = Kysely<DatabaseSchema>
