<script setup lang="ts">
import type { ActivityOrRobotConfig } from '~/activity.config'

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

const updateField = (key: string, value: any) => {
  const newValues = { ...props.currentValues, [key]: value }
  emit('update:currentValues', newValues)
}

// const { $logger } = useAppInit()
/**
 * @todo fix this
 */
const localized = (obj: string | Record<string, string> = {}) => {
  return obj
  // $logger.log(obj, locale.value)
  // return obj[locale.value || 'en'] || Object.values(obj)[0] || '?'
}
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
        <B24Select
          class="w-full"
          :model-value="currentValues[key]"
          :multiple="prop.Multiple === 'Y'"
          :required="prop.Required === 'Y'"
          :items="Object.entries(prop.Options || {}).map(([value, label]) => {
            return {
              label,
              value
            }
          })"
          @update:model-value="val => updateField(key, val)"
        />
      </template>

      <template v-else-if="prop.Type === 'datetime'">
        @todo datetime
      </template>

      <template v-else-if="prop.Type === 'bool'">
        @todo bool
      </template>

      <template v-else-if="prop.Type === 'user'">
        @todo user
      </template>

      <template v-else>
        <B24Input
          :model-value="currentValues[key]"
          :type="inputTypeMap[prop.Type] as string"
          :required="prop.Required === 'Y'"
          @update:model-value="val => updateField(key, val)"
        />
        <div>
          <B24Button
            label="{{ID}}"
            size="xs"
            color="link"
            depth="dark"
            @click.stop="updateField(key, '{{ID}}')"
          />
        </div>
      </template>

      <div v-if="prop.Description" class="description">
        {{ localized(prop.Description) }}
      </div>
    </div>
  </div>
</template>
