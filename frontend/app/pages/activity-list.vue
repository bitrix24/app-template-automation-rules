<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { B24Hook, LoggerBrowser } from '@bitrix24/b24jssdk'
import { ModalLoader, ActivityItemModalConfirm, ActivityItemSliderDetail, ActivityListSkeleton, ActivityListEmpty } from '#components'
import { useUserSettingsStore } from '~/stores/userSettings'
import { useAppSettingsStore } from '~/stores/appSettings'
import { activitiesConfig } from '~/activity.config'
import useSearch from '~/composables/useSearch'
import useDynamicFilter from '~/composables/useDynamicFilter'
import { getBadgeProps } from '~/composables/useLabelMapBadge'
import * as locales from '@bitrix24/b24ui-nuxt/locale'
import type { IActivity } from '~/types'
import type { Collections } from '@nuxt/content'
import FileCheckIcon from '@bitrix24/b24icons-vue/main/FileCheckIcon'
import Settings1Icon from '@bitrix24/b24icons-vue/main/SettingsIcon'
import SearchIcon from '@bitrix24/b24icons-vue/button/SearchIcon'
import CheckIcon from '@bitrix24/b24icons-vue/main/CheckIcon'

const { locale, t, defaultLocale } = useI18n()

definePageMeta({
  layout: false
})

useHead({
  title: t('page.list.seo.title')
})

const $logger = LoggerBrowser.build(
  'Activity-List',
  import.meta.env?.DEV === true
)

const { initApp } = useAppInit()

// region Init ////
const isShowDebug = ref(false)
const isLoading = ref(true)
const toast = useToast()
const overlay = useOverlay()
const modalLoader = overlay.create(ModalLoader)
const modalConfirm = overlay.create(ActivityItemModalConfirm)
const activitySliderDetail = overlay.create(ActivityItemSliderDetail)
const activities = ref<IActivity[]>([])

const config = useRuntimeConfig()
const appUrl = config.public.appUrl

/**
 * @todo remove this
 */
const $b24 = new B24Hook({
  b24Url: config.public.b24HookUrl,
  userId: config.public.b24HookUserId,
  secret: config.public.b24HookSecret
})
$b24.setLogger(LoggerBrowser.build('Core', false))
// endregion ////

// region Locale ////
const dir = computed(() => locales[locale.value]?.dir || 'ltr')
const contentCollection = computed<keyof Collections>(() => `contentActivities_${locale.value.length > 0 ? locale.value : defaultLocale}`)
// endregion ////

// region Search ////
const appSettings = useAppSettingsStore()
const userSettings = useUserSettingsStore()
const { searchQuery } = storeToRefs(userSettings)
const {
  filterBadges,
  activitiesList
} = useSearch(activities)
// endregion ////

// region Data ////
async function loadData(): Promise<void> {
  const data = await queryCollection(contentCollection.value)
    .select(
      'path',
      'title',
      'description',
      'categories',
      'badges',
      'avatar'
    )
    .all()

  activities.value = data.map(
    activity => ({
      ...activity,
      isInstall: appSettings.activityInstalled.includes(activity.path)
    } as IActivity)
  )
}
// endregion ////

// region Actions ////
async function showSlider(activity: IActivity): Promise<void> {
  activitySliderDetail.open({
    activity
  })
}

const getActivityCodeFromPath = (path: string) => {
  const parts = path.split('/').filter(part => part !== '')
  return parts.length > 0 ? parts[parts.length - 1] : null
}

const mapProperties = (properties: ActivityConfig['properties']) => {
  return Object.entries(properties).reduce((acc, [key, config]) => ({
    ...acc,
    [key]: {
      Name: config.name,
      Type: config.type === 'select' ? 'string' : 'text',
      Required: config.required ? 'Y' : 'N'
    }
  }), {})
}

