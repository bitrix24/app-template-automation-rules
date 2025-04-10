<script setup lang="ts">
import { useUserSettingsStore } from '~/stores/userSettings'
import AttentionIIcon from '@bitrix24/b24icons-vue/main/AttentionIIcon'

const userSettings = useUserSettingsStore()
</script>

<template>
  <div class="flex flex-col items-center justify-center">
    <div class="text-base-350">
      <AttentionIIcon class="size-64 text-base-400" />
    </div>
    <h2 class="text-h1 my-6">
      {{ $t('component.activity.list.empty.title') }}
    </h2>
    <B24Button
      :label="$t('component.activity.list.empty.action')"
      rounded
      depth="dark"
      @click="userSettings.clearFilter"
    />
  </div>
</template>
