<script lang="ts">
	import { getContext } from 'svelte';
	import { TRANSLATE_KEY, type TranslateFn } from '../../types.js';

	interface Props {
		value?: string | undefined;
		onchange?: (value: string) => void;
		name?: string;
		label?: string;
		placeholder?: string;
		rows?: number;
		warning?: boolean;
	}

	let { value = $bindable(), onchange, name = 'textarea', label, placeholder, rows = 4, warning = false }: Props = $props();

	const t = getContext<TranslateFn | undefined>(TRANSLATE_KEY);
	const translate = (key: string) => t ? t(key) : key;

	function handleInput(e: Event) {
		const el = e.target as HTMLTextAreaElement;
		value = el.value;
		onchange?.(el.value);
	}
</script>

<div>
	{#if label}
		<label for={name} class="block text-sm/6 font-medium text-gray-900">{translate(label)}</label>
	{/if}
	<div class="mt-2" class:ring-2={warning} class:ring-red-300={warning} class:rounded-md={warning}>
		<textarea
			{name}
			id={name}
			{rows}
			{placeholder}
			oninput={handleInput}
			class="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
		>{value ?? ''}</textarea>
	</div>
</div>
