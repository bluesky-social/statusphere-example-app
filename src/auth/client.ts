import { JoseKey } from '@atproto/jwk-jose'
import { NodeOAuthClient } from '@atproto/oauth-client-node'
import type { Database } from '#/db'
import { env } from '#/env'
import { SessionStore, StateStore } from './storage'

export const createClient = async (db: Database) => {
  const url = env.PUBLIC_URL
  const privateKeyPKCS8 = Buffer.from(env.PRIVATE_KEY_ES256_B64, 'base64').toString()
  const privateKey = await JoseKey.fromImportable(privateKeyPKCS8, 'key1')
  return new NodeOAuthClient({
    // This object will be used to build the payload of the /client-metadata.json
    // endpoint metadata, exposing the client metadata to the OAuth server.
    clientMetadata: {
      // Must be a URL that will be exposing this metadata
      client_id: `${url}/client-metadata.json`,
      client_uri: url,
      client_name: 'ATProto Express App',
      jwks_uri: `${url}/jwks.json`,
      logo_uri: `${url}/logo.png`,
      tos_uri: `${url}/tos`,
      policy_uri: `${url}/policy`,
      redirect_uris: [`${url}/oauth/callback`],
      token_endpoint_auth_signing_alg: 'ES256',
      scope: 'profile email offline_access',
      grant_types: ['authorization_code', 'refresh_token'],
      response_types: ['code'],
      application_type: 'web',
      token_endpoint_auth_method: 'private_key_jwt',
      dpop_bound_access_tokens: true,
    },

    // Used to authenticate the client to the token endpoint. Will be used to
    // build the jwks object to be exposed on the "jwks_uri" endpoint.
    keyset: [privateKey],

    // Interface to store authorization state data (during authorization flows)
    stateStore: new StateStore(db),

    // Interface to store authenticated session data
    sessionStore: new SessionStore(db),
  })
}
