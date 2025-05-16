import { LoggerBrowser, AjaxError } from '@bitrix24/b24jssdk'
import type { B24Frame } from '@bitrix24/b24jssdk'
import { Salt } from '~/services/salt'

export interface ProcessErrorData {
  description?: string
  isShowClearError?: boolean
  clearErrorHref?: string
  clearErrorTitle?: string
  homePageIsHide?: boolean
  homePageHref?: string
  homePageTitle?: string
}

const { clearSalt } = Salt()
/**
 * Composable handling application initialization
 * Coordinates data loading via batch request
 */
export const useAppInit = (loggerTitle?: string) => {
  const $logger = LoggerBrowser.build(
    loggerTitle ?? 'App',
    import.meta.dev
  )

  // Stores
  const appSettings = useAppSettingsStore()
  const userSettings = useUserSettingsStore()
  const user = useUserStore()

  /**
   * Initialize application data
   * Performs batch request and updates all stores
   */
  const initApp = async ($b24: B24Frame) => {
    const commands = {
      appInfo: { method: 'app.info' },
      appSettings: { method: 'app.option.get' },
      userSettings: { method: 'user.option.get' },
      profileData: { method: 'profile' },
      activityList: { method: 'bizproc.activity.list' },
      robotList: { method: 'bizproc.robot.list' }
    }

    const response = await $b24.callBatch(commands)

    const data = response.getData()
    $logger.log('Init data >>', data)

    // Update stores with received data
    user.initFromBatch({
      NAME: data.profileData?.NAME,
      LAST_NAME: data.profileData?.LAST_NAME,
      ADMIN: data.profileData?.ADMIN === true
    })

    appSettings.setB24($b24)
    appSettings.initFromBatchByActivityInstalled([
      ...(data.activityList || []),
      ...(data.robotList || [])
    ].map(row => clearSalt(row)))

    /**
     * @todo from props
     */
    appSettings.initFromBatch({
      version: data.appInfo?.VERSION || '0.0.1',
      isTrial: data.appInfo?.STATUS === 'T',
      integrator: data.appSettings?.integrator || {}
    })

    userSettings.setB24($b24)
    userSettings.initFromBatch({
      searchQuery: data.userSettings?.searchQuery || '',
      filterParams: data.userSettings?.filterParams
    })
  }

  function processErrorGlobal(
    error: unknown | string | Error,
    pocessErrorData?: ProcessErrorData
  ) {
    $logger.error(error)

    let title = 'Error'
    let description = ''

    if (error instanceof AjaxError) {
      title = `[${error.name}] ${error.code} (${error.status})`
      description = `${error.message}`
    } else if (error instanceof Error) {
      description = error.message
    } else {
      description = error as string
    }

    showError({
      statusCode: 404,
      statusMessage: title,
      data: Object.assign({
        description: description,
        homePageIsHide: true,
        isShowClearError: true,
        clearErrorHref: '/'
      }, (pocessErrorData || {})),
      cause: error,
      fatal: true
    })
  }

  return {
    $logger,
    initApp,
    processErrorGlobal
  }
}
