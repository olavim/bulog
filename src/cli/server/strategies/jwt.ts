import { JWTHeaderParameters, JWTPayload } from 'jose';
import { Strategy } from 'passport';
import { TokenSet } from 'openid-client';
import { jwtVerifier } from '@server/utils/verify-jwt.js';
import { getToken } from '@server/utils/get-token.js';

export interface SessionStrategyOptions {
	issuerBaseURL: string;
	audience: string;
	cacheMaxAge?: number;
}

export default class JWTStrategy extends Strategy {
	private verifyJwt: (token: string) => Promise<{
		payload: JWTPayload;
		header: JWTHeaderParameters;
		token: string;
	}>;

	constructor(opts: SessionStrategyOptions) {
		super();
		this.name = 'jwt';
		this.verifyJwt = jwtVerifier(opts);
	}

	async authenticate(req: any) {
		let token: string;
		try {
			token = getToken(req.headers);
		} catch (err: any) {
			return this.fail();
		}

		try {
			const { payload } = await this.verifyJwt(token);
			req.user = new TokenSet({
				access_token: token,
				expires_at: payload.exp ?? 0
			});
			this.success(req.user);
		} catch (err: any) {
			this.error(err);
		}
	}
}
