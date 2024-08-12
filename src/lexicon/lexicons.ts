/**
 * GENERATED CODE - DO NOT MODIFY
 */
import { LexiconDoc, Lexicons } from '@atproto/lexicon'

export const schemaDict = {
  ComExampleStatus: {
    lexicon: 1,
    id: 'com.example.status',
    defs: {
      main: {
        type: 'record',
        key: 'literal:self',
        record: {
          type: 'object',
          required: ['status', 'updatedAt'],
          properties: {
            status: {
              type: 'string',
              minLength: 1,
              maxGraphemes: 1,
              maxLength: 10,
            },
            updatedAt: {
              type: 'string',
              format: 'datetime',
            },
          },
        },
      },
    },
  },
}
export const schemas: LexiconDoc[] = Object.values(schemaDict) as LexiconDoc[]
export const lexicons: Lexicons = new Lexicons(schemas)
export const ids = { ComExampleStatus: 'com.example.status' }
