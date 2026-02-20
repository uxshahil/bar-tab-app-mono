<script setup lang="ts">
import { formatCurrency } from '@/utils/currency'

const props = defineProps<{
  value: number
  id: number
}>()

const emit = defineEmits<{
  update: [id: number, newValue: number]
}>()

const authStore = useAuthStore()
const { profile } = storeToRefs(authStore)

const isEditing = ref(false)
const editValue = ref(props.value)
const inputRef = ref<HTMLInputElement | null>(null)

// Check if user has permission to edit prices
const canEditPrice = computed(() => {
  return profile.value?.user_role === 'bar-manager' || profile.value?.user_role === 'admin'
})

const startEditing = async () => {
  // Only allow editing if user has the required role
  if (!canEditPrice.value) return

  editValue.value = props.value
  isEditing.value = true
  await nextTick()
  // Focus the input
  inputRef.value?.focus()
}

const save = () => {
  isEditing.value = false
  if (editValue.value !== props.value) {
    emit('update', props.id, Number(editValue.value))
  }
}

const cancel = () => {
  isEditing.value = false
  editValue.value = props.value
}
</script>

<template>
  <div class="flex justify-end relative h-8 items-center group">
    <div
      v-if="!isEditing"
      @click="startEditing"
      :class="{
        'cursor-pointer hover:bg-muted/50': canEditPrice,
        'cursor-not-allowed opacity-60': !canEditPrice,
      }"
      class="px-2 py-1 rounded transition-colors w-full text-right"
      :title="canEditPrice ? 'Click to edit' : 'Only bar-manager and admin can edit prices'"
    >
      {{ formatCurrency(value) }}
      <span
        v-if="canEditPrice"
        class="opacity-0 group-hover:opacity-40 text-[10px] ml-1 absolute right-full top-1/2 -translate-y-1/2 pr-1"
        >✎</span
      >
    </div>
    <div v-else class="flex items-center w-24">
      <Input
        ref="inputRef"
        :id="`price-input-${id}`"
        v-model="editValue"
        type="number"
        step="0.01"
        min="0"
        class="h-8 text-right"
        @blur="save"
        @keydown.enter="save"
        @keydown.esc="cancel"
      />
    </div>
  </div>
</template>
