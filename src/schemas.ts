import { z } from 'zod';

const ColumnConfigSchema: z.ZodType<ColumnConfig> = z.object({
	id: z.string(),
	name: z.string(),
	formatter: z.string(),
	width: z.number()
});

const BucketConfigSchema: z.ZodType<BucketConfig> = z.object({
	columns: z.array(ColumnConfigSchema)
});

const FilterConfigSchema: z.ZodType<FilterConfig> = z.object({
	name: z.string(),
	filter: z.string(),
	columns: z.array(ColumnConfigSchema)
});

const ServerConfigSchema: z.ZodType<ServerConfig, z.ZodTypeDef, any> = z.object({
	defaults: z.object({
		hostname: z.string().min(1, 'Hostname cannot be empty'),
		port: z
			.union([z.number(), z.string().min(1, 'Port cannot be empty')])
			.pipe(
				z.coerce
					.number({ invalid_type_error: 'Port must be a number' })
					.int('Port must be an integer')
					.min(0)
					.max(65535)
			),
		memorySize: z
			.union([z.number(), z.string().min(1, 'Memory size cannot be empty')])
			.pipe(
				z.coerce
					.number({ invalid_type_error: 'Memory size must be a number' })
					.int('Memory size must be an integer')
					.min(0)
			)
	})
});

type StrictRawShape<T> = { [K in keyof T]: z.ZodType<T[K]> };

function createSchema<T>(schema: StrictRawShape<T>) {
	return z.object(schema).strict() as z.ZodObject<StrictRawShape<T>, 'strict', z.ZodTypeAny, T, T>;
}

export const BulogConfigSchema = createSchema<BulogConfig>({
	buckets: z.record(BucketConfigSchema),
	filters: z.record(FilterConfigSchema),
	server: ServerConfigSchema
});
