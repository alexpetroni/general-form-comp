<script lang="ts">
	import type { Snippet } from 'svelte';
	import { getContext } from 'svelte';
	import { TRANSLATE_KEY, type TranslateFn } from '../../types.js';

	interface Props {
		id: string;
		label?: string;
		warning?: boolean;
		children: Snippet;
	}

	let { id, label, warning = false, children }: Props = $props();

	const t = getContext<TranslateFn | undefined>(TRANSLATE_KEY);
	const translate = (key: string) => t ? t(key) : key;
</script>

<div {id} class="scroll-mt-8">
	{#if label}
		<h3 class="text-base font-semibold text-gray-900 mb-4">{translate(label)}</h3>
	{/if}
	<div
		class="transition-all duration-200 rounded-lg {warning ? 'ring-2 ring-red-300 bg-red-50/50 p-4' : ''}"
	>
		{@render children()}
	</div>
</div>
