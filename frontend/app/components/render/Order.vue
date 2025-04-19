<script setup lang="ts">
import { inject, ref } from 'vue'
import { EnumCrmEntityTypeId } from '@bitrix24/b24jssdk'
import type { B24Hook, LoggerBrowser } from '@bitrix24/b24jssdk'
import SettingsIcon from '@bitrix24/b24icons-vue/common-service/SettingsIcon'

const props = defineProps({
  taskId: String,
  status: {
    type: String,
    default: 'processing'
  }
})

const $b24 = inject('$b24') as B24Hook
const $logger = inject('$logger') as LoggerBrowser

const currentDateTime = ref(new Date().toLocaleString(
  'en-US',
  {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }
))

const deal = ref<{
  id: number
  title: string
  products: {
    id: number
    xmlId: string
    productId: number
    productName: string
    price: number
    quantity: number
    measureName: string
    type: number
    storeId: number
  }[]
}>({
  id: 0,
  title: '',
  products: []
})

try {
  const response = await $b24.callMethod(
    'crm.item.get',
    {
      entityTypeId: EnumCrmEntityTypeId.deal,
      id: props.taskId,
      select: [
        'id',
        'title'
      ],
      order: {
        id: 'desc'
      }
    }
  )
  deal.value = response.getData().result?.item

  /**
   * @todo get more > 50
   */
  const responseP = await $b24.callMethod(
    'crm.item.productrow.list',
    {
      filter: {
        '=ownerType': 'D',
        '=ownerId': props.taskId
      }
    }
  )
  deal.value.products = responseP.getData().result?.productRows || []
} catch (error) {
  $logger.error(error)
}
</script>

<template>
  <div class="bg-white p-6 rounded-lg shadow-lg">
    <h1 class="text-2xl font-bold mb-4">
      Task #{{ taskId }} <SettingsIcon class="size-5" />
    </h1>
    <div class="space-y-2 mb-4">
      <p class="text-base-600">
        Status: <span class="font-medium">{{ status }}</span>
      </p>
      <p class="text-base-600">
        Created: {{ currentDateTime }}
      </p>
    </div>
    <ProseH3>{{ deal.title }}</ProseH3>
    <small>id: {{ deal.id }}</small>
    <ul>
      <li
        v-for="(product, key) in deal.products"
        :key="key"
      >
        <ProseH3>{{ product.productName }} <small>id: {{ product.productId }}</small></ProseH3>
        <ProseP>{{ product.price }} x {{ product.quantity }} {{ product.measureName }}</ProseP>
      </li>
    </ul>
  </div>
</template>
