import { LoggerBrowser } from '@bitrix24/b24jssdk'
import type { RouteLocationNormalized } from 'vue-router'

const $logger = LoggerBrowser.build(
  'middleware:app.page.or.slider.global',
  import.meta.dev
)

const baseDir = '/'

function isSkipB24(toPath: string): boolean {
  return !toPath.includes(`${baseDir}`)
    || toPath.includes(`${baseDir}eula`)
    || toPath.includes(`${baseDir}render`)
}

export default defineNuxtRouteMiddleware(async (
  to: RouteLocationNormalized,
  from: RouteLocationNormalized
) => {
  const isUseB24Frame = useState('isUseB24Frame', () => true)
  /**
   * @memo skip middleware on server
   */
  if (import.meta.server) {
    return
  }

  $logger.log('>> start', {
    to: to.path,
    from: from.path
  })

  if (isSkipB24(to.path)) {
    isUseB24Frame.value = false
    $logger.log('middleware >> Skip')
    return Promise.resolve()
  }

  try {
    const { $initializeB24Frame } = useNuxtApp()
    const $b24 = await $initializeB24Frame()

    $logger.log('>> placement.options', $b24.placement.options)

    if ($b24.placement.options?.place) {
      const optionsPlace: string = $b24.placement.options.place
      let goTo: null | string = null

      if (optionsPlace === 'activity-list') {
        goTo = `${baseDir}activity-list`
      }
      // else if (optionsPlace === 'feedback') {
      //   goTo = `${baseDir}feedback`
      // }

      if (
        null !== goTo
          && to.path !== goTo
      ) {
        $logger.log(`middleware >> ${goTo}`)
        return navigateTo(goTo)
      }
    }

    $logger.log('>> stop')
  } catch (error: any) {
    const appError = createError({
      statusCode: 404,
      statusMessage: error?.message || error,
      data: {
        description: 'Problem in middleware',
        homePageIsHide: false
      },
      cause: error,
      fatal: true
    })

    $logger.error(appError)

    showError(appError)
    return Promise.reject(appError)
  }
})
