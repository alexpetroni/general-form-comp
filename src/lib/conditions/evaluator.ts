import type { Condition, SimpleCondition, CompoundCondition } from '../types.js';

function isCompound(c: Condition): c is CompoundCondition {
	return 'conditions' in c;
}

function evaluateSimple(
	condition: SimpleCondition,
	getResponse: (stepId: string, questionId: string) => unknown,
	currentStepId: string
): boolean {
	const stepId = condition.stepId ?? currentStepId;
	const response = getResponse(stepId, condition.questionId);

	switch (condition.operator) {
		case 'equals':
			return response === condition.value;
		case 'not-equals':
			return response !== condition.value;
		case 'includes': {
			if (Array.isArray(response)) {
				return response.includes(condition.value);
			}
			return false;
		}
		case 'not-includes': {
			if (Array.isArray(response)) {
				return !response.includes(condition.value);
			}
			return true;
		}
	}
}

export function evaluateCondition(
	condition: Condition,
	getResponse: (stepId: string, questionId: string) => unknown,
	currentStepId: string
): boolean {
	if (isCompound(condition)) {
		const results = condition.conditions.map((c) =>
			evaluateCondition(c, getResponse, currentStepId)
		);
		return condition.operator === 'and' ? results.every(Boolean) : results.some(Boolean);
	}
	return evaluateSimple(condition, getResponse, currentStepId);
}
