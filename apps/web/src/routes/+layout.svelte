<script lang="ts">
	import './layout.css';
	import favicon from '#lib/assets/favicon.png';
	import { resolve } from '$app/paths';
	import { setContext } from 'svelte';
	import { createHologram, HOLOGRAM_CONTEXT } from '#lib/hologram.js';

	let { children } = $props();

	const hologram = createHologram();
	setContext(HOLOGRAM_CONTEXT, hologram);
</script>

<svelte:head>
	<title>SWTCWW</title>
	<link rel="icon" href={favicon} />
</svelte:head>

<header class="site-header font-clone-wars" {@attach hologram.register}>
	<nav aria-label="Main navigation">
		<a href={resolve('/about')}><span class="action-label">About</span></a>
	</nav>
</header>

{@render children()}

<style>
	.site-header {
		position: fixed;
		z-index: 10;
		top: 0;
		left: 0;
		width: 100%;
		padding: 1.5rem 10vw;
		background: var(--color-background);
		color: var(--color-quote);
		text-align: right;
		opacity: 0;
		transition: opacity 1500ms linear;
	}

	.site-header:hover,
	.site-header:focus-within {
		/* Keep navigation visible while the user is interacting with it. */
		opacity: 1 !important;
		transition-duration: 250ms;
	}

	a {
		display: inline-block;
		font-size: 0.875rem;
		line-height: 22px;
		letter-spacing: 0.04em;
	}

	@media (prefers-reduced-motion: reduce) {
		.site-header {
			transition: none;
		}

		:global(:where(body:has(.quote-screen.ready))) .site-header {
			opacity: 1;
		}
	}
</style>
