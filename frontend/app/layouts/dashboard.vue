<script setup lang="ts">
import { computed } from 'vue'
import { SettingsSlider, IntegratorNav, Logo } from '#components'
import { EActivityCategory } from '~/types'
import type { NavigationMenuItem } from '@bitrix24/b24ui-nuxt'
import { useUserSettingsStore } from '~/stores/userSettings'
import PulseCircleIcon from '@bitrix24/b24icons-vue/main/PulseCircleIcon'
import SettingsIcon from '@bitrix24/b24icons-vue/common-service/SettingsIcon'
import SunIcon from '@bitrix24/b24icons-vue/main/SunIcon'
import MoonIcon from '@bitrix24/b24icons-vue/main/MoonIcon'
import HelpIcon from '@bitrix24/b24icons-vue/main/HelpIcon'

const { t } = useI18n()
const colorMode = useColorMode()
const overlay = useOverlay()
const settingsSlider = overlay.create(SettingsSlider)

useHead({
  bodyAttrs: {
    class: 'text-base-master dark:text-base-150 bg-base-50 dark:bg-base-dark font-b24-system antialiased'
  }
})

const isDark = computed({
  get() {
    return colorMode.value === 'dark'
  },
  set() {
    colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark'
  }
})

const userSettings = useUserSettingsStore()
const categories = computed(() => (handleClick: () => void) => {
  return [
    {
      label: t('composables.useSearchInput.categories.all'),
      value: 'all',
      active: userSettings.filterParams.category === 'all',
      async onSelect(e: Event) {
        e.preventDefault()
        userSettings.filterParams.category = 'all'

        await userSettings.saveSettings()

        handleClick()
      }
    },
    ...Object.values(EActivityCategory).map((value) => {
      return {
        label: t(`composables.useSearchInput.categories.${value}`),
        value,
        active: userSettings.filterParams.category === value,
        async onSelect(e: Event) {
          e.preventDefault()
          userSettings.filterParams.category = value

          await userSettings.saveSettings()

          handleClick()
        }
      }
    })
  ] satisfies NavigationMenuItem[]
})

const helpItems = computed(() => {
  const result: NavigationMenuItem[] = []

  result.push({
    label: t('component.nav.settings.settings'),
    icon: SettingsIcon,
    async onSelect(e: Event) {
      e?.preventDefault()
      await settingsSlider.open()
    }
  })

  result.push({
    label: t('component.nav.settings.help'),
    icon: HelpIcon,
    to: 'https://apidocs.bitrix24.com/',
    target: '_blank'
  })

  result.push({
    label: t('component.nav.settings.support'),
    icon: PulseCircleIcon,
    to: 'https://helpdesk.bitrix24.com/',
    target: '_blank'
  })

  result.push({
    label: isDark.value ? t('component.nav.settings.dark') : t('component.nav.settings.light'),
    icon: isDark.value ? MoonIcon : SunIcon,
    kbds: ['shift', 'd'],
    badge: {
      label: 'shift + d',
      color: 'default' as const,
      depth: 'light' as const,
      useFill: false
    },
    onSelect(e: Event) {
      e?.preventDefault()
      isDark.value = !isDark.value
    }
  })

  return result
})

defineShortcuts(extractShortcuts(helpItems.value))
</script>

<template>
  <B24SidebarLayout
    :use-light-content="false"
  >
    <template #sidebar="{ handleClick }">
      <B24SidebarHeader>
        <B24SidebarSection class="ps-[18px] flex-row  items-center justify-start gap-0.5 text-primary">
          <Logo class="size-8" />
          <ProseH4 class="mb-0 leading-none">
            {{ $t('app.title') }}
          </ProseH4>
        </B24SidebarSection>
      </B24SidebarHeader>
      <B24SidebarBody>
        <B24NavigationMenu
          :items="categories(handleClick)"
          variant="pill"
          orientation="vertical"
        />
        <B24SidebarSpacer />
        <B24NavigationMenu
          :items="helpItems"
          variant="pill"
          orientation="vertical"
        />
      </B24SidebarBody>
      <B24SidebarFooter>
        <IntegratorNav />
      </B24SidebarFooter>
    </template>
    <template #navbar>
      <B24NavbarSpacer />
      <B24NavbarSection>
        <IntegratorNav />
      </B24NavbarSection>
    </template>

    <!-- Header -->
    <div>
      <slot name="header-title">
        <!-- / header-title / -->
      </slot>
    </div>

    <!-- Content -->
    <slot />
  </B24SidebarLayout>
</template>
