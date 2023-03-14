/* eslint-disable spellcheck/spell-checker */
/*
 * SPDX-License-Identifier: Apache-2.0
 */

import { NextFunction, Request, Response } from 'express';
import * as jwt from 'jsonwebtoken';
import { helper } from '../common/helper';
import config from '../explorerconfig.json';
import { getNetworks } from '../rest/oidc/bc-apis';

const logger = helper.getLogger('oidcTokenCheckMiddleware');
/**
 *  The Auth Checker middleware function.
 */
export const oidcTokenCheckMiddleware = async (
	req: Request,
	res: Response,
	next: NextFunction
) => {
	if (req.path.startsWith('/oidc/')) {
		return next();
	}
	const token = req.cookies?.[config.token.key];
	if (!token) {
		return res.redirect('/oidc/auth');
	}

	try {
		const decodedToken = jwt.decode(token) as jwt.JwtPayload;
		if (decodedToken.exp < Date.now() / 1000) {
			res.cookie(config.token.key, '', { maxAge: 0 });
			return res.redirect('/oidc/auth');
		}
		// eslint-disable-next-line no-extra-parens
		(req as any).requestUserId = decodedToken.preferred_username;
		let network = req.cookies.network;
		if (!network) {
			const networksRes = await getNetworks(token);
			network = networksRes?.data?.networks[0]?.name;
			if (network) {
				res.cookie('network', network, { httpOnly: false });
			}
		}
		// eslint-disable-next-line no-extra-parens
		(req as any).network = network;
		return next();
	} catch (error) {
		logger.error('check failed =>', error);
		return res.status(401).end();
	}
};
