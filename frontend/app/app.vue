<script setup lang="ts">
import { onMounted } from 'vue'
import * as locales from '@bitrix24/b24ui-nuxt/locale'

const { locale, defaultLocale, locales: localesI18n, setLocale } = useI18n()
const lang = computed(() => locales[locale.value]?.code || defaultLocale)
const dir = computed(() => locales[locale.value]?.dir || 'ltr')
const { $logger, processErrorGlobal } = useAppInit()

useHead({
  htmlAttrs: { lang, dir }
})

const isUseB24Frame = useState('isUseB24Frame')

onMounted(async () => {
  /**
   * @memo Skip init $b24
   * @see middleware/01.app.page.or.slider.global.ts
   */
  if (import.meta.server || !isUseB24Frame.value) {
    return
  }

  try {
    const { $initializeB24Frame } = useNuxtApp()
    const $b24 = await $initializeB24Frame()

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
      isShowClearError: false,
      clearErrorHref: '/'
    })
  }
})
</script>

<template>
  <ClientOnly>
    <B24App
      :locale="locales[locale]"
    >
      <NuxtLayout>
        <NuxtPage />
      </NuxtLayout>
    </B24App>
  </ClientOnly>
</template>
