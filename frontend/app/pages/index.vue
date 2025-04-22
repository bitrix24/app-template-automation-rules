<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import * as locales from '#b24ui/locale'
import SettingsIcon from '@bitrix24/b24icons-vue/common-service/SettingsIcon'
import SunIcon from '@bitrix24/b24icons-vue/main/SunIcon'
import MoonIcon from '@bitrix24/b24icons-vue/main/MoonIcon'
import EarthLanguageIcon from '@bitrix24/b24icons-vue/main/EarthLanguageIcon'

const { locale, locales: localesI18n, setLocale, t, defaultLocale } = useI18n()

definePageMeta({
  layout: 'clear'
})

useHead({
  title: t('page.index.seo.title')
})

const colorMode = useColorMode()

const isDark = computed({
  get() {
    return colorMode.value === 'dark'
  },
  set() {
    colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark'
  }
})

const dir = computed(() => locales[locale.value]?.dir || 'ltr')

const langMap = ref<Map<string, boolean>>(new Map(
  Object.values(localesI18n.value).map(lang => [lang.code, false])
))
langMap.value.set(locale.value, true)

const helpItems = computed(() => {
  return [
    {
      label: isDark.value ? t('page.index.settings.dark') : t('page.index.settings.light'),
      icon: isDark.value ? MoonIcon : SunIcon,
      kbds: ['shift', 'd'],
      onSelect(e: Event) {
        e?.preventDefault()
        isDark.value = !isDark.value
      }
    },
    {
      label: t('page.index.settings.currentLang', {
        code: locales[locale.value]?.code || defaultLocale,
        title: locales[locale.value]?.name || defaultLocale
      }),
      icon: EarthLanguageIcon,
      children: localesI18n.value.map((localeRow) => {
        return {
          label: localeRow.name,
          type: 'checkbox' as const,
          checked: langMap.value.get(localeRow.code),
          onUpdateChecked() {
            [...langMap.value.keys()].forEach((lang) => {
              langMap.value.set(lang, false)
            })
            langMap.value.set(localeRow.code, true)

            setLocale(localeRow.code)

            nextTick(() => {
              scrollToTop()
            })
          }
        }
      })
    }
  ]
})

onMounted(async () => {
  if (locale.value?.length < 1) {
    setLocale(defaultLocale)
  }
})

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
      <B24DropdownMenu
        :items="helpItems"
        :content="{
          align: 'start',
          side: dir === 'ltr' ? 'right' : 'left'
        }"
        :b24ui="{
          content: 'w-[240px] max-h-[245px]'
        }"
        class="me-5"
      >
        <B24Button
          rounded
          :icon="SettingsIcon"
          color="link"
          depth="dark"
        />
      </B24DropdownMenu>
      <B24Button
        rounded
        :label="$t('page.index.page.install')"
        color="warning"
        to="/install"
      />
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
