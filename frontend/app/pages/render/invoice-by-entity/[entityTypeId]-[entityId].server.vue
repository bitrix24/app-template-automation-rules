<script setup lang="ts">
import {
  B24OAuth,
  useB24Helper,
  CatalogProductType,
  EnumCrmEntityTypeId,
  LoggerBrowser,
  B24LangList,
  B24LocaleMap,
  LoadDataType,
  useFormatter
} from '@bitrix24/b24jssdk'
import type { B24OAuthSecret, B24OAuthParams } from '@bitrix24/b24jssdk'
import { useFetchEntity } from '~/composables/useBitrix24'
import { chunkProductsList } from '~/utils/chunkArray'
import type { ProductRow } from '~/types/bitrix'
import CompanyIcon from '@bitrix24/b24icons-vue/crm/CompanyIcon'
import TelephonyHandset1Icon from '@bitrix24/b24icons-vue/main/TelephonyHandset1Icon'
import IncertImageIcon from '@bitrix24/b24icons-vue/editor/IncertImageIcon'

definePageMeta({
  layout: false,
  middleware: 'auth-server-render'
})

useHead({
  htmlAttrs: {
    class: ''
  },
  bodyAttrs: {
    // font-b24-system || font-b24-system-mono || font-b24-helvetica ////
    class: 'bg-white text-base-ebony font-b24-system antialiased'
  }
})

// const $logger = LoggerBrowser.build(
//   'render-invoice-by-entity',
//   import.meta.dev
// )

// region Init requestData ////
const requestDataServerRender = useRequestDataServerRender()

const entityTypeId = computed(() => {
  return requestDataServerRender?.value?.entityTypeId ?? EnumCrmEntityTypeId.undefined
})

const entityId = computed(() => {
  return requestDataServerRender?.value?.entityId ?? 0
})

if (!entityId.value) {
  throw createError({
    statusCode: 400,
    message: 'entityId not specified',
    fatal: true
  })
}

/**
 * @todo get from activity.params
 */
const currentLang = computed(() => {
  return B24LangList.en
})

function formatDate(date: Date): string {
  const day = date.getDate().toString().padStart(2, '0')
  const localeLang = B24LocaleMap[currentLang.value] || 'en-EN'
  const month = date.toLocaleString(localeLang, { month: 'long' }).toLowerCase()
  const year = date.getFullYear()

  return `${day} ${month} ${year}`
}

const { formatterNumber } = useFormatter()
formatterNumber.setDefLocale(currentLang.value)

const currentDate = ref(formatDate(new Date()))
// endregion ////

// region Init B24 ////
const config = useRuntimeConfig()
const authOptions: B24OAuthParams = requestDataServerRender.value!.auth as B24OAuthParams
const oAuthSecret: B24OAuthSecret = {
  clientId: config.appClientId,
  clientSecret: config.appClientSecret
}

const $b24 = new B24OAuth(authOptions, oAuthSecret)
$b24.setLogger(LoggerBrowser.build('Consumer [B24]', false))

const {
  getB24Helper,
  initB24Helper
} = useB24Helper()

await initB24Helper(
  $b24,
  [
    LoadDataType.Profile,
    LoadDataType.Currency
  ]
)

const $b24Helper = getB24Helper()
// endregion ////

// region Load Data From B24 ////
const {
  data: entityData,
  status: processStatus,
  error: processError
} = await useFetchEntity($b24, entityTypeId.value, entityId.value)
// endregion ////

// region functions ////
const getTitle = computed(() => {
  return `Invoice No. ${entityData.value?.id} from ${currentDate.value}`
})

const getClientTitle = computed(() => {
  return (
    entityData.value?.company
      ? entityData.value.company.title
      : entityData.value?.contact?.title
  ) || '-'
})

const getClientPhone = computed(() => {
  return (
    entityData.value?.company
      ? entityData.value.company?.phone
      : entityData.value?.company?.phone
  ) || '-'
})

const getPaymentList = computed(() => {
  return (
    entityData.value?.paymentList
      ? entityData.value.paymentList.map(row => row.paySystemName).join('; ')
      : '-'
  ) || '-'
})

const getDeliveryList = computed(() => {
  return (
    entityData.value?.deliveryList
      ? entityData.value.deliveryList.map(row => row.deliveryName).join('; ')
      : '-'
  ) || '-'
})

const getDeliveryPrice = computed(() => {
  return (
    entityData.value?.deliveryList
      ? entityData.value.deliveryList.reduce((sum, item) => sum + item.priceDelivery, 0)
      : 0.0
  ) || 0.0
})

const productsChunkPage = computed<ProductRow[][]>(() => {
  const list = chunkProductsList<ProductRow>(entityData.value?.products || [])
  // const list = chunkProductsList<ProductRow>(
  //   [...entityData.value?.products || [], ...entityData.value?.products || [], ...entityData.value?.products || []] // .slice(0, 9)
  // )
  if (list.length < 1) {
    list.push([])
  }

  return list
})

const globalIndexes = computed(() => {
  let counter = 1
  return productsChunkPage.value.map((page: ProductRow[]) =>
    page.map(() => counter++)
  )
})

