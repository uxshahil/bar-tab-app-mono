<script lang="ts" setup>
import { cn } from '@/lib/utils'
import type { LabelProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { useFormField } from './useFormField'

const props = defineProps<LabelProps & { class?: HTMLAttributes['class'] }>()

const { error, formItemId } = useFormField()
</script>

<template>
  <!-- prettier-ignore -->
  <Label data-slot="form-label" :data-error="!!error" :class="cn('data-[error=true]:text-destructive', props.class)" :for="formItemId"> <!-- NOSONAR -->
    <slot />
  </Label>
</template>
