/**
 * SPDX-License-Identifier: Apache-2.0
 */

import * as path from 'path';
import fs from 'fs-extra';
import { helper } from '../../common/helper';
import { MetricService } from '../../persistence/fabric/MetricService';
import { CRUDService } from '../../persistence/fabric/CRUDService';
import { UserDataService } from '../../persistence/fabric/UserDataService';

import { Proxy } from './Proxy';
import { ExplorerListener } from '../../sync/listener/ExplorerListener';

import { FabricConfig } from './FabricConfig';
import { UserService } from './service/UserService';
import * as FabricUtils from './utils/FabricUtils';
import * as FabricConst from './utils/FabricConst';

const logger = helper.getLogger('Platform');
const fabric_const = FabricConst.fabric.const;

const config_path = path.resolve(__dirname, './config.json');

/**
 *
 *
 * @class Platform
 */
export class Platform {
	persistence: any;
	broadcaster: any;
	networks: Map<string, any>;
	userService: any;
	proxy: any;
	defaultNetwork: string;
	network_configs: Record<string, any>;
	syncConfig: any;
	explorerListeners: any[];

	/**
	 * Creates an instance of Platform.
	 * @param {*} persistence
	 * @param {*} broadcaster
	 * @memberof Platform
	 */
	constructor(syncConfig, persistence, broadcaster) {
		this.syncConfig = syncConfig;
		this.persistence = persistence;
		this.broadcaster = broadcaster;
		this.networks = new Map();
		this.userService = null;
		this.proxy = null;
		this.defaultNetwork = null;
		this.network_configs = null;
		this.explorerListeners = [];
	}

	/**
	 *
	 *
	 * @memberof Platform
	 */
	async initialize() {
		/* eslint-disable */
		const _self = this;
		/* eslint-enable */

		// Loading the config.json
		const all_config = JSON.parse(fs.readFileSync(config_path, 'utf8'));
		this.network_configs = all_config[fabric_const.NETWORK_CONFIGS];

		this.userService = new UserService(this);
		this.proxy = new Proxy(this, this.userService);

		logger.debug(
			'******* Initialization started for hyperledger fabric platform ******'
		);

		for (const network_id in this.network_configs) {
			// Setting organization enrolment files
			logger.debug('Setting admin organization enrolment files');
			if (!this.defaultNetwork) {
				this.defaultNetwork = network_id;
			}
			try {
				await this.initializeNetwork(network_id, this.network_configs[network_id]);
			} catch (error) {
				logger.error('Failed to initialize network %s', network_id);
				logger.error(error);
			}
		}
		logger.info('Totally initialized %d networks', this.networks.size);
	}

	async initializeNetwork(network_id: string, network_config: any) {
		if (!this.defaultNetwork) {
			this.defaultNetwork = network_id;
		}
		await this.buildClient(network_id, network_config);
		const network_client = this.getClient(network_id);
		if (network_client.getStatus()) {
			logger.info('initailzie listener');
			await this.initializeListener(
				network_id,
				network_config.name,
				network_config.profile
			);
		} else {
			throw new Error(`client (id:${network_id}) not found.`);
		}
	}

	/**
	 *
	 * @description build a client to connect with network
	 * @param {*} network_id
	 * @param {*} network_config
	 * @memberof Platform
	 */
	async buildClient(network_id: string, network_config: any) {
		// Create client instance
		logger.info('Building network client [%s] >> ', network_id, network_config);

		const config = new FabricConfig();
		config.initialize(network_id, network_config.profile);

		const client = await FabricUtils.createFabricClient(config, this.persistence);
		if (client) {
			// Set client into clients map
			const clientObj = { name: network_config.name, instance: client };
			this.networks.set(network_id, clientObj);
		}
	}

	/**
	 * @description initialize a network listener with pre-built network client
	 * @param {*} network_id
	 * @param {*} clientObj
	 * @memberof Platform
	 */
	async initializeListener(
		network_id: string,
		network_name: string,
		network_profile_path: string
	) {
		/* eslint-disable */
		logger.info(
			'initializeListener, network_id, network_name,network_profile_path ',
			network_id,
			network_name,
			network_profile_path
		);
		const explorerListener = new ExplorerListener(this, this.syncConfig);
		await explorerListener.initialize([
			network_id,
			network_name,
			network_profile_path
		]);
		explorerListener.send('Successfully send a message to child process');
		this.explorerListeners.push(explorerListener);
		/* eslint-enable */
	}

	/**
	 *
	 *
	 * @memberof Platform
	 */
	setPersistenceService() {
		// Setting platform specific CRUDService and MetricService
		this.persistence.setMetricService(
			new MetricService(this.persistence.getPGService())
		);
		this.persistence.setCrudService(
			new CRUDService(this.persistence.getPGService())
		);
		this.persistence.setUserDataService(
			new UserDataService(this.persistence.getPGService())
		);
	}

	getSyncWorkDir() {
		return this.syncConfig.workdir;
	}

	getNetworkPorfilePath(network_id:string) {
		return path.join(this.getSyncWorkDir(),network_id);
	}

	/**
	 *
	 *
	 * @returns
	 * @memberof Platform
	 */
	getNetworks() {
		return this.networks;
	}

	/**
	 *
	 *
	 * @returns
	 * @memberof Platform
	 */
	getNetwork(network_id) {
		this.networks.get(network_id || this.defaultNetwork);
	}

	/**
	 *
	 *
	 * @param {*} network_id
	 * @returns
	 * @memberof Platform
	 */
	getClient(network_id) {
		logger.info(`getClient (id:${network_id})`);
		const clientObj = this.networks.get(network_id || this.defaultNetwork);
		if(clientObj){
			return clientObj.instance
		}
		return null;
	}

	/**
	 *
	 *
	 * @returns
	 * @memberof Platform
	 */
	getPersistence() {
		return this.persistence;
	}

	/**
	 *
	 *
	 * @returns
	 * @memberof Platform
	 */
	getBroadcaster() {
		return this.broadcaster;
	}

	/**
	 *
	 *
	 * @returns
	 * @memberof Platform
	 */
	getProxy() {
		return this.proxy;
	}

	/**
	 *
	 *
	 * @memberof Platform
	 */
	async destroy() {
		logger.info(
			'<<<<<<<<<<<<<<<<<<<<<<<<<< Closing explorer  >>>>>>>>>>>>>>>>>>>>>'
		);
		for (const explorerListener of this.explorerListeners) {
			explorerListener.close();
		}
	}
}
