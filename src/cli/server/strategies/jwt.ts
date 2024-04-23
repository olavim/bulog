import { JWTPayload } from 'jose';
import { Strategy } from 'passport';
import { TokenSet } from 'openid-client';
import { Request } from 'express';
import { getToken } from '@server/utils/get-token.js';
import { verifyJwtClaims } from '@server/utils/verify-jwt-claims.js';
import { InvalidTokenError } from '@server/errors.js';

export interface SessionStrategyOptions {
	issuer: string;
	jwtVerifier: (jwt: string) => Promise<JWTPayload>;
}

function now() {
	return Math.round(Date.now() / 1000);
}

export default class JWTStrategy extends Strategy {
	private issuer: string;
	private jwtVerifier: (jwt: string) => Promise<JWTPayload>;

	constructor(opts: SessionStrategyOptions) {
		super();
		this.name = 'jwt';
		this.issuer = opts.issuer;
		this.jwtVerifier = opts.jwtVerifier;
	}

	async authenticate(req: Request) {
		try {
			const token = getToken(req.headers);

			if (!token) {
				return this.pass();
			}

			const payload = await this.jwtVerifier(token);
			const expiresAt = payload.exp ?? now() + 300;

			req.user = new TokenSet({
				access_token: token,
				expires_at: expiresAt
			});

			req.authInfo = {
				refresh: async () => false,
				expired: () => expiresAt <= now(),
				expiresIn: () => expiresAt - now(),
				verifyClaims: (claims) => verifyJwtClaims(payload, this.issuer, claims),
				claims: payload
			};

			this.success(req.user);
		} catch (err: any) {
			req.authError = new InvalidTokenError();
			this.pass();
		}
	}
}
