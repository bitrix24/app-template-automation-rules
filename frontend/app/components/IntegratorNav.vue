<script setup lang="ts">
/**
 * @todo fix lang
 */
import { IntegratorModal } from '#components'
import IncertImageIcon from '@bitrix24/b24icons-vue/editor/IncertImageIcon'
import InterconnectionIcon from '@bitrix24/b24icons-vue/crm/InterconnectionIcon'

const { t } = useI18n()
const user = useUserStore()
const appSettings = useAppSettingsStore()

const overlay = useOverlay()
const modalForIntegrators = overlay.create(IntegratorModal)

const openPopover = ref(false)

async function setInfo() {
  if (user.isAdmin) {
    openPopover.value = false
    const isSave = await modalForIntegrators.open()
    if (!isSave) {
      return
    }
  }
}
</script>

<template>
  <B24Popover
    v-model:open="openPopover"
    :arrow="{ width: 20, height: 10 }"
    :b24ui="{ content: 'w-72' }"
  >
    <div class="mx-xs py-xs px-xs hover:bg-base-200 dark:hover:bg-white/10 rounded-md flex justify-center">
      <B24Button
        class="w-[237px] ps-0 pe-0"
        label="Integrator Info"
        color="link"
        use-dropdown
        normal-case
        :b24ui="{ baseLine: 'w-full shrink-0', trailingIcon: 'text-base-700 min-lg:rotate-180' }"
      >
        <div class="flex flex-row items-center justify-start gap-2 w-full shrink-1">
          <div class="shrink-0">
            <img
              v-if="appSettings.integrator.logo"
              :src="appSettings.integrator.logo"
              alt="Company Logo"
              class="rounded-md border border-base-500 w-[40px] min-h-[40px] object-cover"
            >
            <IncertImageIcon
              v-else
              class="rounded-md border text-base-500 border-base-500 size-10 object-cover"
            />
          </div>
          <div class="min-w-0">
            <div class="flex flex-col items-start justify-start gap-0.5 overflow-hidden">
              <div class="text-3xs leading-tight opacity-70 text-base-500">
                {{ $t('component.integrator.info.caption') }}
              </div>
              <div class="text-2xs leading-tight text-start text-base-700 line-clamp-1">
                {{ appSettings.integrator.company || $t('component.integrator.info.empty') }}
              </div>
            </div>
          </div>
        </div>
      </B24Button>
    </div>

    <template #content>
      <div class="bg-white dark:bg-base-dark shadow-lg rounded-2xs ring ring-base-300 dark:ring-base-800">
        <B24DescriptionList
          size="sm"
          class="px-3 rounded-lg overflow-hidden"
          :items="appSettings.integratorPreview"
          :b24ui="{
            container: 'mt-0 sm:grid-cols-[min(35%,5rem)_auto]',
            footer: 'border-t-0 mt-0 px-0 py-2 flex flex-row flex-nowrap justify-end items-center'
          }"
        >
          <template #description="{ item }">
            <div class="break-words">
              <template v-if="item.code === 'phone'">
                <ProseA :href="`tel:${(item?.description || '').replace(/[^\d+]/g, '')}`">
                  {{ item.description }}
                </ProseA>
              </template>
              <template v-else-if="item.code === 'email'">
                <ProseA :href="`mailto:${item.description}`">
                  {{ item.description }}
                </ProseA>
              </template>
              <template v-else-if="item.code === 'comments'">
                <div class="min-h-5 max-h-20 pe-1 overflow-y-auto scrollbar-thin scrollbar-transparent">
                  {{ item.description }}
                </div>
              </template>
              <template v-else>
                <ProseA :href="item.description">
                  {{ item.description }}
                </ProseA>
              </template>
            </div>
          </template>

          <template
            v-if="user.isAdmin"
            #footer
          >
            <B24Button
              class="px-1"
              color="ai"
              size="xs"
              rounded
              :label="t('component.nav.settings.integrators')"
              :icon="InterconnectionIcon"
              @click.stop="setInfo"
            />
          </template>
        </B24DescriptionList>
      </div>
    </template>
  </B24Popover>
</template>
