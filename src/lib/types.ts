// ── Condition System ──

export type ConditionOperator = 'equals' | 'not-equals' | 'includes' | 'not-includes';

export interface SimpleCondition {
	questionId: string;
	operator: ConditionOperator;
	value: unknown;
	/** Which step to look up the response in (for cross-step conditions) */
	stepId?: string;
}

export interface CompoundCondition {
	operator: 'and' | 'or';
	conditions: Condition[];
}

export type Condition = SimpleCondition | CompoundCondition;

// ── Question Types ──

export type QuestionType =
	| 'single-select'
	| 'multi-select'
	| 'time-input'
	| 'number-input'
	| 'text-input'
	| 'textarea'
	| 'likert'
	| 'scale';

export type DisplayVariant = 'list' | 'card';

export interface QuestionOption {
	value: string;
	label: string;
	description?: string;
	exclusive?: boolean;
}

export interface LayoutHint {
	columns?: 1 | 2 | 3;
	gridWith?: string[];
}

export interface Question {
	id: string;
	type: QuestionType;
	label: string;
	options?: QuestionOption[];
	required?: boolean;
	tooltip?: string;
	min?: number;
	max?: number;
	step?: number;
	placeholder?: string;
	condition?: Condition;
	displayVariant?: DisplayVariant;
	layout?: LayoutHint;
	minLabel?: string;
	maxLabel?: string;
	rows?: number;
	unit?: string;
}

// ── Group & Step Config ──

export interface QuestionGroup {
	id: string;
	label: string;
	intro?: string;
	questions: Question[];
	condition?: Condition;
	renderMode?: 'individual' | 'likert-batch' | 'inline';
	layout?: LayoutHint;
}

export interface StepConfig {
	id: string;
	label: string;
	intro?: string;
	groups: QuestionGroup[];
}

export interface FormConfig {
	steps: StepConfig[];
}

// ── Translation ──

export type TranslateFn = (key: string, params?: Record<string, string | number>) => string;

// ── State Adapter ──

export interface FormStateAdapter {
	getResponse(stepId: string, questionId: string): unknown;
	setResponse(stepId: string, questionId: string, value: unknown): void;
	getStepResponses(stepId: string): Record<string, unknown>;
}

// ── Callbacks ──

export interface FormCallbacks {
	onStepComplete?: (stepId: string, stepIndex: number) => void;
	onFormComplete?: (allResponses: Record<string, Record<string, unknown>>) => void;
	onStepChange?: (fromIndex: number, toIndex: number) => void;
}

// ── Context Keys ──

export const FORM_STATE_KEY = Symbol('form-state');
export const TRANSLATE_KEY = Symbol('form-translate');
export const STEP_ID_KEY = Symbol('form-step-id');
