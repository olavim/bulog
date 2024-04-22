import { BaseClient, Issuer, TokenSet, custom } from 'openid-client';
import axios from 'axios';
import https from 'https';
import { CLIError } from '@oclif/core/lib/errors/index.js';
import { FilledLogClientInstanceAuthConfig } from './get-auth-config.js';

interface GetAuthTokenOpts {
	insecure: boolean;
	authConfig: FilledLogClientInstanceAuthConfig;
}

function handleAxiosError(err: any) {
	if (!axios.isAxiosError(err) || !err.response) {
		if (['ECONNREFUSED', 'ECONNABORTED'].includes(err.code)) {
			throw new CLIError('Could not connect to the server', { exit: false, code: err.code });
		} else {
			throw new CLIError(err.message, { exit: 1, code: err.code });
		}
	}

	throw new CLIError(err.response.data?.message ?? err.response.data, { exit: 1 });
}

export const getAuthTokenGetter = async ({ insecure, authConfig }: GetAuthTokenOpts) => {
	const httpsAgent = new https.Agent({ rejectUnauthorized: !insecure });
	const axiosInstance = axios.create({ httpsAgent, timeout: 5000 });

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

		return async (url: string) => {
			let tokenSet: TokenSet;
			try {
				tokenSet = await client.grant({
					grant_type: 'client_credentials',
					...authConfig.oidc.additionalParams
				});
			} catch (err: any) {
				throw new CLIError(`Could not get client credentials: ${err.message}`, { exit: 1 });
			}

			const token = tokenSet.access_token;

			// Verify token auth
			try {
				await axiosInstance.get(`${url}/io/logs/write/.auth`, {
					headers: { Authorization: `Bearer ${token}` }
				});
			} catch (err: any) {
				handleAxiosError(err);
			}

			return token;
		};
	}

	return async (url: string) => {
		// Verify no auth
		try {
			await axiosInstance.get(`${url}/io/logs/write/.auth`);
		} catch (err: any) {
			handleAxiosError(err);
		}
	};
};
