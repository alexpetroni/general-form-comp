<script lang="ts">
	import { getContext } from 'svelte';
	import { TRANSLATE_KEY, type TranslateFn, type StepConfig } from '../../types.js';

	interface Props {
		steps: StepConfig[];
		currentIndex: number;
		onStepClick?: (index: number) => void;
	}

	let { steps, currentIndex, onStepClick }: Props = $props();

	const t = getContext<TranslateFn | undefined>(TRANSLATE_KEY);
	const translate = (key: string) => t ? t(key) : key;
</script>

<nav aria-label="Progress" class="mb-8">
	<ol role="list" class="divide-y divide-gray-300 rounded-md border border-gray-300 md:flex md:divide-y-0">
		{#each steps as step, i (step.id)}
			{@const isCompleted = i < currentIndex}
			{@const isCurrent = i === currentIndex}
			{@const isUpcoming = i > currentIndex}
			<li class="relative md:flex md:flex-1">
				{#if isCompleted}
					<button
						type="button"
						onclick={() => onStepClick?.(i)}
						class="group flex w-full items-center"
					>
						<span class="flex items-center px-6 py-4 text-sm font-medium">
							<span class="flex size-10 shrink-0 items-center justify-center rounded-full bg-indigo-600 group-hover:bg-indigo-800">
								<svg class="size-6 text-white" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
									<path fill-rule="evenodd" d="M19.916 4.626a.75.75 0 0 1 .208 1.04l-9 13.5a.75.75 0 0 1-1.154.114l-6-6a.75.75 0 0 1 1.06-1.06l5.353 5.353 8.493-12.74a.75.75 0 0 1 1.04-.207Z" clip-rule="evenodd" />
								</svg>
							</span>
							<span class="ml-4 text-sm font-medium text-gray-900">{translate(step.label)}</span>
						</span>
					</button>
				{:else if isCurrent}
					<span class="flex items-center px-6 py-4 text-sm font-medium" aria-current="step">
						<span class="flex size-10 shrink-0 items-center justify-center rounded-full border-2 border-indigo-600">
							<span class="text-indigo-600">{String(i + 1).padStart(2, '0')}</span>
						</span>
						<span class="ml-4 text-sm font-medium text-indigo-600">{translate(step.label)}</span>
					</span>
				{:else if isUpcoming}
					<span class="group flex items-center">
						<span class="flex items-center px-6 py-4 text-sm font-medium">
							<span class="flex size-10 shrink-0 items-center justify-center rounded-full border-2 border-gray-300">
								<span class="text-gray-500">{String(i + 1).padStart(2, '0')}</span>
							</span>
							<span class="ml-4 text-sm font-medium text-gray-500">{translate(step.label)}</span>
						</span>
					</span>
				{/if}

				<!-- Arrow separator -->
				{#if i < steps.length - 1}
					<div class="absolute top-0 right-0 hidden h-full w-5 md:block" aria-hidden="true">
						<svg class="size-full text-gray-300" viewBox="0 0 22 80" fill="none" preserveAspectRatio="none">
							<path d="M0 -2L20 40L0 82" vector-effect="non-scaling-stroke" stroke="currentcolor" stroke-linejoin="round" />
						</svg>
					</div>
				{/if}
			</li>
		{/each}
	</ol>
</nav>
