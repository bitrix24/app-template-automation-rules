<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { LoggerBrowser } from '@bitrix24/b24jssdk'
import type { B24Frame } from '@bitrix24/b24jssdk'

const { t, locales: localesI18n, setLocale } = useI18n()

definePageMeta({
  layout: 'clear'
})

useHead({
  title: t('page.index.seo.title')
})

// region Init ////
let $b24: B24Frame
const $logger = LoggerBrowser.build(
  'index',
  import.meta.env?.DEV === true
)

const { processErrorGlobal } = useAppInit($logger)
// endregion ////

// region Lifecycle Hooks ////
onMounted(async () => {
  try {
    const { $initializeB24Frame } = useNuxtApp()
    $b24 = await $initializeB24Frame()
    $b24.setLogger(LoggerBrowser.build('Core'))

    const b24CurrentLang = $b24.getLang()
    if (localesI18n.value.filter(i => i.code === b24CurrentLang).length > 0) {
      setLocale(b24CurrentLang)
      $logger.log('setLocale >>>', b24CurrentLang)
    } else {
      $logger.warn('not support locale >>>', b24CurrentLang)
    }
  } catch (error) {
    processErrorGlobal(error, {
      homePageIsHide: true,
      isShowClearError: true,
      clearErrorHref: '/'
    })
  }
})

onUnmounted(() => {
  $b24?.destroy()
})
// endregion ////
/**
 * @todo remove this
 */
const generatePDF = async () => {
  try {
    const response = await fetch('/api/render-order?taskId=1058')

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const blob = await response.blob()
    if (!blob.type.includes('application/pdf')) {
      throw new Error('Invalid content type')
    }

    const downloadUrl = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = downloadUrl
    anchor.download = 'document.pdf'
    anchor.click()

    URL.revokeObjectURL(downloadUrl)
  } catch (error) {
    console.error('PDF download failed:', error)
  }
}
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
        to="/activity-list"
      />
      <B24Button
        rounded
        loading-auto
        @click="generatePDF"
      >
        @todo remove this Generate from URL
      </B24Button>
    </div>
  </div>
</template>
