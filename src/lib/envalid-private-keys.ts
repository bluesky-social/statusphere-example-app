import { Jwk, jwkValidator } from '@atproto/oauth-client-node'
import { makeValidator } from 'envalid'
import { z } from 'zod'

export type PrivateKey = Jwk & { kid: string }

const privateKeySchema = z.intersection(
  jwkValidator,
  z.object({ kid: z.string().nonempty() }),
) satisfies z.ZodType<PrivateKey>

const privateKeysSchema = z.array(privateKeySchema).nonempty()

export const privateKeys = makeValidator((input) => {
  const value = JSON.parse(input)
  return privateKeysSchema.parse(value)
})
