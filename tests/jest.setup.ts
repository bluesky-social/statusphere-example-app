import 'tsconfig-paths/register'
import { Server } from '#/server'

beforeAll(async () => {
    global.server = await Server.create()
    global.app = global.server.server
});

afterAll(async () => {
    await global.server?.close()
});
