import _ from 'lodash';
import { InvalidTokenClaimsError } from '@server/errors.js';
import { JWTPayload } from 'jose';

export function verifyJwtClaims(
	jwtPayload: JWTPayload,
	issuer: string,
	claims: Array<{ key: string; value: string }>
) {
	claims = [...claims, { key: 'iss', value: issuer }];

	for (const claim of claims) {
		if (!jwtPayload[claim.key] || !_.castArray(jwtPayload[claim.key]).includes(claim.value)) {
			throw new InvalidTokenClaimsError(
				claim.key,
				_.castArray(jwtPayload[claim.key]) as string[],
				claim.value
			);
		}
	}
}
