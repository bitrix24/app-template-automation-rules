<script setup lang="ts">
definePageMeta({
  layout: 'clear'
})

const route = useRoute()


/**
 * @todo add some test query
 */
const taskId = computed(() => {
  const id = route.query.taskId
  return Array.isArray(id) ? id[0] : id
})

if (!taskId.value) {
  throw createError({
    statusCode: 400,
    message: 'taskId not specified in query parameters'
  })
}
</script>

<template>
  <div class="flex flex-col items-center justify-center gap-16 h-screen">
    <RenderOrder
      :task-id="taskId || '??'"
      :status="'status'"
    />
  </div>
</template>
