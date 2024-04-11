import { CommsInterface } from '@server/comms.js';
import { SystemSignals } from '@server/system-signals.js';

export {};

declare global {
	namespace Express {
		interface Request {}
		export interface Request {
			bulogEnvironment: BulogEnvironment;
			bulogComms: CommsInterface;
			systemSignals: SystemSignals;
		}
	}
}
