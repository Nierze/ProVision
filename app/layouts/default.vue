<template>
  <div class="flex min-h-dvh flex-col">
    <AppHeader />

    <main class="mx-auto w-full max-w-5xl flex-1 px-4 pt-5 pb-28 md:pb-14">
      <slot />
    </main>

    <AppTabBar />
  </div>
</template>
