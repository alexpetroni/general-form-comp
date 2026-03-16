<script lang="ts">
	import { setContext } from 'svelte';
	import type { FormConfig, FormStateAdapter, TranslateFn, FormCallbacks } from '../../types.js';
	import { FORM_STATE_KEY, TRANSLATE_KEY } from '../../types.js';
	import { createFormState } from '../../state/form-state.svelte.js';
	import { validateStep } from '../../validation/validator.js';
	import ProgressBar from '../layout/ProgressBar.svelte';
	import NavigationButtons from '../layout/NavigationButtons.svelte';
	import FormStep from './FormStep.svelte';

	interface Props {
		config: FormConfig;
		translate?: TranslateFn;
		state?: FormStateAdapter & {
			currentStepIndex: number;
			nextStep: () => void;
			prevStep: () => void;
			goToStep: (index: number) => void;
		};
		callbacks?: FormCallbacks;
	}

	let { config, translate: translateFn, state: externalState, callbacks }: Props = $props();

	// These are intentionally captured once at mount time — config/translate/state don't change
	const formState = externalState ?? createFormState(config);

	let warningGroupId = $state<string | null>(null);

	setContext(FORM_STATE_KEY, formState);
	if (translateFn) {
		setContext(TRANSLATE_KEY, translateFn);
	}

	const currentStep = $derived(config.steps[formState.currentStepIndex]);
	const isFirstStep = $derived(formState.currentStepIndex === 0);
	const isLastStep = $derived(formState.currentStepIndex === config.steps.length - 1);

	function handleNext() {
		if (!currentStep) return;

		const result = validateStep(
			currentStep,
			(sid, qid) => formState.getResponse(sid, qid),
			currentStep.id
		);

		if (!result.isValid) {
			warningGroupId = result.firstIncompleteGroupId;
			if (warningGroupId) {
				const el = document.getElementById(warningGroupId);
				el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
			}
			return;
		}

		warningGroupId = null;
		const fromIndex = formState.currentStepIndex;

		if (isLastStep) {
			callbacks?.onFormComplete?.(
				Object.fromEntries(
					config.steps.map((s: { id: string }) => [s.id, formState.getStepResponses(s.id)])
				)
			);
		} else {
			callbacks?.onStepComplete?.(currentStep.id, fromIndex);
			formState.nextStep();
			callbacks?.onStepChange?.(fromIndex, formState.currentStepIndex);
			window.scrollTo({ top: 0, behavior: 'smooth' });
		}
	}

	function handleBack() {
		warningGroupId = null;
		const fromIndex = formState.currentStepIndex;
		formState.prevStep();
		callbacks?.onStepChange?.(fromIndex, formState.currentStepIndex);
		window.scrollTo({ top: 0, behavior: 'smooth' });
	}

	function handleStepClick(index: number) {
		if (index < formState.currentStepIndex) {
			warningGroupId = null;
			const fromIndex = formState.currentStepIndex;
			formState.goToStep(index);
			callbacks?.onStepChange?.(fromIndex, index);
			window.scrollTo({ top: 0, behavior: 'smooth' });
		}
	}
</script>

<div class="mx-auto max-w-4xl">
	<ProgressBar
		steps={config.steps}
		currentIndex={formState.currentStepIndex}
		onStepClick={handleStepClick}
	/>

	{#if currentStep}
		{#key currentStep.id}
			<FormStep stepConfig={currentStep} {warningGroupId} />
		{/key}
	{/if}

	<NavigationButtons
		showBack={!isFirstStep}
		showNext={true}
		nextLabel={isLastStep ? 'Submit' : 'Next'}
		onback={handleBack}
		onnext={handleNext}
	/>
</div>
