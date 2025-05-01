import type { EActivityCategory, IFilterParams } from '~/types'
import { EActivityBadge } from '~/types'
import type { B24Frame } from '@bitrix24/b24jssdk'

/**
 * Some data for user
 */
export const useUserSettingsStore = defineStore(
  'userSettings',
  () => {
    let $b24: null | B24Frame = null

    // region State ////
    const searchQuery = ref<string>('')
    const filterParams = reactive<IFilterParams>({
      category: 'all',
      badge: new Map(
        Object.values(EActivityBadge).map(key => [key, false])
      )
    })
    // endregion ////

    // region Actions ////
    function setB24(b24: B24Frame) {
      $b24 = b24
    }

    /**
     * Initialize store from batch response data
     * @param data - Raw data from Bitrix24 API
     * @param data.searchQuery
     * @param data.filterParams
     * @param data.filterParams.category
     * @param data.filterParams.badge
     */
    const initFromBatch = (data: {
      searchQuery?: string
      filterParams?: {
        category: 'all' | EActivityCategory
        badge: EActivityBadge[]
      }
    }) => {
      searchQuery.value = data.searchQuery || ''

      if (data.filterParams?.category) {
        filterParams.category = data.filterParams.category
      }

      if (data.filterParams?.badge) {
        data.filterParams.badge.forEach((badge) => {
          if (filterParams.badge.has(badge)) {
            filterParams.badge.set(badge, true)
          }
        })
      }
    }

    /**
     * Save settings to Bitrix24
     */
    const saveSettings = async () => {
      if ($b24 === null) {
        console.error('B24 non init. Use userSettings.setB24()')
        return
      }

      return $b24.callMethod(
        'user.option.set',
        {
          searchQuery: searchQuery.value,
          filterParams: {
            category: filterParams.category,
            badge: activeBadges.value
          }
        }
      )
    }

    /**
     * Clear filter params
     */
    const clearFilter = async () => {
      searchQuery.value = ''

      Object.values(EActivityBadge).forEach((badge) => {
        filterParams.badge.set(badge, false)
      })

      return saveSettings()
    }

    const isSomeBadgeActive = computed<boolean>(() => {
      for (const value of filterParams.badge.values()) {
        if (value) {
          return true
        }
      }
      return false
    })

    const activeBadges = computed<EActivityBadge[]>(() => {
      return Array.from(filterParams.badge.entries())
        .filter(([_, isActive]) => isActive)
        .map(([badge]) => badge)
    })
    // endregion ////

    return {
      searchQuery,
      filterParams,
      setB24,
      initFromBatch,
      saveSettings,
      clearFilter,
      isSomeBadgeActive,
      activeBadges
    }
  }
)
