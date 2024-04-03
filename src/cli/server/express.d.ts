import Comms from './comms';

declare global {
	namespace Express {
		interface Request {
			bulogOptions: ServerOptions;
			bulogComms: Comms;
		}
	}

	type ServerOptions = {
		tempConfig: boolean;
		memorySize: number;
	};
}

export {};
