export interface ActivityConfig {
  code: string
  type: 'activity' | 'robot'
  name?: string
  handler?: string
  properties: Record<string, {
    name: string
    type: 'select' | 'input' | 'input-date' | 'checkbox'
    options?: Array<{ value: string, label: string }>
    required?: boolean
  }>
}

/**
 * @todo fix properties lang
 */
export const activitiesConfig: ActivityConfig[] = [
  {
    code: 'AIandMachineLearning',
    type: 'robot',
    handler: '/api/activities/AIandMachineLearning',
    properties: {
      typeV1: {
        name: 'Type 1',
        type: 'select',
        required: true,
        options: []
      },
      typeV2: {
        name: 'Type 2',
        type: 'select',
        required: true,
        options: []
      }
    }
  },
  {
    code: 'AppMarketplace',
    type: 'activity',
    properties: {
      message: {
        name: 'Text',
        type: 'input',
        required: true
      },
      isUseLog: {
        name: 'Is use log',
        type: 'checkbox'
      }
    }
  },
  {
    code: 'BlockchainTechnology',
    type: 'activity',
    properties: {
      title: {
        name: 'Title',
        type: 'input',
        required: true
      },
      deadline: {
        name: 'Deadline',
        type: 'input-date',
        required: false
      }
    }
  }
]
