import { defineEnvVars } from '@sveltejs/kit/env';

export const variables = defineEnvVars({
	TURSO_DATABASE_URL: {},
	TURSO_TOKEN: {}
});
