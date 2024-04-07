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

export const BulogConfigSchema: z.ZodType<BulogConfig> = z.object({
	buckets: z.record(BucketConfigSchema),
	filters: z.record(FilterConfigSchema)
});

export const BulogConfigExportSchema: z.ZodType<BulogConfigExport> = z.object({
	buckets: z.record(BucketConfigSchema),
	filters: z.record(FilterConfigSchema)
});
