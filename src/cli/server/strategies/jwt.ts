import { JWTPayload } from 'jose';
import { Strategy } from 'passport';
import { TokenSet } from 'openid-client';
import { Request } from 'express';
import { jwtVerifier } from '@server/utils/verify-jwt.js';
import { getToken } from '@server/utils/get-token.js';

export interface SessionStrategyOptions {
	issuerBaseURL: string;
	cacheMaxAge?: number;
}

function now() {
	return Math.round(Date.now() / 1000);
}

export default class JWTStrategy extends Strategy {
	private verifyJwt: (token: string) => Promise<{
		payload: JWTPayload;
		token: string;
	}>;

	constructor(opts: SessionStrategyOptions) {
		super();
		this.name = 'jwt';
		this.verifyJwt = jwtVerifier(opts);
	}

	async authenticate(req: Request) {
		try {
			const token = getToken(req.headers);

			if (!token) {
				return this.pass();
			}

			const { payload } = await this.verifyJwt(token);
			const expiresAt = payload.exp ?? now() + 300;

			req.user = new TokenSet({
				access_token: token,
				expires_at: expiresAt
			});

			req.authInfo = {
				refresh: async () => false,
				expired: () => expiresAt <= now(),
				expiresIn: () => expiresAt - now()
			};

			this.success(req.user);
		} catch (err: any) {
			this.pass();
		}
	}
}
