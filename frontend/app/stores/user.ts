/**
 * Some info about User
 * @memo not save this settings (persist: false)
 * @todo get all from b24
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
     * @param data.IS_ADMIN
     */
    function initFromBatch(data: {
      NAME?: string
      IS_ADMIN?: boolean
    }) {
      login.value = data.NAME || ''
      isAdmin.value = data.IS_ADMIN || false
    }
    // endregion ////

    return {
      login,
      isAdmin,
      initFromBatch
    }
  }
)
