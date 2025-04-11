<script setup lang="ts">
import SettingsIcon from '@bitrix24/b24icons-vue/common-service/SettingsIcon'

defineProps({
  taskId: String,
  status: {
    type: String,
    default: 'processing'
  }
})

const currentDateTime = ref(new Date().toLocaleString(
  'en-US',
  {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }))
</script>

<template>
  <div class="bg-white p-6 rounded-lg shadow-lg">
    <h1 class="text-2xl font-bold mb-4">
      Task #{{ taskId }} <SettingsIcon class="size-5" />
    </h1>
    <div class="space-y-2">
      <p class="text-base-600">
        Status: <span class="font-medium">{{ status }}</span>
      </p>
      <p class="text-base-600">
        Created: {{ currentDateTime }}
      </p>
    </div>
  </div>
</template>
