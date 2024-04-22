import { WebSocketCloseCodes } from '@/codes';

export class BulogError extends Error {
	public errorCode: string;
	public httpStatus: number;
	public wsCloseCode: number;

	constructor(errorCode: string, errorMessage: string, httpStatus: number, wsCloseCode: number) {
		super(errorMessage);
		this.errorCode = errorCode;
		this.httpStatus = httpStatus;
		this.wsCloseCode = wsCloseCode;
	}
}

class UnauthenticatedError extends BulogError {
	constructor(message: string, wsCloseCode: number = WebSocketCloseCodes.UNAUTHENTICATED) {
		super('ERR_UNAUTHENTICATED', `Unauthenticated: ${message}`, 401, wsCloseCode);
	}
}

export class MissingAuthenticationError extends UnauthenticatedError {
	constructor() {
		super('Missing session cookie or bearer token', WebSocketCloseCodes.MISSING_AUTHENTICATION);
	}
}

class UnauthorizedError extends BulogError {
	constructor(
		errorCode: string,
		message: string,
		wsCloseCode: number = WebSocketCloseCodes.UNAUTHORIZED
	) {
		super(errorCode, `Unauthorized: ${message}`, 403, wsCloseCode);
	}
}

export class InvalidTokenError extends UnauthorizedError {
	constructor() {
		super('ERR_TOKEN_INVALID', 'Invalid token', WebSocketCloseCodes.INVALID_TOKEN);
	}
}

export class TokenExpiredError extends UnauthorizedError {
	constructor() {
		super('ERR_TOKEN_EXPIRED', 'Token expired', WebSocketCloseCodes.TOKEN_EXPIRED);
	}
}

export class InvalidTokenClaimsError extends UnauthorizedError {
	constructor(message: string = 'Invalid token claims') {
		super('ERR_TOKEN_CLAIMS', message, WebSocketCloseCodes.INVALID_TOKEN_CLAIMS);
	}
}
