import dotenv from 'dotenv'
import { cleanEnv, port, str, testOnly, url } from 'envalid'
import { envalidJsonWebKeys as keys } from '#/lib/jwk'

dotenv.config()

export const env = cleanEnv(process.env, {
  NODE_ENV: str({
    devDefault: testOnly('test'),
    choices: ['development', 'production', 'test'],
  }),
  PORT: port({ devDefault: testOnly(3000) }),
  PUBLIC_URL: url({ default: undefined }),
  DB_PATH: str({ devDefault: ':memory:' }),
  COOKIE_SECRET: str({ devDefault: '00000000000000000000000000000000' }),
  PRIVATE_KEYS: keys({ default: undefined }),
  LOG_LEVEL: str({
    devDefault: 'debug',
    default: 'info',
    choices: ['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'],
  }),
  PDS_URL: url({ default: undefined }),
  PLC_URL: url({ default: undefined }),
  FIREHOSE_URL: url({ default: undefined }),
})
