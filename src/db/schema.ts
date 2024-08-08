export type DatabaseSchema = {
  post: Post
  auth_session: AuthSession
  auth_state: AuthState
}

export type Post = {
  uri: string
  text: string
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
