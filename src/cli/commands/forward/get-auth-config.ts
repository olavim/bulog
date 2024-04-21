import { LogClientInstanceConfig } from '@/types';

interface FilledLogClientInstanceAuthConfigNone {
	method: 'none';
}

interface FilledLogClientInstanceAuthConfigOIDC {
	method: 'oidc';
	oidc: {
		issuerUrl: string;
		clientId: string;
		clientSecret: string;
		scope?: string;
		additionalParams?: Record<string, string>;
	};
}

export type FilledLogClientInstanceAuthConfig =
	| FilledLogClientInstanceAuthConfigNone
	| FilledLogClientInstanceAuthConfigOIDC;

function throwIfMissing(value: string | undefined, errorMessage: string) {
	if (!value) {
		throw new Error(errorMessage);
	}

	return value;
}

export function getAuthConfig(config: LogClientInstanceConfig): FilledLogClientInstanceAuthConfig {
	const authMethod = process.env.BULOG_FW_AUTH_METHOD ?? config.auth?.method;

	if (authMethod === 'oidc') {
		return {
			method: 'oidc',
			oidc: {
				issuerUrl: throwIfMissing(
					process.env.BULOG_FW_AUTH_OIDC_ISSUER_URL ?? config.auth?.oidc?.issuerUrl,
					'Using OpenID Connect authentication, but issuer URL was not provided. Set "BULOG_FW_OIDC_ISSUER_URL" environment variable or "oidcIssuerUrl" config.'
				),
				clientId: throwIfMissing(
					process.env.BULOG_FW_AUTH_OIDC_CLIENT_ID ?? config.auth?.oidc?.clientId,
					'Using OpenID Connect authentication, but client id was not provided. Set "BULOG_FW_OIDC_CLIENT_ID" environment variable or "oidcClientId" config.'
				),
				clientSecret: throwIfMissing(
					process.env.BULOG_FW_AUTH_OIDC_CLIENT_SECRET ?? config.auth?.oidc?.clientSecret,
					'Using OpenID Connect authentication, but client secret was not provided. Set "BULOG_FW_OIDC_CLIENT_SECRET" environment variable or "oidcClientSecret" config.'
				),
				scope: process.env.BULOG_FW_AUTH_OIDC_ADDITIONAL_PARAMS ?? config.auth?.oidc?.scope,
				additionalParams: process.env.BULOG_FW_AUTH_OIDC_ADDITIONAL_PARAMS
					? Object.fromEntries(
							process.env.BULOG_FW_AUTH_OIDC_ADDITIONAL_PARAMS.split(';').map((param) => [
								param.split('=')[0],
								param.split('=').slice(1).join('=')
							])
						)
					: config.auth?.oidc?.additionalParams
			}
		};
	}

	return { method: 'none' };
}
