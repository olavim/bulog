import { BaseClient, Issuer, TokenSet, custom } from 'openid-client';
import https from 'https';
import { CLIError } from '@oclif/core/lib/errors/index.js';
import { FilledLogClientInstanceAuthConfig } from './get-auth-config.js';

interface GetAuthTokenOpts {
	insecure: boolean;
	authConfig: FilledLogClientInstanceAuthConfig;
}

export const getAuthTokenGetter = async ({ insecure, authConfig }: GetAuthTokenOpts) => {
	const httpsAgent = new https.Agent({ rejectUnauthorized: !insecure });

	if (authConfig?.method === 'oidc') {
		custom.setHttpOptionsDefaults({ agent: httpsAgent });

		let bulogIssuer: Issuer<BaseClient>;

		try {
			bulogIssuer = await Issuer.discover(authConfig.oidc.issuerUrl);
		} catch (err: any) {
			throw new CLIError(`OpenID Connect discovery failed: ${err.message}`, { exit: 1 });
		}

		const client = new bulogIssuer.Client({
			client_id: authConfig.oidc.clientId,
			client_secret: authConfig.oidc.clientSecret
		});

		return async () => {
			let tokenSet: TokenSet;
			try {
				tokenSet = await client.grant({
					grant_type: 'client_credentials',
					...authConfig.oidc.additionalParams
				});
			} catch (err: any) {
				throw new CLIError(`Could not get client credentials: ${err.message}`, { exit: 1 });
			}

			return tokenSet.access_token;
		};
	}

	return async () => {};
};
