import { createRemoteJWKSet, compactVerify, JWTPayload } from 'jose';
import { InvalidTokenError } from '../errors.js';

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

export function jwtVerifier({ issuerBaseURL, cacheMaxAge = 10 * 60 * 1000 }: JWTVerifierOptions) {
	const getDiscovery = discover({ issuerBaseURL, cacheMaxAge });

	return async (jwt: string) => {
		const discovery = await getDiscovery();
		const getJWKS = createRemoteJWKSet(new URL(discovery.jwksUri), { cacheMaxAge });

		try {
			const { payload: payloadStr } = await compactVerify(jwt, getJWKS, {
				algorithms: discovery.idTokenSigningAlgValuesSupported
			});
			const payload = JSON.parse(new TextDecoder().decode(payloadStr)) as JWTPayload;

			return { payload, token: jwt };
		} catch (err: any) {
			throw new InvalidTokenError();
		}
	};
}
