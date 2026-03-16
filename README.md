# formComp

Config-driven multi-step form component library for Svelte 5. Define your entire form as a JSON config object and let the library handle rendering, validation, conditional logic, and navigation.

Built with SvelteKit, TypeScript, and Tailwind CSS v4.

## Installation

```sh
npm install github:alexpetroni/gneneral-form-comp
```

**Prerequisite:** Your Svelte project must have [Tailwind CSS v4](https://tailwindcss.com/docs/installation/using-vite) configured, since the components use Tailwind utility classes.

## Usage

```svelte
<script lang="ts">
  import { MultiStepForm } from 'formcomp';
  import type { FormConfig, FormCallbacks } from 'formcomp';

  const config: FormConfig = {
    steps: [
      {
        id: 'step-1',
        label: 'Basic Info',
        groups: [
          {
            id: 'name-group',
            label: 'Your Name',
            questions: [
              {
                id: 'full_name',
                type: 'text-input',
                label: 'Full name',
                required: true,
                placeholder: 'Jane Doe'
              }
            ]
          }
        ]
      }
    ]
  };

  const callbacks: FormCallbacks = {
    onFormComplete(responses) {
      console.log(responses);
    }
  };
</script>

<MultiStepForm {config} {callbacks} />
```

### Development

To run the demo/dev sandbox locally:

```sh
git clone git@github.com:alexpetroni/gneneral-form-comp.git
cd gneneral-form-comp
npm install
npm run dev
```

Visit `http://localhost:5173` to see the demo form.

### Props

| Prop | Type | Description |
|------|------|-------------|
| `config` | `FormConfig` | The form configuration object (required) |
| `translate` | `TranslateFn` | Optional `(key, params?) => string` for i18n. When provided, all `label` fields are treated as translation keys. When omitted, labels render as-is. |
| `state` | `FormStateAdapter` | Optional external state adapter. If omitted, an internal one is created with sessionStorage persistence. |
| `callbacks` | `FormCallbacks` | Optional lifecycle callbacks. |

### Callbacks

```ts
interface FormCallbacks {
  onStepComplete?: (stepId: string, stepIndex: number) => void;
  onFormComplete?: (allResponses: Record<string, Record<string, unknown>>) => void;
  onStepChange?: (fromIndex: number, toIndex: number) => void;
}
```

### State management

The built-in state manager persists responses to sessionStorage by default:

```ts
import { createFormState } from 'formcomp';

const state = createFormState(config, {
  persist: 'localStorage',  // 'sessionStorage' (default) | 'localStorage' | false
  storageKey: 'my-form',    // default: 'formcomp-state'
  debounceMs: 500           // default: 300
});
```

You can also provide your own state by implementing the `FormStateAdapter` interface:

```ts
interface FormStateAdapter {
  getResponse(stepId: string, questionId: string): unknown;
  setResponse(stepId: string, questionId: string, value: unknown): void;
  getStepResponses(stepId: string): Record<string, unknown>;
}
```

---

## Config format

A form config is a tree: **FormConfig > StepConfig[] > QuestionGroup[] > Question[]**.

### FormConfig

The root object.

```ts
interface FormConfig {
  steps: StepConfig[];
}
```

### StepConfig

Each step is one page/screen in the multi-step flow.

```ts
interface StepConfig {
  id: string;       // unique step identifier
  label: string;    // displayed in the progress bar
  intro?: string;   // optional paragraph shown below the step title
  groups: QuestionGroup[];
}
```

### QuestionGroup

Groups organize questions under a heading. They are the unit of validation feedback (the first incomplete group gets highlighted).

```ts
interface QuestionGroup {
  id: string;        // unique within the step
  label: string;     // group heading
  intro?: string;    // optional paragraph below the heading
  questions: Question[];
  condition?: Condition;   // hide the entire group unless condition is met
  renderMode?: 'individual' | 'likert-batch' | 'inline';
  layout?: LayoutHint;
}
```

**`renderMode`** controls how the questions inside the group are rendered:

| Mode | Behavior |
|------|----------|
| `'individual'` | (default) Each question renders in its own space with individual warning states. |
| `'likert-batch'` | All questions are passed to a single `LikertGroup` component as a batch table. All questions must share the same `options` array. |
| `'inline'` | All questions render sequentially inside a single wrapper. Useful with `layout.columns` for side-by-side fields. |

### Question

The individual form field.

```ts
interface Question {
  id: string;         // unique within the step, used as the response key
  type: QuestionType;
  label: string;      // field label (or i18n key when translate fn is provided)
  required?: boolean;  // if true, validation blocks progression when empty
  options?: QuestionOption[];
  condition?: Condition;
  // Display
  displayVariant?: 'list' | 'card';  // for single-select only
  layout?: LayoutHint;
  // Number/scale
  min?: number;
  max?: number;
  step?: number;       // for time-input: rounding interval in seconds (e.g. 900 = 15 min)
  minLabel?: string;   // label under the low end of a scale
  maxLabel?: string;   // label under the high end of a scale
  unit?: string;       // suffix shown inside number inputs (e.g. "kg", "min")
  // Text
  placeholder?: string;
  rows?: number;       // for textarea
  tooltip?: string;
}
```

### QuestionType

| Type | Component | Value type | Notes |
|------|-----------|------------|-------|
| `'single-select'` | `RadioListGroup` or `RadioCardGroup` | `string` | Use `displayVariant: 'card'` for card layout. Requires `options`. |
| `'multi-select'` | `CheckboxGroup` | `string[]` | Requires `options`. Supports `exclusive` options. |
| `'likert'` | `LikertGroup` | `string` | Designed for use inside a group with `renderMode: 'likert-batch'`. Requires `options`. |
| `'scale'` | `ScaleInput` | `number` | Numbered circular buttons. Uses `min`/`max` (default 1-10), `minLabel`/`maxLabel`. |
| `'time-input'` | `TimeInput` | `string` | HTML time input. `step` is in seconds (900 = 15-minute rounding). |
| `'number-input'` | `NumberInput` | `number` | Supports `min`, `max`, `step`, `unit`, `placeholder`. |
| `'text-input'` | `TextInput` | `string` | Plain text field. Supports `placeholder`. |
| `'textarea'` | `TextArea` | `string` | Multi-line. Supports `rows` (default 4), `placeholder`. |

### QuestionOption

Used by `single-select`, `multi-select`, and `likert` question types.

```ts
interface QuestionOption {
  value: string;        // stored as the response value
  label: string;        // display text (or i18n key)
  description?: string; // secondary text shown below the label
  exclusive?: boolean;  // multi-select only: selecting this deselects all others
}
```

### LayoutHint

Controls grid layout within a group or for a specific question.

```ts
interface LayoutHint {
  columns?: 1 | 2 | 3;   // render in a CSS grid with this many columns
  gridWith?: string[];    // IDs of questions to group into the same grid row
}
```

Applied on a **group** with `renderMode: 'inline'`, this places all the group's questions into a multi-column grid:

```ts
{
  id: 'body-metrics',
  label: 'Body Metrics',
  renderMode: 'inline',
  layout: { columns: 2 },
  questions: [
    { id: 'height', type: 'number-input', label: 'Height', unit: 'cm' },
    { id: 'weight', type: 'number-input', label: 'Weight', unit: 'kg' }
  ]
}
```

### Condition

Conditions control visibility of groups and questions. A hidden question is also excluded from validation.

#### Simple condition

Show this item when a specific question has (or doesn't have) a specific value:

```ts
interface SimpleCondition {
  questionId: string;
  operator: 'equals' | 'not-equals' | 'includes' | 'not-includes';
  value: unknown;
  stepId?: string;   // look up the response in a different step (for cross-step conditions)
}
```

| Operator | Behavior |
|----------|----------|
| `'equals'` | `response === value` |
| `'not-equals'` | `response !== value` |
| `'includes'` | `Array.isArray(response) && response.includes(value)` |
| `'not-includes'` | `!Array.isArray(response) \|\| !response.includes(value)` |

#### Compound condition

Combine multiple conditions with AND/OR:

```ts
interface CompoundCondition {
  operator: 'and' | 'or';
  conditions: Condition[];   // can nest SimpleCondition or CompoundCondition
}
```

#### Examples

Show a question only when another answer is not "no":

```ts
{
  id: 'restless_relief',
  type: 'single-select',
  label: 'Does moving help?',
  condition: {
    questionId: 'restless_legs',
    operator: 'not-equals',
    value: 'no'
  },
  options: [...]
}
```

Show a group only when a question on a different step equals "female":

```ts
{
  id: 'hormonal',
  label: 'Hormonal Factors',
  condition: {
    questionId: 'biological_sex',
    operator: 'equals',
    value: 'female',
    stepId: 'physical'
  },
  questions: [...]
}
```

Compound condition (show when user selected "coffee" AND frequency is "daily"):

```ts
{
  condition: {
    operator: 'and',
    conditions: [
      { questionId: 'beverages', operator: 'includes', value: 'coffee' },
      { questionId: 'coffee_frequency', operator: 'equals', value: 'daily' }
    ]
  }
}
```

---

## Full example

A three-step form demonstrating all question types, conditional logic, layout, and Likert batches:

```ts
const config: FormConfig = {
  steps: [
    {
      id: 'basics',
      label: 'Basics',
      intro: 'Some introductory text.',
      groups: [
        {
          id: 'schedule',
          label: 'Daily Schedule',
          renderMode: 'inline',
          layout: { columns: 2 },
          questions: [
            { id: 'wake', type: 'time-input', label: 'Wake time', required: true, step: 900 },
            { id: 'sleep', type: 'time-input', label: 'Sleep time', required: true, step: 900 }
          ]
        },
        {
          id: 'main-issue',
          label: 'Primary Concern',
          questions: [
            {
              id: 'concern',
              type: 'single-select',
              label: 'What brings you here?',
              displayVariant: 'card',
              required: true,
              options: [
                { value: 'a', label: 'Option A', description: 'Description for A' },
                { value: 'b', label: 'Option B', description: 'Description for B' },
                { value: 'other', label: 'Other', description: 'Something else' }
              ]
            }
          ]
        },
        {
          id: 'other-details',
          label: 'Details',
          condition: { questionId: 'concern', operator: 'equals', value: 'other' },
          questions: [
            { id: 'details', type: 'textarea', label: 'Please describe', required: true, rows: 3 }
          ]
        }
      ]
    },
    {
      id: 'ratings',
      label: 'Severity',
      groups: [
        {
          id: 'severity-scale',
          label: 'How severe is the issue?',
          questions: [
            {
              id: 'severity',
              type: 'scale',
              label: 'Overall severity',
              required: true,
              min: 1,
              max: 10,
              minLabel: 'Not at all',
              maxLabel: 'Extremely'
            }
          ]
        },
        {
          id: 'frequency-ratings',
          label: 'Rate frequency over the past 2 weeks',
          renderMode: 'likert-batch',
          questions: [
            {
              id: 'freq_1', type: 'likert', label: 'Symptom A', required: true,
              options: [
                { value: '0', label: 'Never' },
                { value: '1', label: 'Rarely' },
                { value: '2', label: 'Sometimes' },
                { value: '3', label: 'Often' }
              ]
            },
            {
              id: 'freq_2', type: 'likert', label: 'Symptom B', required: true,
              options: [
                { value: '0', label: 'Never' },
                { value: '1', label: 'Rarely' },
                { value: '2', label: 'Sometimes' },
                { value: '3', label: 'Often' }
              ]
            }
          ]
        }
      ]
    },
    {
      id: 'profile',
      label: 'Profile',
      groups: [
        {
          id: 'demographics',
          label: 'About You',
          renderMode: 'inline',
          layout: { columns: 2 },
          questions: [
            { id: 'age', type: 'number-input', label: 'Age', required: true, min: 13, max: 120 },
            { id: 'height', type: 'number-input', label: 'Height', required: true, unit: 'cm' }
          ]
        },
        {
          id: 'habits',
          label: 'Daily Habits',
          questions: [
            {
              id: 'activities',
              type: 'multi-select',
              label: 'Select all that apply',
              required: true,
              options: [
                { value: 'exercise', label: 'Exercise' },
                { value: 'meditation', label: 'Meditation' },
                { value: 'reading', label: 'Reading' },
                { value: 'none', label: 'None of the above', exclusive: true }
              ]
            }
          ]
        }
      ]
    }
  ]
};
```

## Response format

When `onFormComplete` fires, responses are keyed by step ID, then question ID:

```ts
{
  "basics": {
    "wake": "07:00",
    "sleep": "23:00",
    "concern": "other",
    "details": "I have trouble with..."
  },
  "ratings": {
    "severity": 7,
    "freq_1": "2",
    "freq_2": "1"
  },
  "profile": {
    "age": 34,
    "height": 175,
    "activities": ["exercise", "reading"]
  }
}
```

## Validation

Validation runs automatically when the user clicks "Next". The validator:

1. Walks all groups and questions in the current step's config.
2. Skips any group or question hidden by a `condition`.
3. For each visible question with `required: true`, checks that a response exists and is non-empty.
4. If incomplete, highlights the first incomplete group (red ring, smooth scroll).

No hand-coded validation arrays are needed. The config is the single source of truth.

## Project structure

```
src/lib/
  index.ts                          # barrel export
  types.ts                          # full type system
  state/form-state.svelte.ts        # reactive state with persistence
  conditions/evaluator.ts           # condition evaluation engine
  validation/validator.ts           # config-driven validation
  components/
    core/
      MultiStepForm.svelte          # top-level orchestrator
      FormStep.svelte               # renders one step from config
      GroupRenderer.svelte           # renders a group (handles renderMode, conditions, layout)
      QuestionRenderer.svelte        # maps question type to input component
    inputs/
      RadioListGroup.svelte          # single-select vertical list
      RadioCardGroup.svelte          # single-select card grid
      CheckboxGroup.svelte           # multi-select with exclusive option logic
      LikertGroup.svelte             # likert-scale batch table
      ScaleInput.svelte              # numbered 1-N circular buttons
      TimeInput.svelte               # time picker with step rounding
      NumberInput.svelte             # number with min/max/unit
      TextInput.svelte               # text/email/url
      TextArea.svelte                # multi-line text
    layout/
      ProgressBar.svelte             # horizontal step indicator with arrows
      NavigationButtons.svelte       # back/next buttons
      StepContainer.svelte           # step title + intro wrapper
      QuestionGroupWrapper.svelte    # group heading + warning ring
src/routes/
  +page.svelte                      # demo page
```

## Exports

Everything is available from `'formcomp'`:

```ts
import { MultiStepForm, createFormState, evaluateCondition, validateStep } from 'formcomp';
import type { FormConfig, Question, Condition } from 'formcomp';
```

- **Components**: `MultiStepForm`, `FormStep`, `QuestionRenderer`, `GroupRenderer`, all 9 input components, all 4 layout components
- **State**: `createFormState`
- **Utilities**: `evaluateCondition`, `validateStep`
- **Types**: `FormConfig`, `StepConfig`, `QuestionGroup`, `Question`, `QuestionOption`, `Condition`, `SimpleCondition`, `CompoundCondition`, `ConditionOperator`, `QuestionType`, `DisplayVariant`, `LayoutHint`, `TranslateFn`, `FormStateAdapter`, `FormCallbacks`
- **Context keys**: `FORM_STATE_KEY`, `TRANSLATE_KEY`, `STEP_ID_KEY`
