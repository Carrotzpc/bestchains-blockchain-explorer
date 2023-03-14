/* eslint-disable spellcheck/spell-checker */
/**
 *    SPDX-License-Identifier: Apache-2.0
 */
import { Request, Response } from 'express';
import * as urllib from 'urllib';
import { JwtPayload } from 'jsonwebtoken';
import * as jwt from 'jsonwebtoken';
import { helper } from '../../common/helper';
import oidcConfig from './config';

const logger = helper.getLogger('oidc');

/**
 *
 *
 * @param {*} router
 * @param {*} platform
 */
export async function oidcRoutes(router: any, platform: any) {
	const proxy = platform.getProxy();

	router.get('/auth', (_req: Request, res: Response) => {
		const {
			client: { client_id, redirect_uri },
			server: { url }
		} = oidcConfig;
		const searchParams = new URLSearchParams({
			client_id,
			redirect_uri,
			response_type: 'code'
		});
		const redirectUrl = url + '/auth?' + searchParams.toString();
		logger.info('oidc auth =>', redirectUrl);
		res.redirect(redirectUrl);
	});

	router.get('/callback', async (req: Request, res: Response) => {
		const { code } = req.query;
		if (!code) {
			throw new Error('code in query is requied.');
		}
		const {
			client: { client_id, client_secret, redirect_uri },
			server: { url }
		} = oidcConfig;
		const result = await urllib.request(url + '/token', {
			method: 'POST',
			auth: client_id + ':' + client_secret,
			dataType: 'json',
			rejectUnauthorized: false,
			timeout: 10 * 1000,
			data: {
				code,
				redirect_uri,
				grant_type: 'authorization_code'
			}
		});
		const token = result.data.id_token;
		if (!token) {
			throw result.data;
		}
		const decodedToken = jwt.decode(token) as JwtPayload;
		res.cookie('oidc-token', token, {
			expires: new Date(decodedToken.exp * 1000)
		});
		return res.redirect('/');
	});
}
