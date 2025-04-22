<script setup lang="ts">
import { useFetchDeal } from '~/composables/useBitrix24'
import PersonIcon from '@bitrix24/b24icons-vue/main/PersonIcon'

definePageMeta({
  layout: false
})

useHead({
  htmlAttrs: {
    class: ''
  },
  bodyAttrs: {
    class: 'bg-white'
  }
})

const route = useRoute()
/**
 * @todo add some test query
 */
const taskId = computed(() => {
  const id = route.params.id
  return Number.parseInt((Array.isArray(id) ? id[0] : id) || '0')
})

if (!taskId.value) {
  throw createError({
    statusCode: 400,
    message: 'taskId not specified'
  })
}

/**
 * @todo fix this
 */
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

const {
  data: dealData,
  status: processStatus,
  error: processError
} = await useFetchDeal(taskId.value)

const getTitle = computed(() => {
  return `Invoice No ${dealData.value?.id} from ${currentDateTime.value}`
})

const getClientTitle = computed(() => {
  return (
    dealData.value?.company
      ? dealData.value.company.title
      : dealData.value?.contact?.title
  ) || '-'
})
</script>

<template>
  <div v-if="processStatus === 'pending'">
    Loading ...
  </div>
  <B24Alert
    v-else-if="processStatus === 'error'"
    class="w-[400px]"
    color="danger"
    :title="processError?.message"
    :description="processError?.stack "
  />
  <main v-else-if="processStatus === 'success' && dealData">
    <div class="page p-[1cm] border border-base-200 rounded-md w-[210mm] min-h-[297mm] mx-auto my-[10mm] print:m-0 print:border-0 print:w-auto print:min-h-auto print:bg-inherit print:rounded-none">
      <div class="subpage h-[276mm] p-[0cm] mx-auto">
        <div class="flex flex-col">
          <div class="flex flex-row flex-nowrap border-b-[3px] border-b-base-500 pb-2.5">
            <div class="w-1/2">
              @todo.Logo
            </div>
            <div class="w-1/2 font-b24-roboto text-right text-[16px] font-medium leading-none flex flex-col flex-nowrap">
              <div class="mb-1.5 flex flex-row flex-nowrap items-center justify-end">
                <div class="ml-1 font-black">
                  Line 0
                </div>
              </div>
              <div class="mb-1.5 flex flex-row flex-nowrap items-center justify-end">
                <div class="">
                  Line 1
                </div>
              </div>
              <div class="flex flex-row flex-nowrap items-center justify-end">
                <div class="">
                  Line 2
                </div>
              </div>
            </div>
          </div>
        </div>
        <h1 class="py-2 text-center font-b24-roboto font-semibold text-lg">
          {{ getTitle }}
        </h1>
        <div class="font-b24-roboto text-sm rounded-md border border-base-400 px-4 py-2">
          <div class="border-b border-base-400 font-semibold pb-2">
            <div class="flex flex-row flex-nowrap items-center justify-start">
              <div>
                <PersonIcon class="size-md" />
              </div>
              <div class="ml-1">
                Client
              </div>
            </div>
          </div>
          <ul class="space-y-0.5 pt-1">
            <li class="grid justify-start">
              <div class="w-32 text-base-500">
                Name:
              </div>
              <div class="col-start-2 font-semibold">
                {{ getClientTitle }}
              </div>
            </li>
            <li class="grid justify-start">
              <div class="w-32 text-base-500">
                Phone:
              </div>
              <div class="col-start-2 font-semibold">
                @todo.client->getPhone()
              </div>
            </li>
            <li class="grid justify-start">
              <div class="w-32 text-base-500">
                E-mail:
              </div>
              <div class="col-start-2 font-semibold">
                @todo.client->getEmail()
              </div>
            </li>
            <li class="grid justify-start">
              <div class="w-32 text-base-500">
                DK:
              </div>
              <div class="col-start-2 font-semibold">
                @todo.$client->getDk()
              </div>
            </li>
            <li class="grid justify-start">
              <div class="w-32 text-base-500">
                @todo.deliveryTitle
              </div>
              <div class="col-start-2 font-semibold">
                [ @todo.delivery->getAddress(), @todo.responsible->getWorkPhone(), mb_strtolower(@todo.responsible->getWorkPosition()), @todo.responsible->getTitle() ]
              </div>
            </li>
            <li class="grid justify-start">
              <div class="w-32 text-base-500">
                Payment:
              </div>
              <div class="col-start-2 font-semibold">
                [@todo.$paymentList]
              </div>
            </li>
          </ul>
        </div>
        <div
          v-if="dealData?.products && (dealData.products).length > 0"
          class="mt-3 font-b24-secondary text-sm rounded-md border border-base-400 overflow-hidden"
        >
          <table class="min-w-full table-fixed divide-y divide-base-300">
            <thead>
              <tr>
                <th class="border-r border-base-300 py-1.5 w-[40px] font-semibold bg-theader">
                  No
                </th>
                <th class="border-r border-base-300 py-1.5 w-[120px] font-semibold bg-theader">
                  Image
                </th>
                <th class="border-r border-base-300 py-1.5 w-[220px] font-semibold bg-theader">
                  Title
                </th>
                <th class="border-r border-base-300 py-1.5 font-semibold bg-theader">
                  Price
                </th>
                <th class="border-r border-base-300 py-1.5 font-semibold bg-theader">
                  Quantity
                </th>
                <th class="border-base-300 py-1.5 font-semibold bg-theader">
                  Sum
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(product, key) in dealData.products.slice(0, 5)"
                :key="key"
              >
                <td class="border-r border-base-300 text-center py-2">
                  {{ key + 1 }}.
                </td>
                <td class="border-r border-base-300 text-center py-2">
                  @todo.img
                </td>
                <td class="border-r border-base-300 text-left py-2 px-2 leading-4">
                  <div class="text-[10px] text-base-500">
                    Code: @todo.Article
                  </div>
                  <div class="text-base-800">
                    {{ product.productName }}
                  </div>
                </td>
                <td class="border-r border-base-300 text-center py-2">
                  {{ product.price }}
                </td>
                <td class="border-r border-base-300 text-center py-2 subpixel-antialiased">
                  {{ product.quantity }} <span>{{ product.measureName }}</span>
                </td>
                <td class="border-base-300 text-center py-2">
                  {{ (product.price * product.quantity) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="mt-3 font-b24-secondary text-sm flex flex-row items-start flex-nowrap justify-between">
          <div class="flex flex-col items-start">
            <div class="mb-0">
              Weight: <span class="text-sm font-semibold">@todo 0.00 kg.</span>
            </div>
          </div>
          <div class="flex flex-col items-end">
            <div class="mb-0">
              Price: <span class="text-sm font-semibold">@todo 0.00</span>
            </div>
            <div class="mb-0">
              Delivery: <span class="text-sm font-semibold">@todo 0.00</span>
            </div>
            <div class="mb-4">
              Discount: <span class="text-sm font-semibold">@todo 0.00</span>
            </div>
            <div class="mt-1 mb-1 w-52 text-sm font-semibold flex flex-col justify-between">
              <div class="w-1 bg-line-pattern h-px bg-contain invisible" />
              <div class="w-full bg-line-pattern h-px bg-contain" />
              <div class="py-1 flex flex-row justify-between">
                <div>Total price</div>
                <div>@todo 0.00</div>
              </div>
              <div class="bg-line-pattern h-px bg-contain" />
            </div>
            <div class="">
              @todo some info
            </div>
          </div>
        </div>
      </div>
    </div>
  </main>
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

  .page {
    page-break-after: always
  }
}
</style>
