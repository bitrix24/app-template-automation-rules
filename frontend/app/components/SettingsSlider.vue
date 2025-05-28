<script setup lang="ts">
import { ref } from 'vue'
import { navigateTo } from '#imports'
import { AjaxError } from '@bitrix24/b24jssdk'
import type { B24Frame } from '@bitrix24/b24jssdk'
import ListIcon from '@bitrix24/b24icons-vue/main/ListIcon'
import CloudErrorIcon from '@bitrix24/b24icons-vue/main/CloudErrorIcon'
import ClockWithArrowIcon from '@bitrix24/b24icons-vue/main/ClockWithArrowIcon'

const toast = useToast()
const appSettings = useAppSettingsStore()
const { $logger } = useAppInit()
const { $initializeB24Frame } = useNuxtApp()
const $b24: B24Frame = await $initializeB24Frame()

const emit = defineEmits<{ close: [boolean] }>()

async function openLogSlider() {
  navigateTo({
    path: $b24.slider.getUrl('/settings/configs/event_log.php').toString(),
    query: {}
  }, {
    external: true,
    open: {
      target: '_blank'
    }
  })
}

async function openEmployeesSlider() {
  return $b24.slider.openPath(
    $b24.slider.getUrl('/company/')
  )
}

const deviceHistoryCleanupDays = ref([
  30, 60, 90, 120, 15, 180
])

const deviceHistoryCleanupDay = ref(appSettings.configSettings.deviceHistoryCleanupDays)

async function makeSave() {
  try {
    appSettings.configSettings.deviceHistoryCleanupDays = deviceHistoryCleanupDay.value
    await appSettings.saveSettings()
    emit('close', true)
  } catch (error) {
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

    toast.add({
      title: title,
      description,
      color: 'danger',
      icon: CloudErrorIcon
    })
  }
}
</script>

<template>
  <B24Slideover
    :title="$t('component.settings.slider.title')"
    :description="$t('component.settings.slider.description')"
    :close="{ onClick: () => emit('close', false) }"
    :b24ui="{
      content: 'w-[400px]',
      body: 'm-5'
    }"
  >
    <template #body>
      <B24Collapsible
        :default-open="true"
        class="mb-4 flex flex-col gap-0 w-full bg-white dark:bg-white/10 rounded"
      >
        <B24Button
          normal-case
          class="group w-full"
          :label="$t('component.settings.slider.history.title')"
          :icon="ClockWithArrowIcon"
          color="link"
          use-dropdown
          block
          size="lg"
          :b24ui="{
            trailingIcon: 'group-data-[state=open]:rotate-180 transition-transform duration-200'
          }"
        />
        <template #content>
          <div class="px-4 mb-3">
            <B24Separator class="mb-3" />

            <B24Alert
              color="primary"
              :description="$t('component.settings.slider.history.alert')"
            />

            <B24FormField
              class="my-3"
              :label="$t('component.settings.slider.history.property')"
            >
              <B24Select
                v-model="deviceHistoryCleanupDay"
                :items="deviceHistoryCleanupDays"
                class="w-full"
              />
            </B24FormField>

            <B24Link
              as="button"
              is-action
              @click.stop="openEmployeesSlider"
            >
              {{ $t('component.settings.slider.history.action') }}
            </B24Link>
          </div>
        </template>
      </B24Collapsible>

      <B24Collapsible
        :default-open="false"
        class="flex flex-col gap-0 w-full bg-white dark:bg-white/10 rounded"
      >
        <B24Button
          normal-case
          class="group w-full"
          :label="$t('component.settings.slider.log.title')"
          :icon="ListIcon"
          color="link"
          use-dropdown
          block
          size="lg"
          :b24ui="{
            trailingIcon: 'group-data-[state=open]:rotate-180 transition-transform duration-200'
          }"
        />
        <template #content>
          <div class="px-4 mb-3">
            <B24Separator class="mb-3" />
            <B24Alert
              class="mb-3"
              color="primary"
              :description="$t('component.settings.slider.log.alert')"
            />

            <B24Link
              as="button"
              is-action
              @click.stop="openLogSlider"
            >
              {{ $t('component.settings.slider.log.action') }}
            </B24Link>
          </div>
        </template>
      </B24Collapsible>
    </template>

    <template #footer>
      <div class="flex gap-2">
        <B24Button
          rounded
          :label="$t('component.settings.slider.save')"
          color="success"
          @click="makeSave"
        />
        <B24Button
          :label="$t('component.settings.slider.cancel')"
          color="link"
          @click="emit('close', false)"
        />
      </div>
    </template>
  </B24Slideover>
</template>
