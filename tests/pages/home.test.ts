import { agent as request } from "supertest"
import '../jest.global'

describe("home", () => {
  test("renders", async () => {
    const response = await request(global.app).get("/")
    expect(response.statusCode).toBe(200)
    expect(response.text).toContain('<title>Home</title>')
  })
})