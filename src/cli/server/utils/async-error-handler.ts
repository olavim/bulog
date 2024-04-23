import { RequestHandler } from 'express';

export function asyncErrorHandler(fn: RequestHandler): RequestHandler {
	return (req, res, next) => {
		Promise.resolve(fn(req, res, next)).catch(next);
	};
}
