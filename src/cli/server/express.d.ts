declare global {
	namespace Express {
		interface Request {
			bulogOptions: ServerOptions;
		}
	}

	type ServerOptions = {
		tempConfig: boolean;
		stateless: boolean;
	};
}

export {};
