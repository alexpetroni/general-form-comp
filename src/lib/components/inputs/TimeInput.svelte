<script lang="ts">
	import { getContext } from 'svelte';
	import { TRANSLATE_KEY, type TranslateFn } from '../../types.js';

	interface Props {
		value?: string | undefined;
		onchange?: (value: string) => void;
		name?: string;
		label?: string;
		step?: number;
		placeholder?: string;
		warning?: boolean;
	}

	let { value = $bindable(), onchange, name = 'time', label, step = 900, placeholder, warning = false }: Props = $props();

	const t = getContext<TranslateFn | undefined>(TRANSLATE_KEY);
	const translate = (key: string) => t ? t(key) : key;

	function roundToStep(timeStr: string): string {
		if (!timeStr || step <= 0) return timeStr;
		const [h, m] = timeStr.split(':').map(Number);
		const stepMinutes = Math.floor(step / 60);
		if (stepMinutes <= 0) return timeStr;
		const rounded = Math.round(m / stepMinutes) * stepMinutes;
		const finalM = rounded % 60;
		const extraH = Math.floor(rounded / 60);
		const finalH = (h + extraH) % 24;
		return `${String(finalH).padStart(2, '0')}:${String(finalM).padStart(2, '0')}`;
	}

	function handleChange(e: Event) {
		const input = e.target as HTMLInputElement;
		const rounded = roundToStep(input.value);
		value = rounded;
		input.value = rounded;
		onchange?.(rounded);
	}
</script>

<div>
	{#if label}
		<label for={name} class="block text-sm/6 font-medium text-gray-900">{translate(label)}</label>
	{/if}
	<div class="mt-2" class:ring-2={warning} class:ring-red-300={warning} class:rounded-md={warning}>
		<input
			type="time"
			{name}
			id={name}
			{step}
			value={value ?? ''}
			{placeholder}
			onchange={handleChange}
			class="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
		/>
	</div>
</div>
