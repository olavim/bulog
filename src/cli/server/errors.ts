export class HTTPError extends Error {
	public status: number;
	public errorCode: string;

	constructor(status: number, errorCode: string, errorMessage: string) {
		super(errorMessage);
		this.status = status;
		this.errorCode = errorCode;
	}
}

export class UnauthenticatedError extends HTTPError {
	constructor(message: string) {
		super(401, 'ERR_UNAUTHENTICATED', `Unauthenticated: ${message}`);
	}
}

export class UnauthorizedError extends HTTPError {
	constructor(errorCode: string, message: string) {
		super(403, errorCode, `Unauthorized: ${message}`);
	}
}

export class InvalidTokenError extends UnauthorizedError {
	constructor() {
		super('ERR_TOKEN_INVALID', 'Invalid token');
	}
}

export class TokenExpiredError extends UnauthorizedError {
	constructor() {
		super('ERR_TOKEN_EXPIRED', 'Token expired');
	}
}

export class InvalidTokenClaimsError extends UnauthorizedError {
	constructor(message: string = 'Invalid token claims') {
		super('ERR_TOKEN_CLAIMS', message);
	}
}
