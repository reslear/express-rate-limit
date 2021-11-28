// /test/headers-test.ts
// Tests whether the headers sent back by the middleware

import request from 'supertest'

import rateLimit from '../dist/index.js'

import { createServer } from './helpers/create-server.js'

describe('headers test', () => {
	it('should send correct `x-ratelimit-limit`, `x-ratelimit-remaining`, and `x-ratelimit-reset` headers', async () => {
		const app = createServer(
			rateLimit({
				windowMs: 60 * 1000,
				max: 5,
				headers: true,
			}),
		)
		const expectedResetTimestamp = Math.ceil(
			(Date.now() + 60 * 1000) / 1000,
		).toString()
		const resetRegexp = new RegExp(`^\\d+${expectedResetTimestamp.slice(-2)}$`)

		await request(app)
			.get('/')
			.expect('x-ratelimit-limit', '5')
			.expect('x-ratelimit-remaining', '4')
			.expect('x-ratelimit-reset', resetRegexp)
			.expect(200, 'Hi there!')
	})

	it('should send correct `ratelimit-limit`, `ratelimit-remaining`, and `ratelimit-reset` headers', async () => {
		const app = createServer(
			rateLimit({
				windowMs: 60 * 1000,
				max: 5,
				useStandardizedHeaders: true,
			}),
		)

		await request(app)
			.get('/')
			.expect('ratelimit-limit', '5')
			.expect('ratelimit-remaining', '4')
			.expect('ratelimit-reset', '60')
			.expect(200, 'Hi there!')
	})

	it('should return the `retry-after` header once IP has reached the max', async () => {
		const app = createServer(
			rateLimit({
				windowMs: 60 * 1000,
				max: 1,
			}),
		)

		await request(app).get('/').expect(200)
		await request(app).get('/').expect(429).expect('retry-after', '60')
	})
})