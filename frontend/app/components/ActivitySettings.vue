<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { ActivityConfig, ActivityProperty } from '~/activity.config'

const { locale } = useI18n()

const props = defineProps<{
  activityConfig: ActivityConfig,
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

/**
 * @todo fix this
 */
const localized = (obj: string | Record<string, string> = {}) => {
  return obj
  console.log(
    obj,
    locale.value
  )
  return obj[locale.value || 'en'] || Object.values(obj)[0] || '?'
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
      v-for="[key, prop] in Object.entries(activityConfig.PROPERTIES)"
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
            :value="value"
          >
            {{ localized(label) }}
          </option>
        </select>
      </template>

      <template v-else-if="prop.Type === 'datetime'">
        <input
          type="datetime-local"
          v-model="currentValues[key]"
          :required="prop.Required === 'Y'"
        />
      </template>

      <template v-else-if="prop.Type === 'bool'">
        <input
          type="checkbox"
          v-model="currentValues[key]"
          :required="prop.Required === 'Y'"
        />
      </template>

      <template v-else>
        <B24Input
          :type="inputTypeMap[prop.Type]"
          v-model="currentValues[key]"
          :required="prop.Required === 'Y'"
        />
        <div>
          <B24Button label="{{ID}}" size="xs" color="link" depth="dark" @click.stop="currentValues[key] = '{{ID}}'" />
        </div>
      </template>

      <div v-if="prop.Description" class="description">
        {{ localized(prop.Description) }}
      </div>

    </div>
  </div>
</template>
