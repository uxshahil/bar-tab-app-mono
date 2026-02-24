<script setup lang="ts">
import { Field } from 'vee-validate'

const props = defineProps<{
  name: string
}>()
</script>

<template>
  <Field :name="props.name" v-bind="$attrs">
    <template #default="slotProps">
      <slot v-bind="slotProps" />
    </template>
  </Field>
</template>
