<script lang="ts">
	import { getContext } from 'svelte';
	import {
		FORM_STATE_KEY, STEP_ID_KEY,
		type FormStateAdapter, type Question
	} from '../../types.js';
	import RadioListGroup from '../inputs/RadioListGroup.svelte';
	import RadioCardGroup from '../inputs/RadioCardGroup.svelte';
	import CheckboxGroup from '../inputs/CheckboxGroup.svelte';
	import ScaleInput from '../inputs/ScaleInput.svelte';
	import TimeInput from '../inputs/TimeInput.svelte';
	import NumberInput from '../inputs/NumberInput.svelte';
	import TextInput from '../inputs/TextInput.svelte';
	import TextArea from '../inputs/TextArea.svelte';

	interface Props {
		question: Question;
		warning?: boolean;
	}

	let { question, warning = false }: Props = $props();

	const state = getContext<FormStateAdapter>(FORM_STATE_KEY);
	const stepId = getContext<string>(STEP_ID_KEY);

	// Reactive accessor bridging FormStateAdapter ↔ component props
	function getValue(): unknown {
		return state.getResponse(stepId, question.id);
	}

	function setValue(v: unknown) {
		state.setResponse(stepId, question.id, v);
	}
</script>

{#if question.type === 'single-select'}
	{#if question.displayVariant === 'card'}
		<RadioCardGroup
			options={question.options ?? []}
			value={getValue() as string | undefined}
			onchange={(v) => setValue(v)}
			name={question.id}
			label={question.label}
			{warning}
			columns={question.layout?.columns}
		/>
	{:else}
		<RadioListGroup
			options={question.options ?? []}
			value={getValue() as string | undefined}
			onchange={(v) => setValue(v)}
			name={question.id}
			label={question.label}
			{warning}
		/>
	{/if}
{:else if question.type === 'multi-select'}
	<CheckboxGroup
		options={question.options ?? []}
		value={getValue() as string[] ?? []}
		onchange={(v) => setValue(v)}
		name={question.id}
		label={question.label}
		{warning}
	/>
{:else if question.type === 'scale'}
	<ScaleInput
		min={question.min ?? 1}
		max={question.max ?? 10}
		value={getValue() as number | undefined}
		onchange={(v) => setValue(v)}
		name={question.id}
		minLabel={question.minLabel}
		maxLabel={question.maxLabel}
		{warning}
	/>
{:else if question.type === 'time-input'}
	<TimeInput
		value={getValue() as string | undefined}
		onchange={(v) => setValue(v)}
		name={question.id}
		label={question.label}
		step={question.step}
		placeholder={question.placeholder}
		{warning}
	/>
{:else if question.type === 'number-input'}
	<NumberInput
		value={getValue() as number | undefined}
		onchange={(v) => setValue(v)}
		name={question.id}
		label={question.label}
		min={question.min}
		max={question.max}
		step={question.step}
		placeholder={question.placeholder}
		unit={question.unit}
		{warning}
	/>
{:else if question.type === 'text-input'}
	<TextInput
		value={getValue() as string | undefined}
		onchange={(v) => setValue(v)}
		name={question.id}
		label={question.label}
		placeholder={question.placeholder}
		{warning}
	/>
{:else if question.type === 'textarea'}
	<TextArea
		value={getValue() as string | undefined}
		onchange={(v) => setValue(v)}
		name={question.id}
		label={question.label}
		placeholder={question.placeholder}
		rows={question.rows}
		{warning}
	/>
{/if}
