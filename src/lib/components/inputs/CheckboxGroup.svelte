<script lang="ts">
	import { getContext } from 'svelte';
	import { TRANSLATE_KEY, type TranslateFn, type QuestionOption } from '../../types.js';

	interface Props {
		options: QuestionOption[];
		value?: string[];
		onchange?: (value: string[]) => void;
		name?: string;
		label?: string;
		warning?: boolean;
	}

	let { options, value = $bindable([]), onchange, name = 'checkbox', label, warning = false }: Props = $props();

	const t = getContext<TranslateFn | undefined>(TRANSLATE_KEY);
	const translate = (key: string) => t ? t(key) : key;

	function handleToggle(optionValue: string, exclusive?: boolean) {
		let next: string[];

		if (exclusive) {
			// Exclusive option: if already selected, deselect; otherwise select only this
			next = value.includes(optionValue) ? [] : [optionValue];
		} else {
			// Remove any exclusive options first
			const exclusiveValues = options.filter((o) => o.exclusive).map((o) => o.value);
			const current = value.filter((v) => !exclusiveValues.includes(v));

			if (current.includes(optionValue)) {
				next = current.filter((v) => v !== optionValue);
			} else {
				next = [...current, optionValue];
			}
		}

		value = next;
		onchange?.(next);
	}
</script>

<fieldset aria-label={label ? translate(label) : undefined}>
	<div class="space-y-5" class:ring-2={warning} class:ring-red-300={warning} class:rounded-lg={warning} class:p-4={warning}>
		{#each options as option (option.value)}
			{@const checked = value.includes(option.value)}
			{@const id = `${name}-${option.value}`}
			<div class="flex gap-3">
				<div class="flex h-6 shrink-0 items-center">
					<div class="group grid size-4 grid-cols-1">
						<input
							{id}
							aria-describedby={option.description ? `${id}-desc` : undefined}
							name="{name}[]"
							type="checkbox"
							{checked}
							onchange={() => handleToggle(option.value, option.exclusive)}
							class="col-start-1 row-start-1 appearance-none rounded-sm border border-gray-300 bg-white checked:border-indigo-600 checked:bg-indigo-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 forced-colors:appearance-auto"
						/>
						<svg class="pointer-events-none col-start-1 row-start-1 size-3.5 self-center justify-self-center stroke-white" viewBox="0 0 14 14" fill="none">
							<path class="opacity-0 group-has-checked:opacity-100" d="M3 8L6 11L11 3.5" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
						</svg>
					</div>
				</div>
				<div class="text-sm/6">
					<label for={id} class="font-medium text-gray-900">{translate(option.label)}</label>
					{#if option.description}
						<p id="{id}-desc" class="text-gray-500">{translate(option.description)}</p>
					{/if}
				</div>
			</div>
		{/each}
	</div>
</fieldset>
