<script lang="ts">
	import { resolve } from '$app/paths';
</script>

<svelte:head>
	<title>About · SWTCWW</title>
	<meta
		name="description"
		content="A project inspired by the opening quotes of Star Wars: The Clone Wars."
	/>
</svelte:head>

<main class="about-screen font-clone-wars">
	<article>
		<p>
			This project aims to recreate the opening quotes from my favorite show Star Wars: The Clone
			Wars, from the iconic blue lettering and typography to their placement against a black
			background just like in the show :)
		</p>
		<p>
			This is done as a convenient way for fans like me to see the quotes and remember the show, and
			also to hopefully bring the wisdom from the intro quotes to people who haven't watched it
			yet.
		</p>
		<section aria-labelledby="details-heading">
			<h2 id="details-heading">Details</h2>
			<h3>Font</h3>
			<p>
				I suspect the original font is Franklin Gothic, based on
				<a href="https://jackyan.com/blog/2015/12/remarks-on-the-typography-of-star-wars/">
					Jack Yan's notes on Star Wars typography</a
				>
				and
				<a href="https://www.theforce.net/fanfilms/postproduction/crawl/opening.asp">
					TheForce.Net's guide to recreating the opening text</a
				>, which identify it in the films' opening text "A long time ago in a galaxy far far away...". Since these references cover the films rather
				than The Clone Wars' quote cards, I treat this as a best guess.
			</p>
			<p>
				To recreate that look, I chose
				<a href="https://github.com/impallari/Libre-Franklin">Libre Franklin</a>, an open-source
				interpretation of Franklin Gothic. I use its regular weight (400) to match the lettering as
				closely as possible. The font size scales with your screen: 5% of the viewport width or 8% of
				its small viewport height, whichever is smaller (<code>min(5vw, 8svh)</code>), to keep similar
				proportions across devices.
			</p>
			<h3>Text color</h3>
			<p>
				For the blue letters, I used the eyedropper in the browser's DevTools
				panel on an actual screenshot from the show to try to match the color as closely
				as possible. The quotes use <code>#1379a6</code>, my screenshot-based approximation of the
				original blue.
			</p>
			<h3>Background</h3>
			<p>
				I used the same eyedropper on the screenshot's black background. The site uses
				<code>#000000</code> to recreate it, again based on that screenshot rather than an official color
				specification.
			</p>
		</section>
		<a href={resolve('/')}>Back to the quotes</a>
	</article>
</main>

<style>
	.about-screen {
		display: flex;
		min-height: 100svh;
		align-items: center;
		padding: 8rem 10vw;
		color: #1379a6;
	}

	article {
		width: 100%;
		max-width: 40rem;
		margin: 0 auto;
	}

	section {
		margin-top: 3rem;
	}

	h2 {
		font-size: 1.75rem;
		font-weight: 400;
		color: #fefd02;
	}

	h3 {
		margin-top: 2rem;
		margin-bottom: 0.75rem;
		font-size: 1.125rem;
		font-weight: 500;
		color: #fefd02;
	}

	p {
		margin-bottom: 1.5rem;
		font-size: clamp(1rem, 2vw, 1.125rem);
		line-height: 1.7;
	}

	a {
		text-decoration: underline;
		text-underline-offset: 0.25em;
	}

	article > a {
		display: inline-block;
		margin-top: 1rem;
		color: #fefd02;
		font-size: 0.875rem;
		letter-spacing: 0.04em;
		text-decoration: none;
	}

	a:hover {
		text-decoration: underline;
		text-underline-offset: 0.25em;
	}

	a:focus-visible {
		outline: 1px solid currentColor;
		outline-offset: 6px;
	}
</style>
