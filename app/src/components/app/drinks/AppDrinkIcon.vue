<template>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.2"
    stroke-linecap="round"
    stroke-linejoin="round"
    class="drink-icon"
  >
    <component :is="iconPath" />
  </svg>
</template>

<script setup>
import { computed, h } from 'vue'

const props = defineProps({
  name: {
    type: String,
    required: true
  }
})

const icons = {
  // --- CATEGORIES ---
  'Beer': () => [
    h('path', { d: 'M17 11h1a3 3 0 0 1 0 6h-1' }),
    h('path', { d: 'M5 6v13a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V6H5z' }),
    h('path', { d: 'M5 10h12M5 14h12' })
  ],
  'Cocktail': () => [
    h('path', { d: 'm3 3 9 9 9-9' }),
    h('path', { d: 'M12 12v9' }),
    h('path', { d: 'M7 21h10' })
  ],
  'Shake': () => [
    h('path', { d: 'M9 2h6l2 16a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L9 2z' }),
    h('path', { d: 'M12 2v20' }), // Shaker dividing line
    h('path', { d: 'M7 15h10' })
  ],
  'Shot': () => [
    h('path', { d: 'M7 3l1 18h8l1-18H7z' }),
    h('path', { d: 'M7 16h10' })
  ],
  'Coffee / Tea': () => [
    h('path', { d: 'M17 8h1a4 4 0 1 1 0 8h-1' }),
    h('path', { d: 'M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V8z' }),
    h('path', { d: 'M6 2v2M10 2v2M14 2v2' })
  ],
  'Other / Unknown': () => [
    h('circle', { cx: '12', cy: '12', r: '10' }),
    h('path', { d: 'M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3' }),
    h('line', { x1: '12', y1: '17', x2: '12.01', y2: '17' })
  ],

  // --- GLASSWARE ---
  'Highball glass': () => [h('path', { d: 'M7 2h10l1 20H6L7 2z' })],
  'Old-fashioned glass': () => [h('path', { d: 'M7 4l1 16a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2l1-16H7z' })],
  'Collins glass': () => [h('path', { d: 'M8 2h8l1 20H7L8 2z' })],
  'Margarita glass': () => [
    h('path', { d: 'M3 3h18l-2 4H5L3 3z' }),
    h('path', { d: 'M5 7l7 5 7-5' }),
    h('path', { d: 'M12 12v9' }),
    h('path', { d: 'M8 21h8' })
  ],
  'Margarita/Coupette glass': () => [
    h('path', { d: 'M4 4c0 4 4 7 8 7s8-3 8-7H4z' }),
    h('path', { d: 'M12 11v10' }),
    h('path', { d: 'M8 21h8' })
  ],
  'Martini Glass': () => [
    h('path', { d: 'M3 3l9 9 9-9H3z' }),
    h('path', { d: 'M12 12v9' }),
    h('path', { d: 'M8 21h8' })
  ],
  'Champagne flute': () => [
    h('path', { d: 'M9 3h6v9a3 3 0 0 1-6 0V3z' }),
    h('path', { d: 'M12 12v9' }),
    h('path', { d: 'M9 21h6' })
  ],
  'Whiskey Glass': () => [
    h('path', { d: 'M7 4h10l-1 14a4 4 0 0 1-4 4h-1a4 4 0 0 1-4-4L7 4z' }),
    h('path', { d: 'M7 14h10' })
  ],
  'Beer mug': () => [
    h('path', { d: 'M17 8h1a3 3 0 0 1 0 6h-1' }),
    h('path', { d: 'M5 5v15a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V5H5z' })
  ],
  'Mason jar': () => [
    h('path', { d: 'M8 2h8' }),
    h('path', { d: 'M7 5h10v14a3 3 0 0 1-3 3H10a3 3 0 0 1-3-3V5z' }),
    h('path', { d: 'M7 8h10' })
  ],
  'Copper Mug': () => [
    h('path', { d: 'M17 8h2v6h-2' }),
    h('path', { d: 'M4 4h13v13a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4V4z' })
  ],
  'Hurricane glass': () => [
    h('path', { d: 'M12 21v-3' }),
    h('path', { d: 'M12 18c-3 0-4-2-4-5 0-4 4-5 4-8s-4-3-4-3h8s-4 0-4 3 4 4 4 8c0 3-1 5-4 5z' }),
    h('path', { d: 'M9 21h6' })
  ],
  'Shot glass': () => [h('path', { d: 'M8 5l1 15a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2l1-15H8z' })],

  // --- ALCOHOLIC STATUS ---
  'Alcoholic': () => [
    h('circle', { cx: '12', cy: '12', r: '10' }),
    h('path', { d: 'M12 7l-3 10M12 7l3 10M9 14h6' })
  ],
  'Non-Alcoholic': () => [
    h('circle', { cx: '12', cy: '12', r: '10' }),
    h('path', { d: 'm15 9-6 6' })
  ]
}

// Fallback for missing names
const iconPath = computed(() => {
  return icons[props.name] || icons['Other / Unknown']
})
</script>
