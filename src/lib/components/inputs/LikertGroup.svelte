<script lang="ts">
	import { getContext } from 'svelte';
	import {
		TRANSLATE_KEY, FORM_STATE_KEY, STEP_ID_KEY,
		type TranslateFn, type FormStateAdapter, type Question
	} from '../../types.js';

	interface Props {
		questions: Question[];
		warning?: boolean;
	}

	let { questions, warning = false }: Props = $props();

	const t = getContext<TranslateFn | undefined>(TRANSLATE_KEY);
	const state = getContext<FormStateAdapter>(FORM_STATE_KEY);
	const stepId = getContext<string>(STEP_ID_KEY);

	const translate = (key: string) => t ? t(key) : key;

	// Derive scale options from first question (all should share same options)
	const scaleOptions = $derived(questions[0]?.options ?? []);

	function getQuestionValue(questionId: string): string | undefined {
		return state.getResponse(stepId, questionId) as string | undefined;
	}

	function setQuestionValue(questionId: string, value: string) {
		state.setResponse(stepId, questionId, value);
	}
</script>

<div
	class="space-y-4"
	class:ring-2={warning}
	class:ring-red-300={warning}
	class:rounded-lg={warning}
	class:p-4={warning}
>
	<!-- Scale header -->
	{#if scaleOptions.length > 0}
		<div class="hidden sm:grid sm:gap-2" style="grid-template-columns: 1fr repeat({scaleOptions.length}, minmax(0, 1fr))">
			<div></div>
			{#each scaleOptions as option (option.value)}
				<div class="text-center text-xs text-gray-500 font-medium">{translate(option.label)}</div>
			{/each}
		</div>
	{/if}

	<!-- Question rows -->
	{#each questions as question (question.id)}
		{@const currentValue = getQuestionValue(question.id)}
		<div class="sm:grid sm:gap-2 sm:items-center" style="grid-template-columns: 1fr repeat({scaleOptions.length}, minmax(0, 1fr))">
			<div class="text-sm text-gray-900 mb-2 sm:mb-0">{translate(question.label)}</div>
			<div class="flex flex-wrap gap-2 sm:contents">
				{#each scaleOptions as option (option.value)}
					{@const selected = currentValue === option.value}
					<label class="flex cursor-pointer items-center justify-center rounded-md px-3 py-2 text-sm font-semibold focus-within:outline-hidden sm:flex-1 {selected ? 'bg-indigo-600 text-white' : 'ring-1 ring-inset ring-gray-300 bg-white text-gray-900 hover:bg-gray-50'}">
						<input
							type="radio"
							name={question.id}
							value={option.value}
							checked={selected}
							onchange={() => setQuestionValue(question.id, option.value)}
							class="sr-only"
						/>
						<span class="sm:hidden">{translate(option.label)}</span>
						<span class="hidden sm:inline">&bull;</span>
					</label>
				{/each}
			</div>
		</div>
	{/each}
</div>
