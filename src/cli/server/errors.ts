import { WebSocketCloseCodes } from '@/codes';

const httpStatusMessages: { [key: number]: [string, string] } = {
	401: ['Unauthenticated', 'Access denied due to missing credentials.'],
	403: ['Unauthorized', 'Access denied due to invalid or insufficient credentials.'],
	500: [
		'Internal Server Error',
		'The server encountered an error and could not complete the request.'
	]
};

export class BulogError extends Error {
	public errorCode: string;
	public httpStatus: number;
	public httpStatusMessage: string;
	public httpStatusMessageLong: string;
	public wsCloseCode: number;
	public detailMessage?: string;
	public devMessage?: string;

	constructor(errorCode: string, httpStatus: number, wsCloseCode: number) {
		super(httpStatusMessages[httpStatus][0]);
		this.errorCode = errorCode;
		this.httpStatus = httpStatus;
		this.httpStatusMessage = httpStatusMessages[httpStatus][0];
		this.httpStatusMessageLong = httpStatusMessages[httpStatus][1];
		this.wsCloseCode = wsCloseCode;
	}
}

export class InternalServerError extends BulogError {
	constructor(devMessage?: string) {
		super('ERR_INTERNAL', 500, WebSocketCloseCodes.INTERNAL_ERROR);
		this.devMessage = devMessage;
	}
}

export class UnauthenticatedError extends BulogError {
	constructor(wsCloseCode: number = WebSocketCloseCodes.UNAUTHENTICATED) {
		super('ERR_UNAUTHENTICATED', 401, wsCloseCode);
	}
}

export class MissingAuthenticationError extends UnauthenticatedError {
	constructor() {
		super(WebSocketCloseCodes.MISSING_AUTHENTICATION);
		this.detailMessage = 'No session cookie or bearer token was provided';
	}
}

export class UnauthorizedError extends BulogError {
	constructor(errorCode: string, wsCloseCode: number = WebSocketCloseCodes.UNAUTHORIZED) {
		super(errorCode, 403, wsCloseCode);
	}
}

export class InvalidTokenError extends UnauthorizedError {
	constructor() {
		super('ERR_TOKEN_INVALID', WebSocketCloseCodes.INVALID_TOKEN);
		this.detailMessage = 'Invalid token';
	}
}

export class TokenExpiredError extends UnauthorizedError {
	constructor() {
		super('ERR_TOKEN_EXPIRED', WebSocketCloseCodes.TOKEN_EXPIRED);
		this.detailMessage = 'Token expired';
	}
}

export class InvalidTokenClaimsError extends UnauthorizedError {
	constructor(claim: string, expected: string[], actual: string) {
		super('ERR_TOKEN_CLAIM_MISMATCH', WebSocketCloseCodes.INVALID_TOKEN_CLAIMS);
		this.detailMessage = `Token claim "${claim}" is invalid`;
		this.devMessage = `Expected ${expected.length > 1 ? `${expected.map((s) => `"${s}"`).join(' or ')}` : `"${expected}"`} but got "${actual}"`;
	}
}
