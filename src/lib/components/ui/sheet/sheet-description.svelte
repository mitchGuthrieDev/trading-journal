<script lang="ts">
	import { Dialog as SheetPrimitive, type WithoutChild } from "bits-ui";
	import { cn } from "$lib/utils.js";

	let {
		ref = $bindable(null),
		class: className,
		...restProps
	}: WithoutChild<SheetPrimitive.DescriptionProps> = $props();
</script>

<SheetPrimitive.Description
	bind:ref
	data-slot="sheet-description"
	class={cn("text-muted-foreground text-sm", className)}
	{...restProps}
/>
