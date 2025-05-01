<script setup lang="ts">
/**
 * @todo make layout template
 *
 * @link https://apidocs.bitrix24.com/tutorials/bizproc/setting-robot.html
 */
import { ref, computed, onMounted } from 'vue'
import { activitiesConfig } from '~/activity.config'
import { ActivitySettings } from '#components'

definePageMeta({
  layout: 'clear'
})

// const { t } = useI18n()
const activityCode = ref<string>((useRoute().params?.code as string) || '')
const activityConfig = computed(() =>
  activitiesConfig.find(a => a.CODE.toLowerCase() === activityCode.value.toLowerCase())
)

/**
 * @todo add lang
 */
useHead({
  title: 'Some activity settings'
})

// region Init ////
const { $logger, processErrorGlobal } = useAppInit()
const { $initializeB24Frame } = useNuxtApp()
const $b24 = await $initializeB24Frame()

const isLoading = ref(true)
const formValues = ref<Record<string, any>>({})
// endregion ////

// region Lifecycle Hooks ////
onMounted(async () => {
  try {
    isLoading.value = true

    activityCode.value = $b24.placement.options?.code || 'notSetInPlacementOptions'
    formValues.value = $b24.placement.options?.current_values || {}

    if (activityConfig.value) {
      const initialValues: Record<string, any> = {}

      for (const [key, prop] of Object.entries(activityConfig.value.PROPERTIES || {})) {
        // if (prop.Type === 'select' && prop.Options?.length < 1) {
        //   /**
        //    * @todo fix this
        //    */
        //   // const options = await bx.loadOptions(getMethodByKey(key))
        //   const options = [
        //     { value: '???', label: '???' }
        //   ]
        //   prop.Options = options
        // }

        initialValues[key] = prop.Default || getEmptyValue(prop.Type)
        if (formValues.value[key] !== undefined) {
          initialValues[key] = formValues.value[key]
        }
      }

      formValues.value = initialValues
    }

    isLoading.value = false

    await makeFitWindow()
  } catch (error) {
    processErrorGlobal(error, {
      homePageIsHide: true,
      isShowClearError: true,
      clearErrorHref: `/setting/${activityCode.value}`
    })
  }
})
// endregion ////

// region Actions ////
const getEmptyValue = (type: string) => {
  switch (type) {
    case 'select': return ''
    case 'bool': return false
    case 'datetime': return null
    case 'int':
    case 'double': return 0
    default: return ''
  }
}

/**
 * @todo fix this
 */
const handleValuesUpdate = async (newValues: Record<string, any>) => {
  formValues.value = { ...newValues }

  $logger.warn('b24.placement.setPropertyValue >>', formValues.value)

  await $b24.placement.call(
    'setPropertyValue',
    formValues.value
  )
}
// endregion /////

// region Tools ////
// const getMethodByKey = (key: string) => {
//   const methods: Record<string, string> = {
//     entityTypeId: 'crm.type.list',
//     users: 'user.get'
//   }
//   return methods[key] || 'crm.status.list'
// }
//
// const loadOptions = async (propertyKey: string) => {
//   const optionLoaders: Record<string, () => Promise<Record<string | number, string>>> = {
//     categoryId: async () => {
//       // const res = await bx.callMethod('crm.category.list', {
//       //   entityTypeId: values.value.typeSP
//       // });
//       // return res.data?.categories.reduce((acc, cat) => ({
//       //   ...acc,
//       //   [cat.id]: cat.name
//       // }), {});
//       return {}
//     }
//   }
//   if (optionLoaders[propertyKey]) {
//     return await optionLoaders[propertyKey]()
//   }
//   return {}
// }

const makeFitWindow = async () => {
  window.setTimeout(() => {
    // $b24.parent.fitWindow() ////
    $b24.parent.resizeWindowAuto()
  }, 200)
}
// endregion ////
</script>

<template>
  <div class="px-1 min-h-[320px]">
    <template v-if="isLoading">
      <!-- @todo add skeleton -->
      <div class="relative p-sm2 rounded-md flex flex-row gap-sm border-2 border-base-master/10">
        <B24Skeleton class="h-12 w-12 rounded-full" />
        <div class="flex-1 flex flex-col items-start justify-between gap-2">
          <div class="w-full flex flex-col items-start justify-between gap-2">
            <div class="w-full">
              <B24Skeleton class="mb-xs2 h-sm2 w-2/3 bg-base-400 rounded-2xs" />
              <div class="mb-1.5 w-full flex flex-row flex-wrap items-start justify-start gap-2">
                <B24Skeleton class="h-sm w-1/4" />
                <B24Skeleton class="h-sm w-1/4" />
              </div>
            </div>
            <B24Skeleton class="h-2 w-5/6 rounded-2xs" />
            <B24Skeleton class="mb-1 h-2 w-3/4 rounded-2xs" />
          </div>
          <div class="w-full flex flex-row gap-1 items-center justify-end">
            <div class="border-2 border-gray-200 dark:border-gray-800 h-[26px] w-[80px] px-lg rounded-full flex items-center justify-center">
              <B24Skeleton class="h-xs w-full rounded-3xs" />
            </div>
          </div>
        </div>
      </div>
    </template>
    <template v-else>
      <ActivitySettings
        v-if="activityConfig"
        :activity-config="activityConfig"
        :current-values="formValues"
        @update:current-values="handleValuesUpdate"
      />
      <!-- @todo set lang -->
      <B24Alert v-else title="Activity settings not find" />
    </template>
  </div>
</template>
