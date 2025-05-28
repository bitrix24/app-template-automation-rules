<script setup lang="ts">
/**
 * @need make layout template && add skeleton
 * @link https://apidocs.bitrix24.com/tutorials/bizproc/setting-robot.html
 */
import { ref, computed, onMounted } from 'vue'
import { activitiesConfig } from '~/activity.config'
import { ActivitySettings } from '#components'
import { Salt } from '~/services/salt'
import type { B24Frame } from '@bitrix24/b24jssdk'
import SpinnerIcon from '@bitrix24/b24icons-vue/specialized/SpinnerIcon'

// const { t } = useI18n()
const { clearSalt } = Salt()
const activityCode = ref<string>(clearSalt((useRoute().params?.code as string) || ''))
const activityConfig = computed(() =>
  activitiesConfig.find(a => a.CODE.toLowerCase() === activityCode.value.toLowerCase())
)

/**
 * @need fix lang
 */
useHead({
  title: 'Some activity settings'
})

// region Init ////
const { $logger, processErrorGlobal } = useAppInit()
const { $initializeB24Frame } = useNuxtApp()
const $b24: B24Frame = await $initializeB24Frame()

const isLoading = ref(true)
const formValues = ref<Record<string, any>>({})
// endregion ////

// region Lifecycle Hooks ////
onMounted(async () => {
  try {
    isLoading.value = true

    activityCode.value = clearSalt($b24.placement.options?.code || 'notSetInPlacementOptions')
    formValues.value = $b24.placement.options?.current_values || {}

    if (activityConfig.value) {
      const initialValues: Record<string, any> = {}

      for (const [key, prop] of Object.entries(activityConfig.value.PROPERTIES || {})) {
        // if (prop.Type === 'select' && prop.Options?.length < 1) {
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

const handleValuesUpdate = async (newValues: Record<string, any>) => {
  formValues.value = { ...newValues }

  $logger.log('b24.placement.setPropertyValue >>', formValues.value)

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
      <div class="h-[calc(100vh_-_90px)] flex flex-col items-center justify-center">
        <SpinnerIcon class="animate-spin stroke-2 size-[50px]" />
      </div>
    </template>
    <template v-else>
      <ActivitySettings
        v-if="activityConfig"
        :activity-config="activityConfig"
        :current-values="formValues"
        @update:current-values="handleValuesUpdate"
      />
      <!-- @need fix lang -->
      <B24Alert v-else title="Activity settings not find" />
    </template>
  </div>
</template>
