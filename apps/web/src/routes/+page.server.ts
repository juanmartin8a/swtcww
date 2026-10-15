import { TURSO_DATABASE_URL, TURSO_TOKEN } from '$app/env/private';
import { createClient } from '@libsql/client/web';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const prerender = false;

export const load: PageServerLoad = async ({ setHeaders }) => {
	setHeaders({ 'cache-control': 'no-store' });

	// Use HTTP so the database client also works in Cloudflare Workers.
	const client = createClient({
		url: TURSO_DATABASE_URL.replace(/^libsql:/, 'https:'),
		authToken: TURSO_TOKEN
	});

	let quotation;

	try {
		const result = await client.execute(`
			SELECT quotation
			FROM opening_quotations
			WHERE quotation IS NOT NULL AND length(trim(quotation)) > 0
			ORDER BY random()
			LIMIT 1
		`);
		quotation = result.rows[0]?.quotation;
	} catch {
		error(503, 'Unable to load a quote right now. Please refresh to try again.');
	} finally {
		client.close();
	}

	if (typeof quotation !== 'string' || !quotation.trim()) {
		error(404, 'No quotes are available yet.');
	}

	return { quotation };
};
