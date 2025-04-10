// import type { BatchCommands, BitrixBatchResponse } from '~/types/bitrix'
// import { useBitrix } from '~/services/bitrix'
import type { EActivityBadge } from '~/types'

/**
 * Composable handling application initialization
 * Coordinates data loading via batch request
 */
export const useAppInit = () => {
  // Stores
  const appSettings = useAppSettingsStore()
  const userSettings = useUserSettingsStore()
  const user = useUserStore()

  // Services
  // const bitrix = useBitrix()

  /**
   * Initialize application data
   * Performs batch request and updates all stores
   */
  const initApp = async () => {
    try {
      // Define batch commands for initial data
      // const commands: BatchCommands = {
      //   appSettings: 'app.option.get',
      //   userSettings: 'user.option.get',
      //   userData: 'user.current'
      // }
      //
      // type InitCommands = typeof commands
      // type BatchResponse = BitrixBatchResponse<InitCommands>
      //
      // // Execute batch request
      // const batchData = await bitrix.batch<BatchResponse>(commands)

      // /api-reference/bizproc/bizproc-robot/bizproc-robot-list.html
      // /api-reference/bizproc/bizproc-activity/bizproc-activity-list.html

      // region logo ////
      const logoData = 'data:image/webp;base64,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'
      // endregion ////

      // Update stores with received data
      appSettings.initFromBatch({
        version: '0.0.1',
        isTrial: true,
        integrator: {
          logo: logoData,
          company: 'DemoSomeCompany',
          phone: '+098 76 543-21-00',
          email: 'contact-1@example.com',
          whatsapp: 'https://wa.me/123',
          telegram: 'https://t.me/123',
          site: 'https://example.com',
          comments: 'Important information'
        }
      })
      appSettings.initFromBatchByActivityInstalled([
        '/activities/en/appmarketplace',
        '/activities/en/emailmarketing',
        '/activities/en/sustainabilityinitiatives'
      ])

      userSettings.initFromBatch({
        searchQuery: '',
        filterParams: {
          category: 'all',
          badge: ['badge_2' as EActivityBadge]
        }
      })

      user.initFromBatch({
        NAME: 'SomeUserLogin',
        IS_ADMIN: true
      })
    } catch (error) {
      console.error('Application initialization failed:', error)
      // Handle errors appropriately
    }
  }

  return { initApp }
}
