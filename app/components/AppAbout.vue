<script setup lang="ts">
import { SOURCE, TOTAL_UNITS } from '~/data/corpus'
</script>

<template>
  <section class="space-y-3 border-t border-line pt-5">
    <h2 class="stamp text-ink-faint">How this works</h2>

    <ul class="space-y-2">
      <li v-for="drill in MODES" :key="drill.id" class="flex gap-3">
        <span class="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg bg-accent-soft text-accent">
          <UiIcon :name="drill.icon" :size="16" />
        </span>
        <span>
          <span class="block text-sm font-semibold">{{ drill.name }}</span>
          <span class="block text-xs leading-relaxed text-ink-dim">{{ drill.rationale }}</span>
        </span>
      </li>
    </ul>

    <p class="text-xs leading-relaxed text-ink-dim">
      <span class="font-semibold text-ink">Scheduling.</span> Every provision you drill gets a next
      review date. Get it right and the gap grows; get it wrong and it comes back today. Reviewing
      just before you would have forgotten is what turns a passage you can read into one you can
      recite.
    </p>

    <p class="text-xs leading-relaxed text-ink-faint">
      Text of the Constitution ({{ TOTAL_UNITS }} provisions) from
      <a
        :href="SOURCE.url"
        target="_blank"
        rel="noopener noreferrer"
        class="text-accent underline underline-offset-2"
        >{{ SOURCE.name }}</a
      >, {{ SOURCE.licence }}. Verify anything you intend to quote against the official text.
    </p>
  </section>
</template>
