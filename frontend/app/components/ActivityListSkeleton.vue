<script setup lang="ts">
import ActivityItemSkeleton from './ActivityItemSkeleton.vue'

withDefaults(defineProps<{
  itemsCount?: number
}>(), {
  itemsCount: 36
})
</script>

<template>
  <div class="my-8 max-lg:ps-3">
    <B24Skeleton class="h-5xl min-w-[110px] max-w-[400px] rounded-full" />
  </div>
  <div class="mt-4 grid grid-cols-[repeat(auto-fill,minmax(310px,1fr))] gap-sm">
    <ActivityItemSkeleton
      v-for="i in itemsCount"
      :key="i"
    />
  </div>
</template>
