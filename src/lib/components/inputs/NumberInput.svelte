<script lang="ts">
	import { getContext } from 'svelte';
	import { TRANSLATE_KEY, type TranslateFn } from '../../types.js';

	interface Props {
		value?: number | undefined;
		onchange?: (value: number | undefined) => void;
		name?: string;
		label?: string;
		min?: number;
		max?: number;
		step?: number;
		placeholder?: string;
		unit?: string;
		warning?: boolean;
	}

	let { value = $bindable(), onchange, name = 'number', label, min, max, step, placeholder, unit, warning = false }: Props = $props();

	const t = getContext<TranslateFn | undefined>(TRANSLATE_KEY);
	const translate = (key: string) => t ? t(key) : key;

	function handleInput(e: Event) {
		const input = e.target as HTMLInputElement;
		const raw = input.value;
		if (raw === '') {
			value = undefined;
			onchange?.(undefined);
			return;
		}
		let num = parseFloat(raw);
		if (isNaN(num)) return;
		if (min !== undefined && num < min) num = min;
		if (max !== undefined && num > max) num = max;
		value = num;
		onchange?.(num);
	}
</script>

<div>
	{#if label}
		<label for={name} class="block text-sm/6 font-medium text-gray-900">{translate(label)}</label>
	{/if}
	<div class="mt-2 relative" class:ring-2={warning} class:ring-red-300={warning} class:rounded-md={warning}>
		<input
			type="number"
			{name}
			id={name}
			{min}
			{max}
			{step}
			value={value ?? ''}
			{placeholder}
			onchange={handleInput}
			class="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6 {unit ? 'pr-12' : ''}"
		/>
		{#if unit}
			<div class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
				<span class="text-gray-500 sm:text-sm">{translate(unit)}</span>
			</div>
		{/if}
	</div>
</div>
