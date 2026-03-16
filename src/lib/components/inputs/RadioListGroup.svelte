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
	}

	let { options, value = $bindable(), onchange, name = 'radio', label, warning = false }: Props = $props();

	const t = getContext<TranslateFn | undefined>(TRANSLATE_KEY);
	const translate = (key: string) => t ? t(key) : key;

	function handleChange(optionValue: string) {
		value = optionValue;
		onchange?.(optionValue);
	}
</script>

<fieldset aria-label={label ? translate(label) : undefined}>
	<div class="space-y-5" class:ring-2={warning} class:ring-red-300={warning} class:rounded-lg={warning} class:p-4={warning}>
		{#each options as option (option.value)}
			{@const checked = value === option.value}
			{@const id = `${name}-${option.value}`}
			<div class="relative flex items-start">
				<div class="flex h-6 items-center">
					<input
						{id}
						aria-describedby={option.description ? `${id}-desc` : undefined}
						{name}
						type="radio"
						{checked}
						onchange={() => handleChange(option.value)}
						class="relative size-4 appearance-none rounded-full border border-gray-300 bg-white before:absolute before:inset-1 before:rounded-full before:bg-white not-checked:before:hidden checked:border-indigo-600 checked:bg-indigo-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 forced-colors:appearance-auto forced-colors:before:hidden"
					/>
				</div>
				<div class="ml-3 text-sm/6">
					<label for={id} class="font-medium text-gray-900">{translate(option.label)}</label>
					{#if option.description}
						<p id="{id}-desc" class="text-gray-500">{translate(option.description)}</p>
					{/if}
				</div>
			</div>
		{/each}
	</div>
</fieldset>
