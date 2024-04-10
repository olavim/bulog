import { Start } from '@cli/commands/start.js';
import { Flag } from '@oclif/core/lib/interfaces';

type InferFlag<T> = T extends Flag<infer F> ? F : never;

declare global {
	type BulogEnvironment = {
		[K in keyof typeof Start.flags]: {
			config: boolean;
			value: NonNullable<InferFlag<(typeof Start.flags)[K]>>;
		};
	};
}
