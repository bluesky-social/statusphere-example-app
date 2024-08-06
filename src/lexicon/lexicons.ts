/**
 * GENERATED CODE - DO NOT MODIFY
 */
import { LexiconDoc, Lexicons } from '@atproto/lexicon'

export const schemaDict = {
  ExampleLexiconStatus: {
    lexicon: 1,
    id: 'example.lexicon.status',
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
export const ids = { ExampleLexiconStatus: 'example.lexicon.status' }
