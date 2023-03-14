/* eslint-disable spellcheck/spell-checker */
import * as urllib from 'urllib';
import { RequestOptions, IncomingHttpHeaders } from 'urllib';
import { helper } from '../../common/helper';
import oidcConfig from './config';

const logger = helper.getLogger('oidc');

const callBcApi = async (token: string, options?: RequestOptions) => {
	const { u4aUrl } = oidcConfig;
	const headers: IncomingHttpHeaders = {
		'content-type': 'application/json',
		Authorization: `bearer ${token}`
	};
	const reqUrl = u4aUrl + '/bc-apis/bff';
	logger.debug('callBcApi => url:', reqUrl);
	logger.debug('callBcApi => options:', options);
	const defaultOptions: RequestOptions = {
		method: 'POST',
		rejectUnauthorized: false,
		dataType: 'json',
		timeout: 10 * 1000,
		headers
	};
	const res = await urllib.request(
		reqUrl,
		Object.assign({}, defaultOptions, options)
	);
	if (res.status >= 400) {
		throw res;
	}
	return res.data;
};

export const getNetworks = (token: string) => {
	const query = `
  query getNetworks{
    networks {
      name
      creationTimestamp
      lastHeartbeatTime
      expiredTime
      federation
      clusterSize
      ordererType
      organizations {
        name
        admin
      }
      initiator {
        name
        admin
      }
      status
      channels {
        name
        createdByMe
        iamInvolved
      }
      peers {
        name
        createdByMe
      }
    }
  }`;
	return callBcApi(token, { data: { query, operationName: 'getNetworks' } });
};

export const getNetwork = (token: string, name: string) => {
	const query = `
query getNetwork($name: String!) {
  network(name: $name) {
    name
    description
    creationTimestamp
    lastHeartbeatTime
    expiredTime
    federation
    clusterSize
    ordererType
    version
    storage
    limits {
      cpu
      memory
    }
    organizations {
      name
      displayName
      admin
      creationTimestamp
      lastHeartbeatTime
      status
      reason
      ibppeers {
        name
      }
    }
    initiator {
      name
    	admin
    }
    status
    peers {
      name
      createdByMe
    }
    channels {
      name
      members{
        name
      }
      peers {
        name
        namespace
      }
      creationTimestamp
      status
      createdByMe
      iamInvolved
    }
  }
}`;
	return callBcApi(token, {
		data: {
			query,
			operationName: 'getNetwork',
			variables: { name }
		}
	});
};
