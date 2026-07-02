import type { FormConfig } from '../lib/types.js';

import { minimalConfig } from './minimal.js';
import { conditionalConfig } from './conditional.js';
import { likertConfig } from './likert.js';
import { allInputsConfig } from './all-inputs.js';
import { sleepAssessmentConfig } from './sleep-assessment.js';

export interface Example {
	slug: string;
	title: string;
	description: string;
	config: FormConfig;
}

export const examples: Example[] = [
	{
		slug: 'minimal',
		title: 'Minimal form',
		description: 'The smallest useful form — a single step with a text input and a textarea.',
		config: minimalConfig
	},
	{
		slug: 'conditional',
		title: 'Conditional logic',
		description: 'Questions and groups that show/hide based on previous answers (AND, OR, cross-step).',
		config: conditionalConfig
	},
	{
		slug: 'likert',
		title: 'Likert batch',
		description: 'A batch of statements rated on a shared 1–5 agreement scale.',
		config: likertConfig
	},
	{
		slug: 'all-inputs',
		title: 'All input types',
		description: 'Showcase of every built-in input: text, textarea, single/multi-select, scale, time, number.',
		config: allInputsConfig
	},
	{
		slug: 'sleep-assessment',
		title: 'Sleep assessment',
		description: 'A larger three-step sleep assessment combining conditions, Likert batches, and layout.',
		config: sleepAssessmentConfig
	}
];

export function getExample(slug: string): Example | undefined {
	return examples.find((e) => e.slug === slug);
}

export {
	minimalConfig,
	conditionalConfig,
	likertConfig,
	allInputsConfig,
	sleepAssessmentConfig
};
