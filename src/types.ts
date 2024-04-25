import { z } from 'zod';
import {
	BucketConfigSchema,
	BulogConfigSchema,
	ColumnConfigSchema,
	FilterConfigSchema,
	LogClientConfigSchema,
	LogClientInstanceAuthConfigSchema,
	LogClientInstanceConfigSchema,
	ServerAuthConfigOIDCSchema,
	ServerAuthConfigSchema,
	ServerConfigSchema,
	ServerHTTPSConfigSchema
} from '@/schemas';

export type ColumnConfig = z.infer<typeof ColumnConfigSchema>;
export type BucketConfig = z.infer<typeof BucketConfigSchema>;
export type FilterConfig = z.infer<typeof FilterConfigSchema>;
export type ServerAuthConfigOIDC = z.infer<typeof ServerAuthConfigOIDCSchema>;
export type ServerAuthConfig = z.infer<typeof ServerAuthConfigSchema>;
export type ServerHTTPSConfig = z.infer<typeof ServerHTTPSConfigSchema>;
export type ServerConfig = z.infer<typeof ServerConfigSchema>;
export type BulogConfig = z.infer<typeof BulogConfigSchema>;
export type LogClientInstanceAuthConfig = z.infer<typeof LogClientInstanceAuthConfigSchema>;
export type LogClientInstanceConfig = z.infer<typeof LogClientInstanceConfigSchema>;
export type LogClientConfig = z.infer<typeof LogClientConfigSchema>;

export interface StaticFrontendConfig {
	authAllowed: boolean;
}

export type LogRenderer = (logs: LogData[]) => Promise<Array<{ [id: string]: JSONValue }>>;

export interface BucketData {
	columns: ColumnConfig[];
	logs: LogData[];
	logRenderer: LogRenderer;
}

export interface FilterData {
	name: string;
	predicateString: string;
	predicate: (log: LogData[]) => Promise<boolean[]>;
	columns: ColumnConfig[];
	logs: LogData[];
	logRenderer: LogRenderer;
}

export type JSONValue = string | number | boolean | Record<string, any> | any[] | null;

export interface LogData extends Record<string, JSONValue> {
	id: string;
	bucket: string;
	timestamp: string;
	message: JSONValue;
}

export interface LogMessage {
	bucket: string;
	log: LogData;
}

export interface RenderedLog {
	log: LogData;
	render: JSONValue[];
}
