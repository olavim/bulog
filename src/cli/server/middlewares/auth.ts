import express, { RequestHandler } from 'express';
import { ServerAuthConfig, ServerAuthConfigOIDC } from '@/types';
import { Strategy, Issuer, StrategyVerifyCallback, BaseClient, TokenSet } from 'openid-client';
import passport from 'passport';
import JWTStrategy from '@server/strategies/jwt.js';
import { UnauthenticatedError } from '@server/errors.js';

function oidcStrategy(client: BaseClient, authParams: ServerAuthConfigOIDC['authorizationParams']) {
	return new Strategy(
		{
			client,
			sessionKey: 'bulogSession',
			usePKCE: false,
			params: Object.fromEntries(authParams.map((param) => [param.key, param.value]))
		},
		((tokenset, done) => done(null, tokenset)) as StrategyVerifyCallback<TokenSet>
	);
}

function jwtStrategy(authConfig: ServerAuthConfigOIDC) {
	return new JWTStrategy({
		issuerBaseURL: authConfig.issuerUrl,
		audience: authConfig.logClientClaims.audience
	});
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

	passport.serializeUser<TokenSet>((tokenset, cb) => cb(null, tokenset as TokenSet));
	passport.deserializeUser<TokenSet>((tokenset, cb) => cb(null, new TokenSet(tokenset)));

	passport.use('oidc', oidcStrategy(client, authSettings.authorizationParams));
	passport.use('jwt', jwtStrategy(authSettings));

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

	router.use('/api', passport.authenticate('jwt', { session: false }), (req, _res, next) => {
		return req.isAuthenticated() ? next() : next(new UnauthenticatedError('Missing token'));
	});

	router.use(async (req, res, next) => {
		if (!req.isAuthenticated()) {
			return res.redirect('/login');
		}

		if (req.user instanceof TokenSet && req.user.expired()) {
			if (req.user.refresh_token) {
				const newTokenSet = await client.refresh(req.user.refresh_token);
				(req.session as any).passport.user.access_token = newTokenSet.access_token;
				(req.session as any).passport.user.expires_at = newTokenSet.expires_at;
			} else {
				return res.redirect('/logout');
			}
		}

		next();
	});

	return router;
}

export async function auth(authSettings: ServerAuthConfig) {
	if (authSettings.method === 'oidc') {
		return await oidcAuth(authSettings);
	}

	return ((_req, _res, next) => next()) as RequestHandler;
}
