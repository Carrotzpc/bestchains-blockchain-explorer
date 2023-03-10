/**
 *    SPDX-License-Identifier: Apache-2.0
 */

import { responder } from '../../../rest/requestutils';
import explorerconfig from '../../../explorerconfig.json';

/**
 *
 *
 * @param {*} router
 * @param {*} platform
 */
export function spiRoutes(router, platform) {
	const proxy = platform.getProxy();

	router.post(
		'/register/networks',
		responder(async req => {
			const { name } = req.body;
			await platform.buildClients({ [name]: req.body });
			await platform.initializeListener(explorerconfig.sync);
			return {
				message: 'success'
			};
		})
	);
}
