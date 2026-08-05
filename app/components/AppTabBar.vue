<script setup lang="ts">
/** Bottom navigation for phones. The header carries the same links from md up. */
const { items, isActive } = useNav()
const { overall } = useProgress()

/** Only the review tab carries a count, and only when something is waiting. */
const badgeFor = (to: string) => (to.startsWith('/drill') ? overall.value.due : 0)
</script>

<template>
  <nav
    class="safe-b fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/92 backdrop-blur-md md:hidden"
    aria-label="Main"
  >
    <ul class="mx-auto flex max-w-lg">
      <li v-for="item in items" :key="item.to" class="flex-1">
        <NuxtLink
          :to="item.to"
          class="relative flex min-h-14 flex-col items-center justify-center gap-1 transition-colors"
          :class="isActive(item.to) ? 'text-accent' : 'text-ink-faint'"
          :aria-current="isActive(item.to) ? 'page' : undefined"
        >
          <span class="relative">
            <UiIcon :name="item.icon" :size="21" />
            <span
              v-if="badgeFor(item.to)"
              class="absolute -top-1.5 -right-2.5 min-w-4 rounded-full bg-accent px-1 text-[10px] leading-4 font-bold text-white"
            >
              {{ badgeFor(item.to) > 99 ? '99+' : badgeFor(item.to) }}
            </span>
          </span>
          <span class="text-[10.5px] font-semibold tracking-tight">{{ item.label }}</span>
        </NuxtLink>
      </li>
    </ul>
  </nav>
</template>
