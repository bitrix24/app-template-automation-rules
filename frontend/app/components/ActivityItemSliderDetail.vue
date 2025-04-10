<script setup lang="ts">
/**
 * @todo: open support
 * @todo: area for close
 */
import { computed } from 'vue'
import type { IActivity } from '~/types'
import type { Collections } from '@nuxt/content'

const { locale, defaultLocale } = useI18n()

const props = defineProps<{
  activity: IActivity
}>()

const emit = defineEmits<{ close: [boolean] }>()

// region Locale ////
const contentCollection = computed<keyof Collections>(() => `contentActivities_${locale.value.length > 0 ? locale.value : defaultLocale}`)
// endregion ////

// region Data ////
const { data: content } = await useAsyncData(props.activity.path, () => {
  return queryCollection(contentCollection.value).path(props.activity.path).first()
})
// endregion ////
</script>

<template>
  <B24Slideover
    :title="activity.title"
    :description="activity.description"
    :close="{ onClick: () => emit('close', false) }"
    :b24ui="{
      content: 'max-w-[90%] md:max-w-1/2',
      body: 'm-5 p-5 bg-white dark:bg-white/10 rounded'
    }"
  >
    <template #body>
      <B24Advice
        v-if="!content"
        class="min-w-full"
        :avatar="{ src: '/avatar/assistant.png' }"
      >
        <p>{{ $t('component.activity.item.slider.advice.p1') }}</p>
        <p>{{ $t('component.activity.item.slider.advice.p2') }}</p>
        <div class="mt-2 flex flex-row flex-wrap items-start justify-between gap-2">
          <B24Button
            size="xs"
            color="primary"
            :label="$t('component.activity.item.slider.advice.action')"
          />
        </div>
      </B24Advice>
      <ContentRenderer v-else :value="content" />
    </template>

    <template #footer>
      <div class="flex gap-2">
        <B24Button
          rounded
          :label="$t('component.activity.item.slider.close')"
          color="link"
          depth="dark"
          @click="emit('close', false)"
        />
      </div>
      <B24Badge
        v-if="activity.isInstall"
        class="absolute right-5"
        size="lg"
        color="collab"
        depth="light"
        use-fill
        :label="$t('component.activity.item.slider.installed')"
      />
    </template>
  </B24Slideover>
</template>
