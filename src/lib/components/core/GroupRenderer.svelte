<script lang="ts">
	import { getContext } from 'svelte';
	import {
		FORM_STATE_KEY, STEP_ID_KEY,
		type FormStateAdapter, type QuestionGroup
	} from '../../types.js';
	import { evaluateCondition } from '../../conditions/evaluator.js';
	import { questionStatus } from '../../validation/validator.js';
	import QuestionGroupWrapper from '../layout/QuestionGroupWrapper.svelte';
	import QuestionRenderer from './QuestionRenderer.svelte';
	import LikertGroup from '../inputs/LikertGroup.svelte';

	interface Props {
		group: QuestionGroup;
		warningGroupId?: string | null;
		warningMessage?: string;
	}

	let { group, warningGroupId = null, warningMessage }: Props = $props();

	const state = getContext<FormStateAdapter>(FORM_STATE_KEY);
	const stepId = getContext<string>(STEP_ID_KEY);

	const isWarning = $derived(warningGroupId === group.id);

	// Id of the alert rendered by QuestionGroupWrapper while the group is in
	// warning; failing controls reference it with aria-describedby.
	const alertId = $derived(`formcomp-group-${group.id}-alert`);

	// Filter visible questions based on conditions
	const visibleQuestions = $derived(
		group.questions.filter((q) => {
			if (!q.condition) return true;
			return evaluateCondition(
				q.condition,
				(sid, qid) => state.getResponse(sid, qid),
				stepId
			);
		})
	);

	// While this is the warning group, only the questions that actually fail
	// get the field ring and aria-invalid — not every question in the group.
	// Derived from the live answers, so a corrected field drops its ring at
	// once; the group ring and message stay until the next attempt.
	const failingIds = $derived(
		isWarning
			? visibleQuestions
					.filter((q) => questionStatus(q, state.getResponse(stepId, q.id)) !== 'ok')
					.map((q) => q.id)
			: []
	);

	// Check if group itself is visible
	const groupVisible = $derived(
		!group.condition ||
		evaluateCondition(
			group.condition,
			(sid, qid) => state.getResponse(sid, qid),
			stepId
		)
	);

	// Clear stored answers of questions that become hidden, so stale values
	// can't keep dependent conditions alive or leak into the submission.
	// Clearing may cascade (hiding one question can hide the next); the effect
	// re-runs until nothing is left to clear.
	$effect(() => {
		const hidden = groupVisible
			? group.questions.filter((q) => !visibleQuestions.includes(q))
			: group.questions;
		for (const question of hidden) {
			if (state.getResponse(stepId, question.id) !== undefined) {
				state.setResponse(stepId, question.id, undefined);
			}
		}
	});

	const gridColsClass = $derived(
		group.layout?.columns === 2 ? 'grid grid-cols-1 sm:grid-cols-2 gap-6' :
		group.layout?.columns === 3 ? 'grid grid-cols-1 sm:grid-cols-3 gap-6' :
		''
	);
</script>

{#if groupVisible && visibleQuestions.length > 0}
	<QuestionGroupWrapper id={group.id} label={group.label} intro={group.intro} warning={isWarning} {warningMessage} class={group.class}>
		{#if group.renderMode === 'likert-batch'}
			<!-- All questions rendered as a single LikertGroup -->
			<LikertGroup questions={visibleQuestions} warningIds={failingIds} describedBy={isWarning ? alertId : undefined} />
		{:else if group.renderMode === 'inline'}
			<!-- All questions rendered sequentially in one wrapper -->
			<div class={gridColsClass || 'space-y-6'}>
				{#each visibleQuestions as question (question.id)}
					{@const failing = failingIds.includes(question.id)}
					<QuestionRenderer {question} warning={failing} describedBy={failing ? alertId : undefined} />
				{/each}
			</div>
		{:else}
			<!-- individual (default): each question gets its own space -->
			<div class={gridColsClass || 'space-y-6'}>
				{#each visibleQuestions as question (question.id)}
					{@const failing = failingIds.includes(question.id)}
					<QuestionRenderer {question} warning={failing} describedBy={failing ? alertId : undefined} />
				{/each}
			</div>
		{/if}
	</QuestionGroupWrapper>
{/if}
