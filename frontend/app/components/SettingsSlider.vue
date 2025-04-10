<script setup lang="ts">
import { ref } from 'vue'
import ListIcon from '@bitrix24/b24icons-vue/main/ListIcon'
import ClockWithArrowIcon from '@bitrix24/b24icons-vue/main/ClockWithArrowIcon'

const emit = defineEmits<{ close: [boolean] }>()

async function openLogSlider() {
  /**
   * @todo open in b24
   */
  alert('/settings/configs/event_log.php')
}

async function openEmployeesSlider() {
  /**
   * @todo open in b24
   */
  alert('/company/')
}

const deviceHistoryCleanupDays = ref([
  30, 60, 90, 120, 15, 180
])

const deviceHistoryCleanupDay = ref(deviceHistoryCleanupDays.value[0])

async function makeSave() {
  /**
   * @todo send to b24 use pina
   */
  alert('make save')
  emit('close', true)
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
