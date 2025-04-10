<script setup lang="ts">
/**
 * @todo fix lang
 */
import { ref, onBeforeUnmount } from 'vue'
import IncertImageIcon from '@bitrix24/b24icons-vue/editor/IncertImageIcon'

const props = withDefaults(defineProps<{
  maxSize?: number
  quality?: number
}>(), {
  maxSize: 40,
  quality: 1.0
})

interface ImageUploaderEmits {
  (e: 'imageUpload' | 'imageError', payload: string): void
}

const emits = defineEmits<ImageUploaderEmits>()

const modelValue = defineModel<string | undefined>({ required: true })
const fileInput = ref<HTMLInputElement | null>(null)
const isDragging = ref(false)

const handleDragOver = (e: DragEvent) => {
  e.preventDefault()
  isDragging.value = true
}

const handleDragLeave = (e: DragEvent) => {
  e.preventDefault()
  isDragging.value = false
}

const handleDrop = (e: DragEvent) => {
  e.preventDefault()
  isDragging.value = false

  const files = e.dataTransfer?.files
  if (files && files[0]) {
    handleFile(files[0])
  }
}

const handleFile = async (file: File) => {
  if (!file.type.startsWith('image/')) {
    emits('imageError', 'Invalid file type')
    return
  }

  try {
    const processedImage = await processImage(file)
    if (processedImage) {
      emits('imageUpload', processedImage)
      modelValue.value = processedImage
    }
  } catch (error) {
    emits('imageError', 'Error processing image')
    console.error('Error processing image:', error)
  }
}

const handleFileInput = (e: Event) => {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (file) handleFile(file)
  input.value = ''
}

const processImage = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = async (e) => {
      const img = new Image()
      img.src = e.target?.result as string

      img.onload = () => {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        if (!ctx) return reject('Canvas context not found')

        // Рассчет новых размеров
        let width = img.width
        let height = img.height

        if (width > props.maxSize || height > props.maxSize) {
          const ratio = Math.min(props.maxSize / width, props.maxSize / height)
          width = Math.floor(width * ratio)
          height = Math.floor(height * ratio)
        }

        canvas.width = width
        canvas.height = height

        ctx.drawImage(img, 0, 0, width, height)

        canvas.toBlob(
          async (blob) => {
            if (!blob) return reject('Conversion failed')

            const dataUrlReader = new FileReader()
            dataUrlReader.onloadend = () => {
              if (dataUrlReader.result) {
                resolve(dataUrlReader.result as string)
              } else {
                reject('Failed to read blob')
              }
            }
            dataUrlReader.readAsDataURL(blob)
          },
          'image/webp',
          props.quality
        )
      }

      img.onerror = () => reject('Image loading error')
    }

    reader.onerror = () => reject('File reading error')
    reader.readAsDataURL(file)
  })
}

const triggerFileInput = () => {
  fileInput.value?.click()
}

onBeforeUnmount(() => {
  if (modelValue.value) {
    URL.revokeObjectURL(modelValue.value)
  }
})
</script>

<template>
  <div>
    <div
      :class="[
        'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors',
        isDragging ? 'border-blue-500 bg-blue-50' : 'border-base-300 hover:border-blue-400'
      ]"
      @click="triggerFileInput"
      @dragover="handleDragOver"
      @dragleave="handleDragLeave"
      @drop="handleDrop"
    >
      <div class="flex flex-col items-center gap-4">
        <IncertImageIcon class="w-12 h-12 text-base-400" />

        <div class="text-base-600">
          <ProseH3>
            Drag and drop an image here or click to select
          </ProseH3>
          <ProseP class="text-sm text-base-400 text-nowrap">
            JPG, PNG, WEBP | 40 x 40
          </ProseP>
        </div>
      </div>
    </div>

    <input
      ref="fileInput"
      type="file"
      accept="image/*"
      class="hidden"
      @change="handleFileInput"
    >
  </div>
</template>