async function makeInstall(activity: IActivity): Promise<void> {
  modalLoader.open()

  const activityCode = getActivityCodeFromPath(activity.path)
  if (!activityCode) {
    throw new Error(`No activity code in path: ${activity.path}`)
  }

  const activityConfig = activitiesConfig.find(a => a.code.toLowerCase() === activityCode.toLowerCase())
  if (!activityConfig) {
    throw new Error(`No activity config by code: ${activityCode}`)
  }

  const params = {
    CODE: activityConfig.code,
    NAME: activityConfig.name || activity.title || activityConfig.code,
    HANDLER: `${appUrl}${activityConfig.handler}`,
    PROPERTIES: mapProperties(activityConfig.properties)
  }

  $logger.info(
    params,
    activityCode,
    activityConfig
  )

  const response = await $b24.callMethod(
    'server.time',
    {}
  )

  $logger.warn(
    response.toString()
  )

  /**
   * @todo move to store
   */
  if (!appSettings.activityInstalled.includes(activity.path)) {
    appSettings.activityInstalled.push(activity.path)
    await appSettings.saveSettings()
  }

  activity.isInstall = true

  modalLoader.close()

  toast.add({
    title: t('page.list.make.install.success.title'),
    description: t(
      'page.list.make.install.success.description', {
        title: activity.title
      }
    ),
    avatar: activity.avatar
      ? { src: activity.avatar }
      : undefined,
    icon: activity?.avatar ? undefined : FileCheckIcon,
    color: 'success'
  })
}

async function makeUnInstall(activity: IActivity): Promise<void> {
  const isConfirm = await modalConfirm.open({
    activity
  })

  if (!isConfirm) {
    return
  }

  modalLoader.open()
  activity.isInstall = false

  /**
   * @todo move to store
   */
  const index = appSettings.activityInstalled.indexOf(activity.path)

  if (index !== -1) {
    appSettings.activityInstalled.splice(index, 1)
    await appSettings.saveSettings()
  }

  toast.add({
    title: t('page.list.make.uninstall.success.title'),
    description: t(
      'page.list.make.uninstall.success.description', {
        title: activity.title
      }
    ),
    avatar: activity.avatar
      ? { src: activity.avatar }
      : undefined,
    icon: activity?.avatar ? undefined : FileCheckIcon,
    color: 'success'
  })

  modalLoader.close()
}
// endregion ////

// region Filter ////
const searchResults = useDynamicFilter<IActivity>(
  searchQuery,
  activitiesList,
  ['title', 'description', 'categories', 'badges'],
  {
    includeScore: true
  }
)
// endregion ////

// region Lifecycle Hooks ////
onMounted(async () => {
  try {
    isLoading.value = true

    await initApp()
    await loadData()

    /**
     * @todo get from b24 info about install
     */
    isLoading.value = false
  } catch (error: any) {
    /**
     * @todo fix error
     */
    // $logger.error(error)
    showError({
      statusCode: 404,
      statusMessage: error?.message || error,
      data: {
        description: t('error.onMounted'),
        homePageIsHide: true,
        isShowClearError: true,
        clearErrorHref: '/'
      },
      cause: error,
      fatal: true
    })
  }
})

onUnmounted(() => {
  // $b24?.destroy()
})
// endregion ////
</script>

