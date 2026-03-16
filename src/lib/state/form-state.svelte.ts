import type { FormConfig, FormStateAdapter } from '../types.js';

interface FormStateOptions {
	persist?: 'sessionStorage' | 'localStorage' | false;
	storageKey?: string;
	debounceMs?: number;
}

export function createFormState(
	config: FormConfig,
	options: FormStateOptions = {}
): FormStateAdapter & {
	currentStepIndex: number;
	readonly currentStepId: string;
	readonly stepCount: number;
	nextStep: () => void;
	prevStep: () => void;
	goToStep: (index: number) => void;
	readonly allResponses: Record<string, Record<string, unknown>>;
} {
	const { persist = 'sessionStorage', storageKey = 'formcomp-state', debounceMs = 300 } = options;

	// Initialize responses structure
	const initial: Record<string, Record<string, unknown>> = {};
	for (const step of config.steps) {
		initial[step.id] = {};
	}

	// Try to hydrate from storage
	let hydrated = initial;
	let hydratedIndex = 0;
	if (persist && typeof window !== 'undefined') {
		try {
			const storage = persist === 'sessionStorage' ? sessionStorage : localStorage;
			const stored = storage.getItem(storageKey);
			if (stored) {
				const parsed = JSON.parse(stored);
				if (parsed.responses) hydrated = { ...initial, ...parsed.responses };
				if (typeof parsed.currentStepIndex === 'number') hydratedIndex = parsed.currentStepIndex;
			}
		} catch {
			// ignore parse errors
		}
	}

	let responses = $state<Record<string, Record<string, unknown>>>(hydrated);
	let currentStepIndex = $state(hydratedIndex);

	// Debounced persistence
	let saveTimer: ReturnType<typeof setTimeout> | undefined;
	function scheduleSave() {
		if (!persist || typeof window === 'undefined') return;
		clearTimeout(saveTimer);
		saveTimer = setTimeout(() => {
			try {
				const storage = persist === 'sessionStorage' ? sessionStorage : localStorage;
				storage.setItem(
					storageKey,
					JSON.stringify({ responses, currentStepIndex })
				);
			} catch {
				// storage full or unavailable
			}
		}, debounceMs);
	}

	return {
		get currentStepIndex() {
			return currentStepIndex;
		},
		set currentStepIndex(v: number) {
			currentStepIndex = v;
			scheduleSave();
		},

		get currentStepId() {
			return config.steps[currentStepIndex]?.id ?? '';
		},

		get stepCount() {
			return config.steps.length;
		},

		nextStep() {
			if (currentStepIndex < config.steps.length - 1) {
				currentStepIndex++;
				scheduleSave();
			}
		},

		prevStep() {
			if (currentStepIndex > 0) {
				currentStepIndex--;
				scheduleSave();
			}
		},

		goToStep(index: number) {
			if (index >= 0 && index < config.steps.length) {
				currentStepIndex = index;
				scheduleSave();
			}
		},

		getResponse(stepId: string, questionId: string): unknown {
			return responses[stepId]?.[questionId];
		},

		setResponse(stepId: string, questionId: string, value: unknown) {
			if (!responses[stepId]) {
				responses[stepId] = {};
			}
			responses[stepId][questionId] = value;
			scheduleSave();
		},

		getStepResponses(stepId: string): Record<string, unknown> {
			return responses[stepId] ?? {};
		},

		get allResponses() {
			return responses;
		}
	};
}
