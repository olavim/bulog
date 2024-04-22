import express from 'express';
import { ServerAuthConfig, ServerAuthConfigOIDC } from '@/types';
import { Strategy as OIDCStrategy, Issuer, BaseClient, TokenSet } from 'openid-client';
import passport from 'passport';
import JWTStrategy from '@server/strategies/jwt.js';
import { VerifyCallback } from 'passport-jwt';

function now() {
	return Math.round(Date.now() / 1000);
}

function oidcStrategy(client: BaseClient, authParams: ServerAuthConfigOIDC['authorizationParams']) {
	return new OIDCStrategy(
		{
			client,
			sessionKey: 'bulogSession',
			usePKCE: false,
			params: Object.fromEntries(authParams.map((param) => [param.key, param.value]))
		},
		((tokenset: TokenSet, done) => done(null, tokenset)) as VerifyCallback
	);
}

function jwtStrategy(authConfig: ServerAuthConfigOIDC) {
	return new JWTStrategy({ issuerBaseURL: authConfig.issuerUrl });
}

async function oidcAuth(authSettings: ServerAuthConfigOIDC) {
	const router = express.Router();

	const issuer = await Issuer.discover(authSettings.issuerUrl);
	const client = new issuer.Client({
		client_id: authSettings.clientId,
		client_secret: authSettings.clientSecret,
		response_types: ['code'],
		redirect_uris: [`${authSettings.baseUrl}/callback`]
	});

	passport.serializeUser((user, cb) => cb(null, user));
	passport.deserializeUser((user, cb) => cb(null, new TokenSet(user as any)));

	passport.use('oidc', oidcStrategy(client, authSettings.authorizationParams));
	passport.use('jwt', jwtStrategy(authSettings));

	router.use(passport.authenticate(['jwt', 'session'], { session: false }));

	router.get('/login', passport.authenticate('oidc'));
	router.get('/logout', (req, res) => {
		req.logout({ keepSessionInfo: false }, () => {
			res.redirect(client.endSessionUrl({ post_logout_redirect_uri: authSettings.baseUrl }));
		});
	});
	router.get(
		'/callback',
		passport.authenticate('oidc', { failureRedirect: '/login', successRedirect: '/' })
	);

	router.use((req, _res, next) => {
		if (req.isAuthenticated()) {
			const tokenset = req.user as TokenSet;
			tokenset.expires_at = tokenset.expires_at ?? now() + 300;
			const refreshToken = tokenset.refresh_token;

			req.authInfo = {
				refresh: async () => {
					if (!refreshToken) {
						return false;
					}

					const newTokenSet = await client.refresh(refreshToken);
					req.authInfo!.expiresIn = () => newTokenSet.expires_in!;
					(req.session as any).passport.user.access_token = newTokenSet.access_token;
					(req.session as any).passport.user.expires_at = newTokenSet.expires_at;
					return true;
				},
				expired: () => req.authInfo!.expiresIn() <= 0,
				expiresIn: () => tokenset.expires_in!
			};
		}

		next();
	});

	return router;
}

export async function auth(authSettings: ServerAuthConfig) {
	if (authSettings.method === 'oidc') {
		return await oidcAuth(authSettings);
	}

	return ((_req, _res, next) => next()) as express.RequestHandler;
}
