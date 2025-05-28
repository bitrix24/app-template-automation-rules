<script setup lang="ts">
import { onMounted } from 'vue'
import type { B24Frame } from '@bitrix24/b24jssdk'

const { t } = useI18n()

useHead({
  title: t('page.index.seo.title')
})

// region Init ////
const { $logger, processErrorGlobal } = useAppInit()
const { $initializeB24Frame } = useNuxtApp()
const $b24: B24Frame = await $initializeB24Frame()

const isAutoOpenActivityList = ref(true)
const isHmrUpdate = import.meta.hot?.data?.isHmrUpdate || false
if (!import.meta.hot && import.meta.client) {
  $logger.info('Update -> clear hmrUpdateFlag')
  sessionStorage.removeItem('hmrUpdateFlag')
}
// endregion ////

// region Lifecycle Hooks ////
onMounted(async () => {
  try {
    /**
     * @need fix lang
     */
    await $b24.parent.setTitle('App: index')

    if (import.meta.hot && isHmrUpdate) {
      $logger.info('HMR update -> skip openActivityList')
    } else {
      if (isAutoOpenActivityList.value) {
        openActivityList()
      }

      if (import.meta.hot) {
        import.meta.hot.data.isHmrUpdate = true
      }
    }
  } catch (error) {
    processErrorGlobal(error, {
      homePageIsHide: true,
      isShowClearError: true,
      clearErrorHref: '/'
    })
  }
})
// endregion ////

// region Action ////
function openActivityList() {
  if ($b24.placement.isSliderMode) {
    $b24.slider.closeSliderAppPage()
  }

  window.setTimeout(() => {
    /**
     * @need fix lang
     */
    $b24.slider.openSliderAppPage({
      place: 'activity-list',
      bx24_width: 1650,
      bx24_label: {
        bgColor: 'violet',
        text: '🛠️',
        color: '#ffffff'
      },
      bx24_title: t('page.list.seo.title')
    })
  }, 10)
}
// endregion ////
</script>

<template>
  <div class="flex flex-col items-center justify-center gap-16 h-screen">
    <h1 class="font-b24-secondary text-h1 sm:text-8xl font-light">
      {{ $t('page.index.seo.title') }}
    </h1>

    <div class="flex flex-wrap items-center gap-3">
      <B24Button
        rounded
        :label="$t('page.index.page.main')"
        color="primary"
        @click.stop="openActivityList"
      />
    </div>
  </div>
</template>
