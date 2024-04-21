import { z } from 'zod';

export const ColumnConfigSchema = z
	.object({
		id: z.string(),
		name: z.string(),
		formatter: z.string(),
		width: z.number()
	})
	.strict();

export const BucketConfigSchema = z
	.object({
		columns: z.array(ColumnConfigSchema)
	})
	.strict();

export const FilterConfigSchema = z
	.object({
		name: z.string(),
		filter: z.string(),
		columns: z.array(ColumnConfigSchema)
	})
	.strict();

const ServerDefaultsConfigSchema = z
	.object({
		hostname: z.string().min(1, 'Hostname is required').default('0.0.0.0'),
		port: z
			.union([z.number(), z.string().min(1, 'Port is required'), z.undefined()])
			.pipe(
				z.coerce
					.number({ invalid_type_error: 'Port must be a number' })
					.int('Port must be an integer')
					.min(0)
					.max(65535)
					.default(3100)
			),
		memorySize: z
			.union([z.number(), z.string().min(1, 'Memory size is required'), z.undefined()])
			.pipe(
				z.coerce
					.number({ invalid_type_error: 'Memory size must be a number' })
					.int('Memory size must be an integer')
					.min(0)
					.default(1000)
			)
	})
	.strict()
	.default({});

export const ServerAuthConfigNoneSchema = z
	.object({
		method: z.literal('none')
	})
	.strict();

export const ServerAuthConfigOIDCSchema = z
	.object({
		method: z.literal('oidc'),
		baseUrl: z.string().url().min(1, 'Base URL is required'),
		issuerUrl: z.string().url().min(1, 'Issuer URL is required'),
		clientId: z.string().min(1, 'Client ID is required'),
		clientSecret: z.string().min(1, 'Client secret is required'),
		scope: z.string().min(1, 'Client secret is required').default('openid profile'),
		authorizationParams: z.array(z.object({ key: z.string().min(1), value: z.string() })),
		webClientClaims: z.object({
			audience: z.string().min(1, 'Audience is required'),
			claims: z.array(
				z.object({
					key: z.string().min(1, 'Key is required'),
					value: z.string()
				})
			)
		}),
		logClientClaims: z.object({
			audience: z.string().min(1, 'Audience is required'),
			claims: z.array(
				z.object({
					key: z.string().min(1, 'Key is required'),
					value: z.string()
				})
			)
		})
	})
	.strict();

export const ServerAuthConfigSchema = z
	.union([ServerAuthConfigNoneSchema, ServerAuthConfigOIDCSchema])
	.default({ method: 'none' });

export const ServerConfigSchema = z
	.object({
		defaults: ServerDefaultsConfigSchema,
		auth: ServerAuthConfigSchema
	})
	.strict()
	.default({});

export const BulogConfigSchema = z
	.object({
		buckets: z.record(BucketConfigSchema).default({}),
		filters: z.record(FilterConfigSchema).default({}),
		server: ServerConfigSchema
	})
	.strict();

export const LogClientInstanceAuthConfigSchema = z
	.object({
		method: z
			.union([z.literal('none'), z.literal('oidc')])
			.optional()
			.describe(
				'Authentication method. Either "none" for no authentication, or "oidc" for OpenID Connect.'
			),
		oidc: z
			.object({
				issuerUrl: z
					.string()
					.url()
					.optional()
					.describe('Issuer base URL when using OpenID Connect authentication.'),
				clientId: z
					.string()
					.optional()
					.describe(
						'Client ID used in client credentials flow when using OpenID Connect authentication.'
					),
				clientSecret: z
					.string()
					.optional()
					.describe(
						'Client secret used in client credentials flow when using OpenID Connect authentication.'
					),
				scope: z
					.string()
					.optional()
					.describe('OAuth2 scopes to request when using OpenID Connect authentication.'),
				additionalParams: z
					.record(
						z.string().refine(
							(key) => !['grant_type', 'scope'].includes(key),
							(key) => ({ message: `Parameter ${key} is reserved.` })
						),
						z
							.any()
							.describe(
								'Additional parameter to send during client credentials request when using OpenID Connect authentication.'
							)
					)
					.optional()
			})
			.strict()
			.optional()
	})
	.strict()
	.optional();

export const LogClientInstanceConfigSchema = z
	.object({
		url: z
			.string()
			.url()
			.optional()
			.describe('Bulog instance URL, for example http://localhost:3100'),
		auth: LogClientInstanceAuthConfigSchema
	})
	.strict();

export const LogClientConfigSchema = z.record(LogClientInstanceConfigSchema).default({});
