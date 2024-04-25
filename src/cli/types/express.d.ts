import { CommsInterface } from '@server/comms.js';
import { SystemSignals } from '@server/system-signals.js';
import { BulogEnvironment } from '@cli/commands/start.js';
import { JWTPayload } from 'jose';

export {};

declare global {
	export namespace Express {
		export interface Request {
			bulogEnvironment: BulogEnvironment;
			bulogComms: CommsInterface;
			systemSignals: SystemSignals;
			authError?: BulogError;
			effectiveProtocol: 'http' | 'https';
		}
		export interface AuthInfo {
			refresh: () => Promise<boolean>;
			expired: () => boolean;
			expiresIn: () => number;
			verifyClaims: (claims: Array<{ key: string; value: string }>) => void;
			claims: JWTPayload;
		}
	}
}
