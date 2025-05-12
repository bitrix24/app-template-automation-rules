<script setup lang="ts">
import { ref, onMounted } from 'vue'
import type { ProgressProps } from '@bitrix24/b24ui-nuxt'
import type { IStep } from '~/types'
import { sleepAction } from '~/utils/sleep'
import Logo from '~/components/Logo.vue'

const { t } = useI18n()

useHead({
  title: t('page.install.seo.title')
})

// region Init ////
const config = useRuntimeConfig()
const appUrl = config.public.appUrl

const { processErrorGlobal } = useAppInit()
const { $initializeB24Frame } = useNuxtApp()
const $b24 = await $initializeB24Frame()

const confetti = useConfetti()

const isShowDebug = ref(false)

const progressColor = ref<ProgressProps['color']>('primary')
const progressValue = ref<null | number>(null)
// endregion ////

// region Steps ////
const steps = ref<Record<string, IStep>>({
  init: {
    caption: t('page.install.step.init.caption'),
    action: makeInit
  },
  events: {
    caption: t('page.install.step.events.caption'),
    action: async () => {
      /**
       * Registering onAppInstall | onAppUninstall
       */
      await $b24.callBatch([
        {
          method: 'event.bind',
          params: {
            event: 'ONAPPINSTALL',
            handler: `${appUrl}/api/event/onAppInstall`
          }
        },
        {
          method: 'event.bind',
          params: {
            event: 'ONAPPUNINSTALL',
            handler: `${appUrl}/api/event/onAppUninstall`
          }
        }
      ])
    }
  },
  // placement: {
  //   caption: t('page.install.step.placement.caption'),
  //   action: async () => {
  //     /**
  //      * Registering placement
  //      */
  //     if (steps.value.placement) {
  //       steps.value.placement.data = {
  //         par21: 'val21',
  //         par22: 'val22'
  //       }
  //     }
  //
  //     return sleepAction()
  //   }
  // },
  // crm: {
  //   caption: t('page.install.step.crm.caption'),
  //   action: async () => {
  //     /**
  //      * Some actions for crm
  //      */
  //     if (steps.value.crm) {
  //       steps.value.crm.data = {
  //         par31: 'val31',
  //         par32: 'val32'
  //       }
  //     }
  //     return sleepAction()
  //   }
  // },
  finish: {
    caption: t('page.install.step.finish.caption'),
    action: makeFinish
  }
})
const stepCode = ref<string>('init' as const)
// endregion ////

// region Actions ////
async function makeInit(): Promise<void> {
  /**
   * @todo add lang
   */
  await $b24.parent.setTitle('App: install')

  if (steps.value.init) {
    steps.value.init.data = {
      par11: 'val11',
      par12: 'val12'
    }
  }

  return sleepAction()
}

async function makeFinish(): Promise<void> {
  progressColor.value = 'success'
  progressValue.value = 100

  confetti.fire()
  await sleepAction(2000)

  await $b24.installFinish()
}

const stepsData = computed(() => {
  return Object.entries(steps.value).map(([index, row]) => {
    return {
      step: index,
      data: row?.data
    }
  })
})
// endregion ////

// region Lifecycle Hooks ////
onMounted(async () => {
  try {
    for (const [key, step] of Object.entries(steps.value)) {
      stepCode.value = key
      await step.action()
    }
  } catch (error: any) {
    processErrorGlobal(error, {
      homePageIsHide: true,
      isShowClearError: false
    })
  }
})
// endregion ////
</script>

<template>
  <div class="mx-3 flex flex-col items-center justify-center gap-1 h-dvh">
    <Logo
      class="size-52"
      :class="[
        stepCode === 'finish' ? 'text-green-500' : 'text-base-500'
      ]"
    />
    <B24Progress
      v-model="progressValue"
      size="xs"
      animation="elastic"
      :color="progressColor"
      class="w-1/2 sm:w-1/3"
    />
    <div class="mt-6 flex flex-col items-center justify-center gap-2">
      <div class="text-h1 text-nowrap">
        {{ $t('page.install.ui.title') }}
      </div>
      <div class="text-base-500">
        {{ steps[stepCode]?.caption || '...' }}
      </div>
    </div>

    <ProsePre v-if="isShowDebug">
      {{ stepsData }}
    </ProsePre>
  </div>
</template>
