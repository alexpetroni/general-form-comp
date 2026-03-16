<script lang="ts">
	import { getContext } from 'svelte';
	import { TRANSLATE_KEY, type TranslateFn, type QuestionOption } from '../../types.js';

	interface Props {
		options: QuestionOption[];
		value?: string | undefined;
		onchange?: (value: string) => void;
		name?: string;
		label?: string;
		warning?: boolean;
		columns?: 1 | 2 | 3;
	}

	let { options, value = $bindable(), onchange, name = 'radio-card', label, warning = false, columns = 3 }: Props = $props();

	const t = getContext<TranslateFn | undefined>(TRANSLATE_KEY);
	const translate = (key: string) => t ? t(key) : key;

	function handleSelect(optionValue: string) {
		value = optionValue;
		onchange?.(optionValue);
	}

	const gridCols: Record<number, string> = {
		1: 'sm:grid-cols-1',
		2: 'sm:grid-cols-2',
		3: 'sm:grid-cols-3'
	};
</script>

<fieldset>
	{#if label}
		<legend class="text-sm/6 font-semibold text-gray-900">{translate(label)}</legend>
	{/if}
	<div
		class="mt-4 grid grid-cols-1 gap-y-6 {gridCols[columns]} sm:gap-x-4"
		class:ring-2={warning}
		class:ring-red-300={warning}
		class:rounded-lg={warning}
		class:p-2={warning}
	>
		{#each options as option (option.value)}
			{@const checked = value === option.value}
			<label
				aria-label={translate(option.label)}
				title={option.description ? translate(option.description) : undefined}
				class="relative flex cursor-pointer rounded-lg border bg-white p-4 shadow-xs focus-within:outline-hidden {checked ? 'border-indigo-600 ring-2 ring-indigo-600' : 'border-gray-300'}"
			>
				<input
					type="radio"
					{name}
					value={option.value}
					checked={checked}
					onchange={() => handleSelect(option.value)}
					class="sr-only"
				/>
				<span class="flex flex-1">
					<span class="flex flex-col">
						<span class="block text-sm font-medium text-gray-900">{translate(option.label)}</span>
						{#if option.description}
							<span class="mt-1 flex items-center text-sm text-gray-500">{translate(option.description)}</span>
						{/if}
					</span>
				</span>
				<svg class="size-5 text-indigo-600 {checked ? '' : 'invisible'}" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
					<path fill-rule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z" clip-rule="evenodd" />
				</svg>
				<span class="pointer-events-none absolute -inset-px rounded-lg {checked ? 'border-2 border-indigo-600' : 'border-2 border-transparent'}" aria-hidden="true"></span>
			</label>
		{/each}
	</div>
</fieldset>
