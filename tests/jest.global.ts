import 'tsconfig-paths/register'
import { Server } from '#/server'
import type http from 'node:http'

declare global {
  var server: Server | undefined
  var app: http.Server | undefined
}
