<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { ActivityOrRobotConfig, ActivityProperty } from '~/activity.config'

const props = defineProps<{
  activityConfig: ActivityOrRobotConfig
  currentValues: Record<string, any>
}>()

const emit = defineEmits(['update:currentValues'])

const inputTypeMap = {
  int: 'text',
  double: 'number',
  date: 'date',
  string: 'text',
  text: 'textarea'
}

const { $logger } = useAppInit()
/**
 * @todo fix this
 */
const localized = (obj: string | Record<string, string> = {}) => {
  return obj
  // $logger.log(obj, locale.value)
  // return obj[locale.value || 'en'] || Object.values(obj)[0] || '?'
}

/**
 * @todo fix this
 */
watch(
  () => props.currentValues,
  (newVal) => {
    emit('update:currentValues', newVal)
  }, { deep: true })
</script>

<template>
  <div class="border border-base-200">
    <div
      v-for="[key, prop] in Object.entries(activityConfig?.PROPERTIES || {})"
      :key="key"
      class="flex flex-col items-stretch justify-between gap-2 pb-3"
    >
      <label>{{ localized(prop.Name) }}</label>

      <template v-if="prop.Type === 'select'">
        <select
          v-model="currentValues[key]"
          :multiple="prop.Multiple === 'Y'"
          :required="prop.Required === 'Y'"
        >
          <option
            v-for="[value, label] in Object.entries(prop.Options || {})"
            :key="value"
            :value="value"
          >
            {{ localized(label) }}
          </option>
        </select>
      </template>

      <template v-else-if="prop.Type === 'datetime'">
        <input
          v-model="currentValues[key]"
          type="datetime-local"
          :required="prop.Required === 'Y'"
        >
      </template>

      <template v-else-if="prop.Type === 'bool'">
        <input
          v-model="currentValues[key]"
          type="checkbox"
          :required="prop.Required === 'Y'"
        >
      </template>

      <template v-else>
        <B24Input
          v-model="currentValues[key]"
          :type="inputTypeMap[prop.Type]"
          :required="prop.Required === 'Y'"
        />
        <div>
          <B24Button
            label="{{ID}}"
            size="xs"
            color="link"
            depth="dark"
            @click.stop="currentValues[key] = '{{ID}}'"
          />
        </div>
      </template>

      <div v-if="prop.Description" class="description">
        {{ localized(prop.Description) }}
      </div>
    </div>
  </div>
</template>
