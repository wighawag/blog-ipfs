<script context="module">
	export function preload({ params, query }) {
		return this.fetch(`blog.json`).then(r => r.json()).then(posts => {
			return { posts };
		});
	}
</script>

<script>
	export let posts;
</script>

<style>
	ul {
		margin: 0 0 1em 1em;
		line-height: 2;
		font-size: large;
	}
</style>

<svelte:head>
	<title>Blog</title>
</svelte:head>


<h1>Welcome</h1>
<hr/>
<br/>
{#if posts.length == 0}
	<h2>Nothing to see here yet, stay tuned!</h2>
{:else}
	{#if posts.length == 1}
	<h2>Here is the most recent post:</h2>
	{:else}
	<h2>Here are some recent posts:</h2>
	{/if}
	<ul>
		{#each posts as post}
			<!-- we're using the non-standard `rel=prefetch` attribute to
					tell Sapper to load the data for the page as soon as
					the user hovers over the link or taps it, instead of
					waiting for the 'click' event -->
			<li><a rel='prefetch' href='blog/{post.slug}'>{post.title}</a></li>
		{/each}
	</ul>
{/if}

