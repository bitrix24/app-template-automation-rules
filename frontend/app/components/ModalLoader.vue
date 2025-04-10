<script setup lang="ts">
import SpinnerIcon from '@bitrix24/b24icons-vue/specialized/SpinnerIcon'
</script>

<template>
  <B24Modal
    :title="$t('component.modal.loader.title')"
    :description="$t('component.modal.loader.description')"
    :dismissible="false"
    fullscreen
    :b24ui="{
      content: 'bg-transparent dark:bg-transparent sm:shadow-none'
    }"
  >
    <template #content>
      <div class="w-full h-full flex flex-col items-center justify-center">
        <SpinnerIcon class="animate-spin text-base-100 dark:text-base-500 stroke-2 size-52" />
      </div>
    </template>
  </B24Modal>
</template>
