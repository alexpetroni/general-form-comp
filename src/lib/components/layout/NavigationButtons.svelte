<script lang="ts">
	import { getContext } from 'svelte';
	import { TRANSLATE_KEY, type TranslateFn } from '../../types.js';

	interface Props {
		showBack?: boolean;
		showNext?: boolean;
		nextLabel?: string;
		backLabel?: string;
		onback?: () => void;
		onnext?: () => void;
	}

	let { showBack = true, showNext = true, nextLabel = 'Next', backLabel = 'Back', onback, onnext }: Props = $props();

	const t = getContext<TranslateFn | undefined>(TRANSLATE_KEY);
	const translate = (key: string) => t ? t(key) : key;
</script>

<div class="flex justify-between pt-6 border-t border-gray-200 mt-8">
	<div>
		{#if showBack}
			<button
				type="button"
				onclick={onback}
				class="rounded-md bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-xs ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
			>
				{translate(backLabel)}
			</button>
		{/if}
	</div>
	<div>
		{#if showNext}
			<button
				type="button"
				onclick={onnext}
				class="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-xs hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
			>
				{translate(nextLabel)}
			</button>
		{/if}
	</div>
</div>
