<script setup lang="ts">
import {
  LoggerBrowser,
  Result,
  B24Hook,
  EnumCrmEntityTypeId,
  Text,
  useFormatter
} from '@bitrix24/b24jssdk'

definePageMeta({
  layout: 'clear'
})

const route = useRoute()

const $b24 = new B24Hook({
  b24Url: 'https://de.bitrix24.de',
  userId: 1,
  secret: '123'
})
$b24.setLogger(LoggerBrowser.build('Core', false))

const companyList = ref([])

onMounted( async () => {
  const response = await $b24.callMethod(
    'crm.item.list',
    {
      entityTypeId: EnumCrmEntityTypeId.company,
      select: [
        'id',
        'title',
        'industry'
      ],
      order: {
        id: 'desc'
      }
    },
  )

  console.log(response.getData().result?.items)
  companyList.value = response.getData().result?.items || []

  console.log(companyList.value)
})
/**
 * @todo add some test query
 */
const taskId = computed(() => {
  const id = route.query.taskId
  return Array.isArray(id) ? id[0] : id
})

if (!taskId.value) {
  throw createError({
    statusCode: 400,
    message: 'taskId not specified in query parameters'
  })
}
</script>

<template>
  <div class="flex flex-col items-center justify-center gap-16 min-h-screen">
    <RenderOrder
      :task-id="taskId || '??'"
      :status="'status'"
    />
    <ul>
      <li
        v-for="(company, key) in companyList" :key="key"
      >
        <ProseH3>{{ company.title }}</ProseH3> <small>id: {{ company.id }}</small>
      </li>
    </ul>
  </div>
</template>
