import express from 'express';
import { default as _cookieSession } from 'cookie-session';

export function cookieSession(
	options?: CookieSessionInterfaces.CookieSessionOptions
): express.RequestHandler {
	const router = express.Router();

	router.use(_cookieSession(options));

	router.use((req, _res, next) => {
		if (req.session && !req.session.regenerate) {
			req.session.regenerate = (cb) => {
				cb(null);
				return req.session;
			};
		}
		if (req.session && !req.session.save) {
			req.session.save = (cb) => {
				cb?.(null);
				return req.session;
			};
		}
		next();
	});

	return router;
}
