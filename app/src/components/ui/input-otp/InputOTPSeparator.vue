<script setup lang="ts">
import { MinusIcon } from 'lucide-vue-next'
import { useForwardProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'

const props = defineProps<{ class?: HTMLAttributes['class'] }>()

const forwarded = useForwardProps(props)
</script>

<template>
  <!-- prettier-ignore -->
  <div data-slot="input-otp-separator" role="separator" v-bind="forwarded"> <!-- NOSONAR -->
    <slot>
      <MinusIcon />
    </slot>
  </div>
</template>