<template>
  <NuxtLayout name="dashboard">
    <template #header-title>
      <ProseH1 class="mt-3 mb-0 max-lg:ps-3">
        {{ $t('page.list.seo.title') }}
      </ProseH1>
    </template>

    <ActivityListSkeleton v-if="isLoading" />
    <template v-else>
      <div class="my-8 relative">
        <B24ButtonGroup no-split class="max-lg:ps-3 min-w-[110px] max-w-[400px]">
          <B24Input
            v-model="searchQuery"
            type="search"
            :icon="SearchIcon"
            :placeholder="$t('page.list.ui.searchInput.placeholder')"
            class="min-w-[110px] max-w-[400px]"
            rounded
          />
          <B24DropdownMenu
            :items="filterBadges"
            :content="{
              align: 'start',
              side: dir === 'ltr' ? 'left' : 'right',
              sideOffset: 2
            }"
            :b24ui="{
              content: 'w-[240px] max-h-[245px]'
            }"
          >
            <B24Button
              rounded
              color="link"
              depth="dark"
            >
              <template #leading>
                <Settings1Icon class="size-8" />
                <B24Chip
                  v-if="userSettings.isSomeBadgeActive"
                  standalone
                  class="absolute top-0 ltr:right-2 rtl:left-2"
                  size="2xs"
                  color="primary"
                />
              </template>
            </B24Button>
          </B24DropdownMenu>
        </B24ButtonGroup>
      </div>

      <div
        v-if="searchResults.length"
        class="grid grid-cols-[repeat(auto-fill,minmax(310px,1fr))] gap-sm"
      >
        <template v-for="(activity, activityIndex) in searchResults" :key="activityIndex">
          <div
            class="relative bg-white dark:bg-white/10 p-sm2 cursor-pointer rounded-md flex flex-row gap-sm border-2 transition-shadow shadow hover:shadow-lg hover:border-primary"
            :class="[
              activity?.isInstall ? 'border-green-300 dark:border-green-800' : 'border-base-master/10 dark:border-base-100/20'
            ]"
            @click.stop="async () => { return showSlider(activity) }"
          >
            <div
              v-if="activity?.isInstall"
              class="absolute -top-2 ltr:right-3 rtl:left-3 rounded-full bg-green-400 dark:bg-green-800 size-5 text-white flex items-center justify-center"
            >
              <CheckIcon class="size-md" />
            </div>
            <B24Avatar
              v-if="activity.avatar"
              :src="activity.avatar"
              size="xl"
              class="border-2"
              :class="[
                activity?.isInstall ? 'border-green-300 dark:border-green-800' : 'border-blue-400'
              ]"
              :b24ui="{
                root: activity?.isInstall ? 'bg-green-300 dark:bg-green-800' : 'bg-blue-150 dark:bg-blue-400',
                icon: activity?.isInstall ? 'text-green-300 dark:text-green-800' : 'text-blue-400 dark:text-blue-900'
              }"
            />
            <div class="w-full flex flex-col items-start justify-between gap-2">
              <div>
                <div v-if="activity.title" class="font-b24-secondary text-black dark:text-base-150 text-h6 leading-4 mb-xs font-semibold line-clamp-1">
                  <div>{{ activity.title }}</div>
                </div>
                <div v-if="activity.badges" class="mb-2 w-full flex flex-row flex-wrap items-start justify-start gap-2">
                  <B24Badge
                    v-for="(badge, badgeIndex) in activity.badges"
                    :key="badgeIndex"
                    size="xs"
                    :label="$t(`composables.useSearchInput.badge.${badge}`)"
                    v-bind="getBadgeProps(badge)"
                  />
                </div>
                <div v-if="activity.description" class="font-b24-primary text-sm text-base-500 line-clamp-2">
                  <div>{{ activity.description }}</div>
                </div>
              </div>
              <div class="w-full flex flex-row gap-1 items-center justify-end">
                <B24Button
                  v-if="!activity.isInstall"
                  size="xs"
                  rounded
                  :label="$t('page.list.ui.make.install')"
                  color="primary"
                  loading-auto
                  @click.stop="async () => { return makeInstall(activity) }"
                />
                <B24Button
                  v-else
                  size="xs"
                  rounded
                  :label="$t('page.list.ui.make.uninstall')"
                  color="default"
                  depth="light"
                  loading-auto
                  @click.stop="async () => { return makeUnInstall(activity) }"
                />
              </div>
            </div>
          </div>
        </template>
      </div>

      <ActivityListEmpty v-else />

      <ProsePre v-if="isShowDebug">
        {{ activities }}
      </ProsePre>
    </template>
  </NuxtLayout>
</template>
