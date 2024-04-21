import { createRemoteJWKSet, jwtVerify } from 'jose';
import { InvalidTokenClaimsError, InvalidTokenError, TokenExpiredError } from '../errors.js';
import { JWTClaimValidationFailed, JWTExpired } from 'jose/errors';

interface OpenIDConfig {
	issuer: string;
	jwks_uri: string;
	id_token_signing_alg_values_supported?: string[];
	[key: string]: unknown;
}

interface DiscoverOptions {
	issuerBaseURL: string;
	cacheMaxAge: number;
}

interface DiscoveryResult {
	jwksUri: string;
	issuer: string;
	idTokenSigningAlgValuesSupported: string[];
}

interface JWTVerifierOptions {
	issuerBaseURL: string;
	audience: string;
	cacheMaxAge?: number;
}

function discover({ issuerBaseURL, cacheMaxAge }: DiscoverOptions) {
	const oidcDiscoveryURL = `${issuerBaseURL.replace(/\/$/, '')}/.well-known/openid-configuration`;

	let discovery: Promise<DiscoveryResult> | undefined;
	let timestamp = 0;

	return () => {
		const now = Date.now();

		if (!discovery || now > timestamp + cacheMaxAge) {
			timestamp = now;
			discovery = fetch(oidcDiscoveryURL)
				.then((res) => res.json() as Promise<OpenIDConfig>)
				.then((config) => ({
					jwksUri: config.jwks_uri,
					issuer: config.issuer,
					idTokenSigningAlgValuesSupported: config.id_token_signing_alg_values_supported ?? []
				}))
				.catch((err) => {
					discovery = undefined;
					throw err;
				});
		}

		return discovery;
	};
}

export function jwtVerifier({
	issuerBaseURL,
	audience,
	cacheMaxAge = 10 * 60 * 1000
}: JWTVerifierOptions) {
	const getDiscovery = discover({ issuerBaseURL, cacheMaxAge });

	return async (jwt: string) => {
		const discovery = await getDiscovery();
		const getJWKS = createRemoteJWKSet(new URL(discovery.jwksUri), { cacheMaxAge });

		try {
			const { payload, protectedHeader: header } = await jwtVerify(jwt, getJWKS, {
				issuer: discovery.issuer,
				audience,
				algorithms: discovery.idTokenSigningAlgValuesSupported
			});

			return { payload, header, token: jwt };
		} catch (err: any) {
			if (err instanceof JWTClaimValidationFailed) {
				throw new InvalidTokenClaimsError();
			} else if (err instanceof JWTExpired) {
				throw new TokenExpiredError();
			} else {
				throw new InvalidTokenError();
			}
		}
	};
}
