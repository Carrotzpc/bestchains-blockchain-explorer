/* eslint-disable spellcheck/spell-checker */

const { env } = process;

const u4aUrl = env.U4A_URL || 'https://portal.172.22.96.209.nip.io';

const oidcConfig = {
	u4aUrl,
	server: {
		url: u4aUrl + '/oidc'
	},
	client: {
		client_id: env.OIDC_SERVER_CLIENT_ID || 'bff-client',
		client_secret:
			env.OIDC_SERVER_CLIENT_SECRET || '61324af0-1234-4f61-b110-ef57013267d6',
		redirect_uri: env.OIDC_REDIRECT_URL || 'http://localhost:8080/oidc/callback'
	}
};
export default oidcConfig;
