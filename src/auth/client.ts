import assert from 'node:assert'
import { Keyset } from '@atproto/jwk'
import { JoseKey } from '@atproto/jwk-jose'
import {
  AppViewHandleResolver,
  atprotoLoopbackClientMetadata,
  DidResolverCommon,
  NodeOAuthClient,
  OAuthClientMetadataInput,
} from '@atproto/oauth-client-node'

import type { Database } from '#/db'
import { env } from '#/env'
import { SessionStore, StateStore } from './storage'

export async function createOAuthClient(db: Database) {
  assert(
    !env.PUBLIC_URL || env.PRIVATE_JWKS,
    'ATProto requires backend clients to be confidential',
  )

  // Confidential client require a keyset accessible on the internet. Non
  // internet clients (e.g. development) cannot expose a keyset on the internet
  // so they can't be private..
  const keyset =
    env.PUBLIC_URL && env.PRIVATE_JWKS
      ? new Keyset(
          await Promise.all(
            env.PRIVATE_JWKS.map((jwk) => JoseKey.fromJWK(jwk)),
          ),
        )
      : undefined

  // If a keyset is defined (meaning the client is confidential). Let's make
  // sure it has a private key for signing. Note: findPrivateKey will throw if
  // the keyset does no contain a suitable private key.
  const pk = keyset?.findPrivateKey({ use: 'sig' })

  const clientMetadata: OAuthClientMetadataInput = env.PUBLIC_URL
    ? {
        client_name: 'Statusphere Example App',
        client_id: `${env.PUBLIC_URL}/oauth-client-metadata.json`,
        jwks_uri: `${env.PUBLIC_URL}/.well-known/jwks.json`,
        redirect_uris: [`${env.PUBLIC_URL}/oauth/callback`],
        scope: 'atproto transition:generic',
        grant_types: ['authorization_code', 'refresh_token'],
        response_types: ['code'],
        application_type: 'web',
        token_endpoint_auth_method: pk ? 'private_key_jwt' : 'none',
        token_endpoint_auth_signing_alg: pk ? pk[1] : undefined,
        dpop_bound_access_tokens: true,
      }
    : atprotoLoopbackClientMetadata(
        `http://localhost?${new URLSearchParams([
          ['redirect_uri', `http://127.0.0.1:${env.PORT}/oauth/callback`],
          ['scope', `atproto transition:generic`],
        ])}`,
      )

  return new NodeOAuthClient({
    keyset,
    clientMetadata,
    stateStore: new StateStore(db),
    sessionStore: new SessionStore(db),
  })
}
