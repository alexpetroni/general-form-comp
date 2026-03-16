import type { StepConfig, Question } from '../types.js';
import { evaluateCondition } from '../conditions/evaluator.js';

export interface ValidationResult {
	isValid: boolean;
	firstIncompleteGroupId: string | null;
}

function isFilled(value: unknown): boolean {
	if (value === undefined || value === null) return false;
	if (typeof value === 'string') return value.trim().length > 0;
	if (typeof value === 'number') return true;
	if (Array.isArray(value)) return value.length > 0;
	return true;
}

function isQuestionVisible(
	question: Question,
	getResponse: (stepId: string, questionId: string) => unknown,
	currentStepId: string
): boolean {
	if (!question.condition) return true;
	return evaluateCondition(question.condition, getResponse, currentStepId);
}

export function validateStep(
	stepConfig: StepConfig,
	getResponse: (stepId: string, questionId: string) => unknown,
	currentStepId: string
): ValidationResult {
	for (const group of stepConfig.groups) {
		// Skip hidden groups
		if (group.condition) {
			const visible = evaluateCondition(group.condition, getResponse, currentStepId);
			if (!visible) continue;
		}

		for (const question of group.questions) {
			if (!question.required) continue;
			if (!isQuestionVisible(question, getResponse, currentStepId)) continue;

			const value = getResponse(currentStepId, question.id);
			if (!isFilled(value)) {
				return { isValid: false, firstIncompleteGroupId: group.id };
			}
		}
	}

	return { isValid: true, firstIncompleteGroupId: null };
}
