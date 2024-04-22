import { CommsInterface } from '@server/comms.js';
import { SystemSignals } from '@server/system-signals.js';
import { BulogEnvironment } from '@cli/commands/start.js';

export {};

declare global {
	export namespace Express {
		export interface Request {
			bulogEnvironment: BulogEnvironment;
			bulogComms: CommsInterface;
			systemSignals: SystemSignals;
		}
		export interface AuthInfo {
			refresh: () => Promise<boolean>;
			expired: () => boolean;
			expiresIn: () => number;
		}
	}
}