const globalWeight = computed(() => {
  let weight = 0
  const list: ProductRow[] = entityData.value?.products || []

  list.forEach((product: ProductRow) => {
    /**
     * Skip service
     */
    if (product.type === CatalogProductType.service) {
      return
    }
    weight = weight + ((product.productInfo?.weight || 0.0) * product.quantity)
  })

  return weight
})

const globalIsSomeEmptyWeight = computed(() => {
  let isHasEmpty = false
  const list: ProductRow[] = entityData.value?.products || []

  list.forEach((product: ProductRow) => {
    /**
     * Skip service
     */
    if (product.type === CatalogProductType.service) {
      return
    }

    if ((product.productInfo?.weight || 0.0) === 0.0) {
      isHasEmpty = true
      // $logger.warn(`Product id:${product.productId} has empty Weight`)
    }
  })

  return isHasEmpty
})

const globalDiscount = computed(() => {
  let ttlDiscount = 0.0
  const list: ProductRow[] = entityData.value?.products || []

  list.forEach((product: ProductRow) => {
    if (product.discountSum) {
      ttlDiscount = ttlDiscount + (product.discountSum * product.quantity)
    }
  })

  return ttlDiscount
})

function formatPrice(price: number, currency?: string): string {
  if (!currency) {
    return `${price} ?`
  }

  return $b24Helper?.currency.format(
    price,
    currency,
    currentLang.value
  )
}
// endregion ////
</script>

