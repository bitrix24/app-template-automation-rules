<script setup lang="ts">
import type { ActivityOrRobotConfig } from '@bitrix24/b24jssdk'

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
 * @need fix lang
 */
const localized = (obj: string | Record<string, string> = {}) => {
  return obj
  // $logger.log(obj, locale.value)
  // return obj[locale.value || 'en'] || Object.values(obj)[0] || '?'
}
</script>

<template>
  <div>
    <div
      v-for="[key, property] in Object.entries(activityConfig?.PROPERTIES || {})"
      :key="key"
      class="flex flex-col items-stretch justify-between gap-2 pb-3"
    >
      <label>{{ localized(property.Name) }}</label>

      <template v-if="property.Type === 'select'">
        <B24Select
          class="w-full"
          :model-value="currentValues[key]"
          :multiple="property.Multiple === 'Y'"
          :required="property.Required === 'Y'"
          :items="Object.entries(property.Options || {}).map(([value, label]) => {
            return {
              label,
              value
            }
          })"
          :b24ui="{ content: 'max-h-40' }"
          @update:model-value="val => updateField(key, val)"
        />
      </template>

      <template v-else-if="property.Type === 'datetime'">
        @todo datetime
      </template>

      <template v-else-if="property.Type === 'bool'">
        @todo bool
      </template>

      <template v-else-if="property.Type === 'user'">
        @todo user
      </template>

      <template v-else>
        <B24Input
          :model-value="currentValues[key]"
          :type="inputTypeMap[property.Type] as string"
          :required="property.Required === 'Y'"
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

      <div v-if="property.Description" class="description">
        {{ localized(property.Description) }}
      </div>
    </div>
  </div>
</template>
