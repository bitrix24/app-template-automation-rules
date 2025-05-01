<script setup lang="ts">
import { ref, onMounted, onUnmounted, provide } from 'vue'
import * as locales from '@bitrix24/b24ui-nuxt/locale'
import { LoggerBrowser } from '@bitrix24/b24jssdk'
import type { B24Frame } from '@bitrix24/b24jssdk'

const { locale, defaultLocale, locales: localesI18n, setLocale } = useI18n()
const lang = computed(() => locales[locale.value]?.code || defaultLocale)
const dir = computed(() => locales[locale.value]?.dir || 'ltr')
const { $logger, b24InjectionKey, processErrorGlobal } = useAppInit()

let $b24: B24Frame
const isInit = ref(false)

useHead({
  htmlAttrs: { lang, dir }
})

/**
 * @todo move to B24App
 */
onMounted(async () => {
  try {
    isInit.value = false

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

    isInit.value = true

    provide(b24InjectionKey, $b24)
  } catch (error) {
    processErrorGlobal(error, {
      homePageIsHide: true,
      isShowClearError: false,
      clearErrorHref: '/'
    })
  }
})

onUnmounted(() => {
  $b24?.destroy()
})
</script>

<template>
  <B24App
    :locale="locales[locale]"
  >
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </B24App>
</template>
