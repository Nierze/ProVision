<script setup lang="ts">
// Reading settings here applies the saved theme before the first paint of any page.
useSettings()
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
  <AppIntro />
  <AppDonateNudge />
</template>
