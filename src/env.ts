import dotenv from 'dotenv'
import { cleanEnv, port, str, testOnly } from 'envalid'
import { envalidJsonWebKeys } from '#/lib/jwk'

dotenv.config()

export const env = cleanEnv(process.env, {
  NODE_ENV: str({
    devDefault: testOnly('test'),
    choices: ['development', 'production', 'test'],
  }),
  PORT: port({ devDefault: testOnly(3000) }),
  PUBLIC_URL: str({}),
  DB_PATH: str({ devDefault: ':memory:' }),
  COOKIE_SECRET: str({ devDefault: '00000000000000000000000000000000' }),
  PRIVATE_KEYS: envalidJsonWebKeys({ default: undefined }),
  LOG_LEVEL: str({ default: 'info' }),
  PDS_OWNER: str({ default: 'Bluesky' }),
  PDS_URL: str({ default: 'https://bsky.social' }),
  PLC_URL: str({ default: 'https://plc.directory' }),
  FIREHOSE_URL: str({ default: 'wss://bsky.network' }),
})
