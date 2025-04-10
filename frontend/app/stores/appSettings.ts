import { sleepAction } from '~/utils/sleep'

/**
 * Some info about App
 * @todo not save this settings (persist: false)
 * @todo get all from b24
 * @todo fix lang
 */
export const useAppSettingsStore = defineStore(
  'appSettings',
  () => {
    // region State ////
    const version = ref('0.00')
    const isTrial = ref(true)
    const integrator = reactive({
      logo: '',
      company: '',
      phone: '',
      email: '',
      whatsapp: '',
      telegram: '',
      site: '',
      comments: ''
    })
    const activityInstalled = reactive<string[]>([])
    // endregion ////

    // region Actions ////
    /**
     * Initialize store from batch response data
     * @param data - Raw data from Bitrix24 API
     * @param data.version
     * @param data.isTrial
     * @param data.integrator
     */
    function initFromBatch(data: {
      version?: string
      isTrial?: boolean
      integrator?: typeof integrator
    }) {
      version.value = data.version || '1.0.0'
      isTrial.value = data.isTrial ?? true
      if (data.integrator) {
        Object.assign(integrator, data.integrator)
      }
    }

    /**
     * Initialize store from batch response data
     * @param activityList - Raw data from Bitrix24 API
     */
    function initFromBatchByActivityInstalled(
      activityList: string[]
    ) {
      Object.assign(activityInstalled, activityList)
    }

    /**
     * Save settings to Bitrix24
     */
    const saveSettings = async () => {
      // Implementation for direct update
      console.warn(
        '>> b24.save:app.options',
        {
          integrator,
          activityInstalled
        }
      )
      await sleepAction(1000)
    }

    const updateIntegrator = (params: Partial<typeof integrator>) => {
      Object.assign(integrator, params)
      saveSettings()
    }

    const integratorPreview = computed(() => {
      const result = []
      if (integrator.phone.length) {
        result.push({
          label: 'Phone',
          code: 'phone',
          description: integrator.phone
        })
      }
      if (integrator.email.length) {
        result.push({
          label: 'E-mail',
          code: 'email',
          description: integrator.email
        })
      }
      if (integrator.telegram.length) {
        result.push({
          label: 'Telegram',
          code: 'telegram',
          description: integrator.telegram
        })
      }
      if (integrator.whatsapp.length) {
        result.push({
          label: 'WhatsApp',
          code: 'whatsapp',
          description: integrator.whatsapp
        })
      }
      if (integrator.site.length) {
        result.push({
          label: 'Website',
          code: 'site',
          description: integrator.site
        })
      }
      if (integrator.comments.length) {
        result.push({
          label: 'Comments',
          code: 'comments',
          description: integrator.comments
        })
      }

      return result
    })
    // endregion ////

    return {
      version,
      isTrial,
      initFromBatch,
      initFromBatchByActivityInstalled,
      saveSettings,
      integrator,
      updateIntegrator,
      integratorPreview,
      activityInstalled
    }
  }
)
