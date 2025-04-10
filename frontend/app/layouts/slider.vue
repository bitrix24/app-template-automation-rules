<script setup lang="ts">
useHead({
  bodyAttrs: {
    class: 'text-base-master dark:text-base-150 bg-base-50 dark:bg-base-dark font-b24-system antialiased'
  }
})

// const route = useRoute()
</script>

<template>
  <div class="">
    <slot />
  </div>
</template>