<template>
  <div v-if="processStatus === 'pending'" class="app-loading-indicator">
    Loading ...
  </div>
  <B24Alert
    v-else-if="processStatus === 'error'"
    class="w-[400px]"
    color="danger"
    :title="processError?.message"
    :description="processError?.stack "
  />
  <main v-else-if="processStatus === 'success' && entityData">
    <template v-for="(page, pageKey) in productsChunkPage" :key="pageKey">
      <div class="page p-[1cm] border border-base-200 rounded-xs w-[210mm] min-h-[297mm] mx-auto my-[10mm] print:m-0 print:border-0 print:w-auto print:min-h-auto print:bg-inherit print:rounded-none">
        <div class="subpage h-[276mm] p-[0cm] mx-auto">
          <template v-if="pageKey === 0">
            <div class="pb-2.5 flex flex-row flex-nowrap justify-items-stretch gap-1">
              <div class="flex flex-row flex-nowrap gap-1">
                <CompanyIcon class="size-10 -mt-0.5 -ml-2" />
                <div class="flex flex-col flex-nowrap gap-1">
                  <ProseH2 class="font-bold mb-0">
                    Your company name
                  </ProseH2>
                  <div class="text-sm flex flex-row flex-nowrap items-center justify-start gap-1">
                    <div>
                      Your address:
                    </div>
                    <div class="font-semibold">
                      City name, Street name, office 410
                    </div>
                  </div>
                  <div class="text-sm flex flex-row flex-nowrap items-center justify-start gap-1">
                    <div>
                      Opening hours:
                    </div>
                    <div class="font-semibold">
                      from 8:30 to 19:00
                    </div>
                  </div>
                  <div class="text-sm flex flex-row flex-nowrap items-center justify-start gap-0.5">
                    <TelephonyHandset1Icon class="size-4 mt-0.5" />
                    <div class="font-bold">
                      +49 111 000-00-00
                    </div>
                  </div>
                </div>
              </div>
              <div class="flex-1">
                <ProseImg
                  v-if="entityData?.qrCode"
                  :src="entityData.qrCode"
                  alt="QR Code"
                  class="ml-auto aspect-square w-full max-w-[80px] object-cover"
                />
              </div>
            </div>

            <ProseH3 class="pb-2.5 text-center font-semibold mb-0">
              {{ getTitle }}
            </ProseH3>

            <div class="border border-base-ebony px-4 py-4">
              <ProseH6 class="mb-2xs font-semibold">
                Contact details:
              </ProseH6>
              <ul class="text-xs space-y-3xs">
                <li class="grid justify-start">
                  <div class="w-32 text-base-900">
                    Name:
                  </div>
                  <div class="col-start-2 font-semibold">
                    {{ getClientTitle }}
                  </div>
                </li>
                <li class="grid justify-start">
                  <div class="w-32 text-base-900">
                    Phone:
                  </div>
                  <div class="col-start-2 font-semibold">
                    {{ getClientPhone }}
                  </div>
                </li>
                <li
                  v-if="entityData.paymentList?.length"
                  class="grid justify-start"
                >
                  <div class="w-32 text-base-900">
                    Payment:
                  </div>
                  <div class="col-start-2 font-semibold">
                    {{ getPaymentList }}
                  </div>
                </li>
                <li
                  v-if="entityData.deliveryList?.length"
                  class="grid justify-start"
                >
                  <div class="w-32 text-base-900">
                    Delivery:
                  </div>
                  <div class="col-start-2 font-semibold">
                    {{ getDeliveryList }}
                  </div>
                </li>
              </ul>
            </div>
          </template>

          <B24TableWrapper
            size="xs"
            :rounded="false"
            :zebra="false"
            class="overflow-x-hidden w-full border-y border-y-base-300"
            :class="[
              pageKey === 0 ? 'mt-lg' : 'mt-0'
            ]"
            :b24ui="{
              base: 'font-b24-not-use border-y-base-ebony [&>table]:text-base-ebony [&>table>thead>tr]:border-base-ebony [&>table>tbody>tr]:border-base-ebony [&>table>tfoot]:border-base-ebony [&>table>thead>tr>th]:text-center [&>table>thead>tr>th]:font-semibold [&>table>tbody>tr>td]:text-center'
            }"
          >
            <table>
              <thead>
                <tr>
                  <th class="w-[30px]">
                    No.
                  </th>
                  <th class="w-[64px]">
                    Photo
                  </th>
                  <th class="w-[310px]">
                    Name
                  </th>
                  <th>
                    Price
                  </th>
                  <th>
                    Quantity
                  </th>
                  <th>
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody>
                <!-- eslint-disable vue/no-v-html -->
                <tr
                  v-for="(product, productKey) in page"
                  :key="productKey"
                >
                  <td>
                    {{ globalIndexes![pageKey]![productKey] }}.
                  </td>
                  <td>
                    <div class="relative">
                      <ProseImg
                        v-if="product.productImage && product.productImage[0] && product.productImage[0].detailUrl"
                        :src="product.productImage[0].detailUrl"
                        :alt="product.productName"
                        class="mx-auto aspect-square w-full max-w-[50px] rounded-lg object-cover border border-base-100"
                      />
                      <IncertImageIcon
                        v-else
                        class="size-[50px] text-base-100 rounded-lg object-cover border border-base-100"
                      />
                      <B24Badge
                        v-if="product.type === CatalogProductType.service"
                        label="service"
                        size="xs"
                        color="primary"
                        depth="normal"
                        use-fill
                        class="absolute -top-0.5 -left-1.5"
                      />
                    </div>
                  </td>
                  <td>
                    <div class="text-left leading-4 w-full flex flex-col flex-nowrap">
                      <div>
                        {{ product.productName }}
                      </div>
                      <div class="text-[10px] text-base-900">
                        Code: {{ product.productId }}
                      </div>
                    </div>
                  </td>
                  <td>
                    <span v-html="formatPrice(product.price, entityData.currencyId)" />
                    <div
                      v-if="product.discountSum > 0.0"
                      class="text-[10px] text-base-900 line-through"
                      v-html="formatPrice(product.priceBrutto, entityData.currencyId)"
                    />
                  </td>
                  <td>
                    {{ formatterNumber.format(product.quantity || 0) }} <span class="text-base-900">{{ product.measureName }}</span>
                  </td>
                  <td>
                    <span v-html="formatPrice((product.price * product.quantity), entityData.currencyId)" />
                  </td>
                </tr>
                <!-- eslint-enable -->
              </tbody>
            </table>
          </B24TableWrapper>

          <template v-if="pageKey === productsChunkPage.length - 1">
            <div class="mt-lg text-lg flex flex-row items-start flex-nowrap justify-between">
              <div
                class="flex-initial"
                :class="[
                  globalIsSomeEmptyWeight ? 'text-red-600' : ''
                ]"
              >
                Order weight: <span class="font-bold">{{ formatterNumber.format(globalWeight / 1000) }} kg</span>
              </div>
              <div class="flex-1 max-w-[350px] flex flex-col items-end gap-0.5">
                <div
                  v-if="globalDiscount > 0.0"
                  class="w-full flex flex-row items-center justify-between gap-2"
                >
                  <div>
                    Discount:
                  </div>
                  <div class="font-bold" v-html="formatPrice(-1 * (globalDiscount || 0.0), entityData.currencyId)" />
                </div>
                <div
                  v-if="entityData.deliveryList?.length"
                  class="w-full flex flex-row items-center justify-between gap-2"
                >
                  <div>
                    Delivery price:
                  </div>
                  <div class="font-bold" v-html="formatPrice(getDeliveryPrice || 0.0, entityData.currencyId)" />
                </div>
                <div
                  class="w-full flex flex-row items-center justify-between gap-2 text-2xl"
                  :class="[
                    (globalDiscount > 0.0 || entityData.deliveryList?.length) ? 'border-t-2 border-t-base-ebony pt-1.5' : ''
                  ]"
                >
                  <div>
                    To be paid:
                  </div>
                  <div class="font-bold" v-html="formatPrice(entityData?.opportunity || 0.0, entityData.currencyId)" />
                </div>
                <div class="w-full -mt-1 text-xs text-base-900">
                  The invoice is valid for 3 calendar days
                </div>
              </div>
            </div>
          </template>
        </div>
      </div>
    </template>
  </main>
  <div v-else>
    <h2>Empty entity data</h2>
  </div>
</template>

<style>
@page {
  size: A4;
  margin: 0
}

@media print {
  body, html {
    width: 210mm;
    height: 297mm
  }

  .page:not(:last-child) {
    page-break-after: always
  }
}
</style>
