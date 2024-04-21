import { UnauthenticatedError } from '../errors.js';

type HeadersLike = Record<string, unknown> & {
	authorization?: string;
};

const getTokenFromHeader = (headers: HeadersLike) => {
	if (typeof headers.authorization !== 'string') {
		return;
	}
	const match = headers.authorization.match(/^Bearer (.+)$/i);
	if (!match) {
		return;
	}
	return match[1];
};

export function getToken(headers: HeadersLike): string {
	const token = getTokenFromHeader(headers);

	if (!token) {
		throw new UnauthenticatedError('Missing token');
	}

	return token;
}
