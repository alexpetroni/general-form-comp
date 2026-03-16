<script lang="ts">
	import type { Snippet } from 'svelte';
	import { getContext } from 'svelte';
	import { TRANSLATE_KEY, type TranslateFn } from '../../types.js';

	interface Props {
		title?: string;
		intro?: string;
		children: Snippet;
	}

	let { title, intro, children }: Props = $props();

	const t = getContext<TranslateFn | undefined>(TRANSLATE_KEY);
	const translate = (key: string) => t ? t(key) : key;
</script>

<div class="space-y-8">
	{#if title || intro}
		<div class="mb-6">
			{#if title}
				<h2 class="text-xl font-bold text-gray-900">{translate(title)}</h2>
			{/if}
			{#if intro}
				<p class="mt-2 text-sm text-gray-600">{translate(intro)}</p>
			{/if}
		</div>
	{/if}
	{@render children()}
</div>
