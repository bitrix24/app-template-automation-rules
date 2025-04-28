<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { B24Hook, LoggerBrowser, AjaxError } from '@bitrix24/b24jssdk'
import { ModalLoader, ActivityItemModalConfirm, ActivityItemSliderDetail, ActivityListSkeleton, ActivityListEmpty } from '#components'
import { useUserSettingsStore } from '~/stores/userSettings'
import { useAppSettingsStore } from '~/stores/appSettings'
import { activitiesConfig } from '~/activity.config'
import useSearch from '~/composables/useSearch'
import useDynamicFilter from '~/composables/useDynamicFilter'
import { getBadgeProps } from '~/composables/useLabelMapBadge'
import * as locales from '@bitrix24/b24ui-nuxt/locale'
import type { IActivity } from '~/types'
import type { ActivityConfig, ActivityProperty } from '~/activity.config'
import type { Collections } from '@nuxt/content'
import FileCheckIcon from '@bitrix24/b24icons-vue/main/FileCheckIcon'
import Settings1Icon from '@bitrix24/b24icons-vue/main/SettingsIcon'
import SearchIcon from '@bitrix24/b24icons-vue/button/SearchIcon'
import CheckIcon from '@bitrix24/b24icons-vue/main/CheckIcon'
import CloudErrorIcon from '@bitrix24/b24icons-vue/main/CloudErrorIcon'

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
const getActivityCodeFromPath = (path: string) => {
  const parts = path.split('/').filter(part => part !== '')
  return parts.length > 0 ? parts[parts.length - 1] : null
}

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

  activities.value = data.map((activity) => {
    const activityCode = getActivityCodeFromPath(activity.path)
    if (!activityCode) {
      throw new Error(`No activity code in path: ${activity.path}`)
    }

    return ({
      ...activity,
      code: activityCode,
      isInstall: appSettings.isActivityInstalled(activityCode)
    } as IActivity)
  })
}
// endregion ////

// region Actions ////
async function showSlider(activity: IActivity): Promise<void> {
  activitySliderDetail.open({
    activity
  })
}

const mapProperties = (properties: Record<string, ActivityProperty>) => {
  return Object.entries(properties).reduce((acc, [key, config]) => ({
    ...acc,
    [key]: {
      Name: config.Name,
      Description: config.Description,
      Type: config.Type,
      Options: config.Options,
      Required: config.Required,
      Multiple: config.Multiple,
      Default: config.Default
    }
  }), {})
}

async function makeInstall(activity: IActivity): Promise<void> {
  try {
    modalLoader.open()
    const activityCode = activity.code
    if (!activityCode) {
      throw new Error(`No activity code in path: ${activity.path}`)
    }

    const activityConfig = activitiesConfig.find(a => a.CODE.toLowerCase() === activityCode.toLowerCase())
    if (!activityConfig) {
      throw new Error(`No activity config by code: ${activityCode}`)
    }

    const params: ActivityConfig = {
      CODE: activityConfig.CODE,
      HANDLER: `${appUrl}${activityConfig?.HANDLER || ('/api/activities/' + activityConfig.CODE)}`,
      NAME: activityConfig.NAME || activity.title || activityConfig.CODE,
      DESCRIPTION: activityConfig.DESCRIPTION || activity.description || activityConfig.CODE,
      PROPERTIES: activityConfig.PROPERTIES
        ? mapProperties(activityConfig.PROPERTIES)
        : undefined,
      RETURN_PROPERTIES: activityConfig.RETURN_PROPERTIES
        ? mapProperties(activityConfig.RETURN_PROPERTIES)
        : undefined,
      FILTER: activityConfig.FILTER,
      USE_PLACEMENT: activityConfig.USE_PLACEMENT || 'N',
      PLACEMENT_HANDLER: `${appUrl}${activityConfig?.PLACEMENT_HANDLER || ('/setting/' + activityConfig.CODE)}`,
      USE_SUBSCRIPTION: activityConfig.USE_SUBSCRIPTION || 'N',
      AUTH_USER_ID: activityConfig.AUTH_USER_ID || 1
    }

    const response = await $b24.callMethod(
      activityConfig.type === 'robot' ? 'bizproc.robot.add' : 'bizproc.activity.add',
      params
    )

    $logger.warn(
      response.toString()
    )

    /**
     * @todo move to store
     */
    if (!appSettings.isActivityInstalled(activityConfig.CODE)) {
      appSettings.activityInstalled.push(activityConfig.CODE)
      await appSettings.saveSettings()
    }
    activity.isInstall = true

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
  } catch (error) {
    processError(error)
  } finally {
    modalLoader.close()
  }
}

async function makeUnInstall(activity: IActivity): Promise<void> {
  try {
    const activityCode = activity.code
    if (!activityCode) {
      throw new Error(`No activity code in path: ${activity.path}`)
    }

    const activityConfig = activitiesConfig.find(a => a.CODE.toLowerCase() === activityCode.toLowerCase())
    if (!activityConfig) {
      throw new Error(`No activity config by code: ${activityCode}`)
    }

    const isConfirm = await modalConfirm.open({
      activity
    })

    if (!isConfirm) {
      return
    }

    modalLoader.open()
    const response = await $b24.callMethod(
      activityConfig.type === 'robot' ? 'bizproc.robot.delete' : 'bizproc.activity.delete',
      {
        CODE: activityConfig.CODE
      }
    )

    $logger.warn(
      response.toString()
    )

    /**
     * @todo move to store
     */
    const index = appSettings.activityInstalled.findIndex(
      item => item.toLowerCase() === activityCode.toLowerCase()
    )
    if (index !== -1) {
      appSettings.activityInstalled.splice(index, 1)
      await appSettings.saveSettings()
    }

    activity.isInstall = false

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
  } catch (error) {
    processError(error)
  } finally {
    modalLoader.close()
  }
}

function processError(error: unknown | string | Error) {
  let title = 'Error'
  let description = ''
  $logger.error(error)
  if (error instanceof AjaxError) {
    title = `[${error.name}] ${error.code} (${error.status})`
    description = `${error.message}`
  } else if (error instanceof Error) {
    description = error.message
  } else {
    description = error as string
  }

  toast.add({
    title: title,
    description,
    color: 'danger',
    icon: CloudErrorIcon
  })
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
