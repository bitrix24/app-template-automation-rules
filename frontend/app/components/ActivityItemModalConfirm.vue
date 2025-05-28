<script setup lang="ts">
import type { IActivity } from '~/types'

defineProps<{
  activity: IActivity
}>()

const emit = defineEmits<{ close: [boolean] }>()
</script>

<template>
  <B24Modal
    :title="$t('component.modal.confirm.title', { title: activity.title })"
    :description="$t('component.modal.confirm.description')"
    :close="{ onClick: () => emit('close', false) }"
  >
    <template #footer>
      <div class="flex gap-2">
        <B24Button
          rounded
          :label="$t('component.modal.confirm.confirm')"
          color="danger"
          size="sm"
          @click="emit('close', true)"
        />
        <B24Button
          rounded
          :label="$t('component.modal.confirm.cancel')"
          color="link"
          depth="light"
          size="sm"
          @click="emit('close', false)"
        />
      </div>
    </template>
  </B24Modal>
</template>
