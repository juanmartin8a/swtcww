import { building } from '$app/env';
import { defineEnvVars } from '@sveltejs/kit/env';

function runtimeSecret(value: string | undefined): string {
	// Cloudflare supplies secrets at runtime, not in the Git build environment.
	if (!value?.trim() && !building) throw new Error('A non-empty runtime secret is required.');
	return value ?? '';
}

export const variables = defineEnvVars({
	TURSO_DATABASE_URL: { schema: runtimeSecret },
	TURSO_TOKEN: { schema: runtimeSecret }
});
