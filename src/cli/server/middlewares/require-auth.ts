import { MissingAuthenticationError, TokenExpiredError } from '@server/errors.js';
import { asyncErrorHandler } from '@server/utils/async-error-handler.js';

export function requireAnyAuth(opts: { redirect: boolean }) {
	return asyncErrorHandler(async (req, res, next) => {
		if (req.authError) {
			return next(req.authError);
		}

		const authConfig = req.bulogEnvironment.config.auth;

		if (authConfig.method === 'none') {
			return next();
		}

		if (!req.isAuthenticated()) {
			return opts.redirect ? res.redirect('/login') : next(new MissingAuthenticationError());
		}

		if (req.authInfo?.expired?.() && !(await req.authInfo.refresh())) {
			return opts.redirect ? res.redirect('/login') : next(new TokenExpiredError());
		}

		next();
	});
}
