import { CommsInterface } from './comms.js';
import { ServerOptions } from './index.js';

export {};

declare global {
	namespace Express {
		interface Request {}
		export interface Request {
			bulogOptions: ServerOptions;
			bulogComms: CommsInterface;
		}
	}
}
