// region Install ////
export interface IStep {
  action: () => Promise<void>
  caption?: string
  data?: Record<string, any>
}
// endregion ////

// region Activity ////
export enum EActivityCategory {
  Category1 = 'category_1',
  Category2 = 'category_2',
  Category3 = 'category_3'
}

export enum EActivityBadge {
  Install = 'install',
  NotInstall = 'not-install',
  Badge1 = 'badge_1',
  Badge2 = 'badge_2',
  Badge3 = 'badge_3'
}

export interface IActivityContent {
  path: string
  title?: string
  description?: string
  categories?: EActivityCategory[]
  badges?: EActivityBadge[]
  avatar?: string
}

export interface IActivity extends IActivityContent {
  isInstall?: boolean
}

export type FilterSetting = {
  label: string
  type: 'checkbox'
  checked: boolean | undefined
  onUpdateChecked: (checked: boolean) => void
  onSelect: (e: Event) => void
} | {
  type: 'separator'
}

export interface IFilterParams {
  category: 'all' | EActivityCategory
  badge: Map<EActivityBadge, boolean>
}
// endregion ////
