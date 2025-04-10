import { watch } from 'vue'
import { useDebounce } from '@vueuse/core'
import type { FilterSetting, IActivity } from '~/types'
import { EActivityBadge } from '~/types'
import { useUserSettingsStore } from '~/stores/userSettings'
import { storeToRefs } from 'pinia'

const useSearch = (
  activities: Ref<IActivity[]>
) => {
  const { t } = useI18n()

  const userSettings = useUserSettingsStore()
  const { searchQuery } = storeToRefs(userSettings)

  const searchQueryDebounced = useDebounce(searchQuery, 200)

  // region Badge ////
  const filterBadges = computed<FilterSetting[]>(() => {
    const badges = Object.values(EActivityBadge)
    const notInstallIndex = badges.indexOf(EActivityBadge.NotInstall)

    const badgesWithSeparator: ('separator' | EActivityBadge)[] = [...badges]
    if (notInstallIndex !== -1) {
      badgesWithSeparator.splice(notInstallIndex + 1, 0, 'separator')
    }

    return badgesWithSeparator.map((item: 'separator' | EActivityBadge) => {
      if (item === 'separator') {
        return { type: 'separator' as const }
      }

      const badge = item as EActivityBadge

      return {
        label: t(`composables.useSearchInput.badge.${badge}`),
        type: 'checkbox' as const,
        checked: userSettings.filterParams.badge.get(badge),
        async onUpdateChecked(checked: boolean) {
          userSettings.filterParams.badge.set(badge, checked)
          if (
            badge === EActivityBadge.Install
            && checked
            && userSettings.filterParams.badge.get(EActivityBadge.NotInstall)
          ) {
            userSettings.filterParams.badge.set(EActivityBadge.NotInstall, false)
          } else if (
            badge === EActivityBadge.NotInstall
            && checked
            && userSettings.filterParams.badge.get(EActivityBadge.Install)
          ) {
            userSettings.filterParams.badge.set(EActivityBadge.Install, false)
          }

          await userSettings.saveSettings()
        },
        onSelect(e: Event) {
          e.preventDefault()
        }
      }
    })
  })
  // endregion ////

  // region Activities ////
  const activitiesList = computed(() => {
    let list = activities.value.filter((activity) => {
      if (userSettings.filterParams.category === 'all') {
        return true
      }

      return activity.categories?.includes(userSettings.filterParams.category)
    })

    if (userSettings.activeBadges.length > 0) {
      list = list.filter((activity) => {
        return userSettings.activeBadges.every((badge) => {
          if (badge === EActivityBadge.Install) {
            return activity.isInstall === true
          } else if (badge === EActivityBadge.NotInstall) {
            return activity.isInstall !== true
          }

          return activity.badges?.includes(badge)
        })
      })
    }

    return list
  })
  // endregion ////

  // region Watch ////
  watch(searchQueryDebounced, async () => {
    await userSettings.saveSettings()
  })
  // endregion ////

  return {
    searchQueryDebounced,
    filterBadges,
    activitiesList
  }
}

export default useSearch
