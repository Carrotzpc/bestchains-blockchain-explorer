/**
 *    SPDX-License-Identifier: Apache-2.0
 */

import { responder } from '../../../rest/requestutils';
import { helper } from '../../../common/helper';
import * as fs from 'fs';


const logger = helper.getLogger('spi-routes');


/**
 *
 *
 * @param {*} router
 * @param {*} platform
 */
export function spiRoutes(router, platform) {
	/**
	 * Body:
	 * {
	 *   "id":"network1-explorer",
	 *   "name": "A new network from bestchains",
	 *   "profile": {
	 *      "version": "0.1.0",
	 *      "client": {
	 * 		  ...
	 * 		}
	 *      ...
	 *    }
	 * }
	 * 
	 * 
	*/
	router.post(
		'/register/network',
		responder(async req => {
			logger.info('receive request to register network')

			const network_config = req.body;
			
			// save connection profile to local
			const profile = JSON.stringify(network_config.profile);
			const profile_path = platform.getNetworkPorfilePath(network_config.id);
			fs.writeFileSync(profile_path,profile);
			
			// set profile to profile path
			network_config.profile = profile_path;
			await platform.initializeNetwork(network_config.id, network_config);
			return {
				message: 'success'
			};
		})
	);
}
