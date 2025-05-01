/**
 * Some info about User
 * @memo not save to settings
 */
export const useUserStore = defineStore(
  'user',
  () => {
    // region State ////
    const login = ref('')
    const isAdmin = ref(false)
    // endregion ////

    // region Actions ////
    /**
     * Initialize store from batch response data
     * @param data - Raw data from Bitrix24 API
     * @param data.NAME
     * @param data.LAST_NAME
     * @param data.ADMIN
     */
    function initFromBatch(data: {
      NAME?: string
      LAST_NAME?: string
      ADMIN?: boolean
    }) {
      login.value = [data?.NAME, data?.LAST_NAME].filter(Boolean).join(' ') || ' '
      isAdmin.value = data.ADMIN || false
    }
    // endregion ////

    return {
      login,
      isAdmin,
      initFromBatch
    }
  }
)
