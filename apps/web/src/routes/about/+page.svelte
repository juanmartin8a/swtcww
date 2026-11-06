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
		<h1>SWTCWW - 'Star Wars: The Clone Wars' Wisdom</h1>
		<p>
			Recreating the opening quotes from one of my favorite shows, <em>Star Wars: The Clone Wars</em
			> :)
		</p>
		<p>
			This project is meant to be a convenient way for fans like me to revisit the iconic opening
			quotes and remember the show, while hopefully sharing some of its wisdom with people who
			haven't watched it yet.
		</p>
		<h2>Details</h2>
		<p>
			I haven't had the time to precisely reverse-engineer the opening quotes, so instead, I did
			some research and used tools to approximate their appearance.
		</p>
		<h3>Font</h3>
		<p>
			I couldn't find any reliable information about the typeface used for <em>The Clone Wars'</em>
			opening quotes, so I turned to the films' opening line, "A long time ago in a galaxy far, far away....",
			because of its similarity. I came across several possible typefaces, including
			<a href="https://www.myfonts.com/collections/trade-gothic-font-linotype">Trade Gothic</a>,
			<a href="https://fonts.adobe.com/fonts/news-gothic">News Gothic</a>, and
			<a href="https://learn.microsoft.com/en-us/typography/font-list/franklin-gothic"
				>Franklin Gothic</a
			>, with Trade Gothic and Franklin Gothic being close visual matches to the show's opening
			quotes.
		</p>
		<p>
			I ended up going with <a href="https://github.com/impallari/Libre-Franklin">Libre Franklin</a
			>, an open-source interpretation of Franklin Gothic (also similar to Trade Gothic), because
			I'm broke. I use its regular weight (400) to match the lettering as closely as possible. The
			font size scales with the device's screen size to maintain similar proportions across devices.
		</p>
		<p>I'm no typography <em>connoisseur</em>, so this was more of an informed visual guess.</p>
		<h3>Text color</h3>
		<p>
			For the blue lettering, I used the eyedropper in the browser's DevTools panel on an actual
			screenshot from the show to try to match the color as closely as possible. The quotes use <code
				>#1379a6</code
			>, my screenshot-based approximation of the original blue.
		</p>
		<h3>Background</h3>
		<p>
			I used the same eyedropper on the screenshot's black background. The site uses <code
				>#000000</code
			> to recreate it, again based on that screenshot rather than an official color specification.
		</p>
		<h2>Sources</h2>
		<h3>Quotes and Episode Information</h3>
		<p>
			The opening quotes and their corresponding episode information were sourced from <a
				href="https://en.wikiquote.org/wiki/Star_Wars:_The_Clone_Wars">Wikiquote</a
			>.
		</p>
		<ol>
			<li>
				<a href="https://en.wikiquote.org/wiki/Star_Wars:_The_Clone_Wars"
					>Wikiquote — Star Wars: The Clone Wars</a
				>
			</li>
		</ol>
		<h3>A long time ago in a galaxy far, far away....</h3>
		<p>
			The following sources were consulted while researching the typefaces used in <em>Star Wars</em
			>, particularly those used for the films' opening line, "A long time ago in a galaxy far, far
			away....", which served as a visual reference for recreating <em>The Clone Wars</em>' opening
			quotes.
		</p>
		<ol>
			<li>
				<a href="https://www.dafont.com/forum/read/527904/in-a-far-far-away-galaxy"
					>DaFont — In a Far Far Away Galaxy</a
				>
			</li>
			<li>
				<a href="https://starwarsviscomp.wordpress.com/2019/11/16/alta-preface-changes/"
					>Star Wars Visual Comparisons — “A Long Time Ago” Preface Changes</a
				>
			</li>
			<li>
				<a href="https://jackyan.com/blog/2015/12/remarks-on-the-typography-of-star-wars/"
					>Jack Yan — Remarks on the Typography of Star Wars</a
				>
			</li>
			<li>
				<a href="https://typographica.org/on-typography/may-the-type-be-with-you/"
					>Typographica — May the Type Be With You</a
				>
			</li>
			<li>
				<a href="https://www.theforce.net/fanfilms/postproduction/crawl/opening.asp"
					>TheForce.Net — Opening Crawl</a
				>
			</li>
			<li>
				<a
					href="https://office-watch.com/2023/star-wars-movie-opening-and-end-credits-in-powerpoint/"
					>Office Watch — Star Wars Movie Opening and End Credits</a
				>
			</li>
			<li>
				<a
					href="https://www.dafont.com/forum/read/271197/a-long-time-ago-in-a-galaxy-far-far-away-2015-title-card-font-please"
					>DaFont — A Long Time Ago in a Galaxy Far, Far Away: 2015 Title Card Font</a
				>
			</li>
			<li>
				<a href="https://www.reddit.com/r/StarWars/comments/uwtzjz/star_wars_fonts/"
					>Reddit — Star Wars Fonts</a
				>
			</li>
			<li>
				<a href="https://www.designyourway.net/blog/what-font-does-star-wars-use/"
					>DesignYourWay — What Font Does Star Wars Use?</a
				>
			</li>
		</ol>
		<h2>Contributions</h2>
		<p>Contributions are welcome :)</p>
		<p>
			<a href="https://github.com/juanmartin8a/swtcww">https://github.com/juanmartin8a/swtcww</a>
		</p>
		<a href={resolve('/')}><span class="action-label">Back to the quotes</span></a>
	</article>
</main>

<style>
	.about-screen {
		display: flex;
		min-height: 100svh;
		align-items: center;
		padding: 8rem 10vw;
		color: var(--color-quote);
	}

	article {
		width: 100%;
		max-width: 40rem;
		margin: 0 auto;
	}

	h1 {
		margin-bottom: 2rem;
	}

	h2 {
		margin-top: 3rem;
		margin-bottom: 1rem;
	}

	h3 {
		margin-top: 2rem;
		margin-bottom: 0.75rem;
	}

	ol {
		padding-left: 1.5rem;
		list-style: decimal;
		overflow-wrap: anywhere;
	}

	li + li {
		margin-top: 0.75rem;
	}

	p,
	ol {
		margin-bottom: 1.5rem;
		font-size: clamp(1rem, 2vw, 1.125rem);
		line-height: 1.7;
	}

	a {
		text-decoration: underline;
	}

	article > a {
		display: inline-block;
		margin-top: 1rem;
		color: var(--color-episode);
		font-size: 0.875rem;
		letter-spacing: 0.04em;
		text-decoration: none;
	}
</style>
