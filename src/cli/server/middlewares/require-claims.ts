import { asyncErrorHandler } from '@server/utils/async-error-handler.js';

export const requireLogClientClaims = asyncErrorHandler(async (req, _res, next) => {
	const authConfig = req.bulogEnvironment.config.auth;
	if (authConfig.method === 'none') {
		return next();
	}

	try {
		req.authInfo?.verifyClaims(authConfig.logClientClaims);
		next();
	} catch (err: any) {
		next(err);
	}
});

export const requireWebClientClaims = asyncErrorHandler(async (req, _res, next) => {
	const authConfig = req.bulogEnvironment.config.auth;
	if (authConfig.method === 'none') {
		return next();
	}

	try {
		req.authInfo?.verifyClaims(authConfig.webClientClaims);
		next();
	} catch (err: any) {
		next(err);
	}
});
