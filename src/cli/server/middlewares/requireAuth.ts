import { RequestHandler } from 'express';
import { MissingAuthenticationError, TokenExpiredError } from '@server/errors.js';

export function requireAnyAuth(opts: { redirect: boolean }) {
	return (async (req, res, next) => {
		if (!req.isAuthenticated()) {
			return opts.redirect ? res.redirect('/login') : next(new MissingAuthenticationError());
		}

		if (req.authInfo?.expired?.() && !(await req.authInfo.refresh())) {
			return opts.redirect ? res.redirect('/login') : next(new TokenExpiredError());
		}

		next();
	}) as RequestHandler;
}
