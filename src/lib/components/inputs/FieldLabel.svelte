<script lang="ts">
	import { useTranslate } from '../../i18n.js';
	import { cn } from '../../utils.js';
	import { labelBase } from '../../styles.js';

	interface Props {
		/** Render as <label for={forId}> or as <legend> inside a fieldset */
		tag?: 'label' | 'legend';
		forId?: string;
		text: string;
		tooltip?: string;
		/** Show the required marker (a red asterisk) after the label text. */
		required?: boolean;
		class?: string;
	}

	let { tag = 'label', forId, text, tooltip, required = false, class: className }: Props = $props();

	const translate = useTranslate();
</script>

<svelte:element
	this={tag}
	for={tag === 'label' ? forId : undefined}
	class={cn(labelBase, tag === 'legend' && 'mb-3', className)}
>
	{translate(text)}
	{#if required && tag === 'legend'}
		{@render marker()}
	{/if}
	{#if tooltip}
		<span
			title={translate(tooltip)}
			aria-label={translate(tooltip)}
			role="img"
			class="ml-1 inline-flex cursor-help align-text-bottom text-(--form-muted)"
		>
			<svg class="size-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
				<circle cx="12" cy="12" r="10" />
				<path d="M12 16v-4" /><path d="M12 8h.01" />
			</svg>
		</span>
	{/if}
</svelte:element>
{#if required && tag === 'label'}
	{@render marker()}
{/if}

<!-- The marker is aria-hidden so the accessible name stays the label text.
     Next to a <label> it is rendered as a following sibling, not inside: tools
     that read a label's full text content (Playwright's getByLabel, for one)
     ignore aria-hidden, so an asterisk inside the label would change the label
     text they see. A <legend> is followed by the fieldset content on a new
     line, so its marker sits inside the legend. -->
{#snippet marker()}
	<span aria-hidden="true" class="ml-0.5 text-sm font-medium text-(--form-error)">*</span>
{/snippet}
