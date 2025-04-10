<script setup lang="ts">
defineProps<{
  label: string
  value: string | number
}>()
</script>

<template>
  <div class="flex gap-2">
    <span>{{ label }}:</span>
    <span>{{ value }}</span>
  </div>
</template>
