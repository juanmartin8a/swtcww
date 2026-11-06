<script lang="ts">
	import './layout.css';
	import favicon from '#lib/assets/favicon.png';
	import { resolve } from '$app/paths';

	let { children } = $props();
</script>

<svelte:head>
	<title>SWTCWW</title>
	<link rel="icon" href={favicon} />
</svelte:head>

<header class="site-header font-clone-wars">
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
		transition: opacity 250ms ease;
	}

	.site-header:hover,
	.site-header:focus-within {
		opacity: 1;
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
	}
</style>
