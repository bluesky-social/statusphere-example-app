import { JoseKey } from '@atproto/jwk-jose'
import { NodeOAuthClient } from '@atproto/oauth-client-node'
import type { Database } from '#/db'
import { env } from '#/env'
import { SessionStore, StateStore } from './storage'

export const createClient = async (db: Database) => {
  const publicUrl = env.PUBLIC_URL
  const url = publicUrl || `http://127.0.0.1:${env.PORT}`
  return new NodeOAuthClient({
    clientMetadata: {
      client_name: 'AT Protocol Express App',
      client_id: publicUrl
        ? `${url}/client-metadata.json`
        : `http://localhost?redirect_uri=${encodeURIComponent(`${url}/oauth/callback`)}`,
      client_uri: url,
      logo_uri: `${url}/logo.png`,
      tos_uri: `${url}/tos`,
      policy_uri: `${url}/policy`,
      redirect_uris: [`${url}/oauth/callback`],
      scope: 'profile offline_access',
      grant_types: ['authorization_code', 'refresh_token'],
      response_types: ['code'],
      application_type: 'web',
      token_endpoint_auth_method: 'none',
      dpop_bound_access_tokens: true,
    },
    stateStore: new StateStore(db),
    sessionStore: new SessionStore(db),
  })
}
