<script setup lang="ts">
import { provide } from 'vue'
import { LoggerBrowser, B24Hook, Text } from '@bitrix24/b24jssdk'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import * as dotenv from 'dotenv'

definePageMeta({
  layout: false
})

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load environment variables from .env.local ////
dotenv.config({ path: resolve(__dirname, '../../../.env.local') })

const route = useRoute()

const $b24 = new B24Hook({
  b24Url: process.env.VITE_B24_HOOK_URL || '',
  userId: Text.toInteger(process.env.VITE_B24_HOOK_USER_ID),
  secret: process.env.VITE_B24_HOOK_SECRET || ''
})
$b24.setLogger(LoggerBrowser.build('Core', false))

const $logger = LoggerBrowser.build(
  'render-order',
  process.env?.NODE_ENV === 'development'
)

provide('$b24', $b24)
provide('$logger', $logger)

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
  <div class="flex flex-col items-center justify-center gap-16 min-h-screen">
    <RenderOrder
      :task-id="taskId || '??'"
      :status="'status'"
    />
  </div>
</template>
