<script lang="ts">
	import { Tabs as TabsPrimitive, type WithoutChild } from "bits-ui";
	import { cn } from "$lib/utils.js";

	let {
		ref = $bindable(null),
		class: className,
		...restProps
	}: WithoutChild<TabsPrimitive.ListProps> = $props();
</script>

<TabsPrimitive.List
	bind:ref
	data-slot="tabs-list"
	class={cn(
		"bg-muted text-muted-foreground inline-flex h-9 w-fit items-center justify-center rounded-md p-[3px]",
		className
	)}
	{...restProps}
/>
