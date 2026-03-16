<script lang="ts">
	import { getContext } from 'svelte';
	import { TRANSLATE_KEY, type TranslateFn } from '../../types.js';

	interface Props {
		min?: number;
		max?: number;
		value?: number | undefined;
		onchange?: (value: number) => void;
		name?: string;
		minLabel?: string;
		maxLabel?: string;
		warning?: boolean;
	}

	let { min = 1, max = 10, value = $bindable(), onchange, name = 'scale', minLabel, maxLabel, warning = false }: Props = $props();

	const t = getContext<TranslateFn | undefined>(TRANSLATE_KEY);
	const translate = (key: string) => t ? t(key) : key;

	function handleSelect(n: number) {
		value = n;
		onchange?.(n);
	}

	const numbers = $derived(Array.from({ length: max - min + 1 }, (_, i) => min + i));
</script>

<fieldset aria-label={name}>
	<div
		class="flex flex-col gap-2"
		class:ring-2={warning}
		class:ring-red-300={warning}
		class:rounded-lg={warning}
		class:p-3={warning}
	>
		<div class="flex flex-wrap gap-2 justify-center">
			{#each numbers as n (n)}
				{@const selected = value === n}
				<label class="flex cursor-pointer items-center justify-center rounded-full size-10 text-sm font-semibold focus-within:outline-hidden {selected ? 'bg-indigo-600 text-white ring-2 ring-indigo-600' : 'ring-1 ring-inset ring-gray-300 bg-white text-gray-900 hover:bg-gray-50'}">
					<input
						type="radio"
						{name}
						value={n}
						checked={selected}
						onchange={() => handleSelect(n)}
						class="sr-only"
					/>
					<span>{n}</span>
				</label>
			{/each}
		</div>
		{#if minLabel || maxLabel}
			<div class="flex justify-between text-xs text-gray-500 px-1">
				<span>{minLabel ? translate(minLabel) : ''}</span>
				<span>{maxLabel ? translate(maxLabel) : ''}</span>
			</div>
		{/if}
	</div>
</fieldset>
