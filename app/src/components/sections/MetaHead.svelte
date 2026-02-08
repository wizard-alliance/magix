<script lang="ts">
	import { page } from "$app/stores"

	// app-level meta (static, SSR-safe)
	$: appName = app.Meta.app.name
	$: appColor = app.Meta.app.color
	$: appUrl = app.Meta.app.url

	// page-level meta (from page.ts load data — SSR-safe via $page.data)
	$: pageTitle = $page.data.title || `Loading...`
	$: fullTitle = `${appName} - ${pageTitle}`
	$: description = $page.data.description || app.Meta.app.description || ``
	$: seo = $page.data.seo || {}

	// URL: prefer canonical if set, otherwise derive from current path
	$: canonical = seo.canonical ? `${appUrl}${seo.canonical}` : `${appUrl}${$page.url.pathname}`
	$: noindex = seo.noindex ?? false
	$: robots = seo.robots || (noindex ? `noindex, nofollow` : ``)
	$: ogTitle = seo.ogTitle || fullTitle
	$: ogDescription = seo.ogDescription || description
	$: ogImage = seo.ogImage ? `${appUrl}${seo.ogImage}` : app.Meta.app.ogImage ? `${appUrl}${app.Meta.app.ogImage}` : ``
	$: twitterCard = seo.twitterCard || (ogImage ? `summary_large_image` : `summary`)
	$: locale = seo.locale || `en_US`
</script>

<svelte:head>
	<title>{fullTitle}</title>

	{#if description}
		<meta name="description" content={description} />
	{/if}

	{#if robots}
		<meta name="robots" content={robots} />
	{/if}

	<link rel="canonical" href={canonical} />

	{#if appColor}
		<meta name="theme-color" content={appColor} />
	{/if}

	<!-- Open Graph -->
	<meta property="og:type" content="website" />
	<meta property="og:locale" content={locale} />
	<meta property="og:title" content={ogTitle} />
	{#if ogDescription}
		<meta property="og:description" content={ogDescription} />
	{/if}
	{#if ogImage}
		<meta property="og:image" content={ogImage} />
	{/if}
	<meta property="og:url" content={canonical} />
	<meta property="og:site_name" content={appName} />

	<!-- Twitter -->
	<meta name="twitter:card" content={twitterCard} />
	<meta name="twitter:title" content={ogTitle} />
	{#if ogDescription}
		<meta name="twitter:description" content={ogDescription} />
	{/if}
	{#if ogImage}
		<meta name="twitter:image" content={ogImage} />
	{/if}
</svelte:head>
