
import { page } from '#/lib/view'
import { login } from '#/pages/login'

describe('view', () => {
    describe('page', () => {
        it('renders login', () => {
            const results = page(login({}))
            expect(results.startsWith('<!DOCTYPE html>')).toBeTruthy()
        })
    })
})
