import type { IFuseOptions } from 'fuse.js'
import Fuse from 'fuse.js'
import { computed, shallowRef } from 'vue'

function useDynamicFilter<T>(
  filterText: Ref<string>,
  items: Ref<T[]>,
  attributes: string[] = [],
  config: IFuseOptions<T> = {}
) {
  return computed<T[]>(() => {
    const searchEngine = shallowRef(
      new Fuse(items.value, {
        threshold: 0.2,
        keys: attributes,
        ...config
      })
    )

    if (filterText.value) {
      return searchEngine.value.search(filterText.value).map(res => res.item)
    }

    if (attributes.length > 0) {
      const primaryAttribute = attributes[0] || ''

      return items.value.slice().sort((first, second) => {
        const firstStr = first[primaryAttribute as keyof T] as string
        const secondStr = second[primaryAttribute as keyof T] as string
        return firstStr.localeCompare(secondStr)
      })
    }

    return items.value
  })
}

export default useDynamicFilter
