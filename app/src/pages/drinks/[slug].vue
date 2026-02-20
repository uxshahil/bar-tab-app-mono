<script setup lang="ts">
// Add to Tab Logic

const route = useRoute()
const drinksStore = useDrinksStore()
const authStore = useAuthStore()
const { drink, isRevalidating } = storeToRefs(drinksStore)

const slug = computed(() => (route.params as { slug?: string }).slug || '')

const pageLoading = ref(true)
const loading = computed(() => pageLoading.value || isRevalidating.value)

const loadData = async () => {
  // Clear previous state to ensure "loading" skeleton is shown for the new drink
  drinksStore.clearDrink()

  pageLoading.value = true
  if (slug.value) {
    await drinksStore.getDrink(slug.value)
  }
  pageLoading.value = false
}

onMounted(() => {
  loadData()
})

onUnmounted(() => {
  drinksStore.clearDrink()
})

watch(slug, (newSlug, oldSlug) => {
  if (newSlug !== oldSlug) {
    loadData()
  }
})

const safeDate = computed(() => {
  if (!drink.value?.created_at) return 'N/A'
  return new Date(drink.value.created_at).toLocaleDateString()
})

const parseJsonInstructions = (text: string): string[] | null => {
  if (!text.trim().startsWith('[')) return null
  try {
    const parsed = JSON.parse(text)
    if (Array.isArray(parsed)) return parsed
  } catch (e) {
    console.warn('Failed to parse instructions JSON:', e)
  }
  return null
}

const parseNumberedList = (raw: string): string[] | null => {
  if (!/\d{1,4}\.\s{0,10}/.test(raw)) return null
  const parts = raw.split(/(\d{1,4}\.\s{0,10})/).filter((p) => p.trim())
  const steps: string[] = []
  let i = 0
  while (i < parts.length) {
    const current = parts[i]
    if (current && /^\d{1,4}\.\s{0,10}$/.test(current)) {
      if (parts[i + 1]) {
        steps.push(parts[i + 1]?.trim() || '')
        i++ // Skip the next part since it's the content
      }
    } else if (i === 0 && current && current.trim()) {
      steps.push(current.trim())
    }
    i++
  }
  return steps.length > 0 ? steps : null
}

const parseSentences = (raw: string): string[] | null => {
  if (!raw.includes('. ')) return null
  const sentences = raw.split(/\.\s+(?=[A-Z])/).map((s) => s.trim())
  return sentences.length > 1 ? sentences : null
}

const parsedInstructions = computed(() => {
  if (!drink.value?.instructions) return []
  const text = drink.value.instructions

  // 1. Try JSON Parse (New Format)
  const jsonParsed = parseJsonInstructions(text)
  if (jsonParsed) return jsonParsed

  const raw = text.trim()

  // 2. Enhanced List Parsing
  const listParsed = parseNumberedList(raw)
  if (listParsed) return listParsed

  // 3. Sentence Splitting
  const sentenceParsed = parseSentences(raw)
  if (sentenceParsed) return sentenceParsed

  // 4. Fallback: Newlines
  if (text.includes('\n')) {
    return text.split('\n').filter((step: string) => step.trim().length > 0)
  }
  return [text]
})

const formattedIngredients = computed(() => {
  if (!drink.value?.ingredients) return []

  return drink.value.ingredients.map((ingredient, index) => {
    let measurement = drink.value?.measurements?.[index] || ''
    let name = ingredient

    // Fix: "1/2 oz Bacardi" -> Measurement: "1/2 oz", Name: "Bacardi 151 proof rum"
    // Check for specific brands appearing in measurement
    const brands = ['Bacardi'] // Expandable list

    for (const brand of brands) {
      if (measurement && measurement.includes(brand)) {
        measurement = measurement.replace(brand, '').trim()
        // Determine if we should prepend or append based on context, or just prepend as a safe default
        // If the ingredient name doesn't already contain the brand
        if (!name.toLowerCase().includes(brand.toLowerCase())) {
          name = `${brand} ${name}`
        }
      }
    }

    return { measurement, name }
  })
})

const addToTabStore = useAddToTabStore()
const handleAddToTab = () => {
  if (drink.value) {
    addToTabStore.open(drink.value)
  }
}
</script>

<template>
  <div class="min-h-screen text-primary p-6 md:p-12 font-serif bg-cover bg-center bg-fixed">
    <div v-if="loading && !drink" class="max-w-4xl mx-auto space-y-16">
      <!-- Full Page Skeleton (Initial Load / No Data) -->
      <header
        class="flex flex-col-reverse md:flex-row md:justify-between md:items-end gap-8 pb-12 border-b border-primary/20 relative"
      >
        <div class="space-y-4 max-w-2xl w-full">
          <div class="flex gap-x-6 gap-y-2 mb-6">
            <Skeleton class="h-4 w-24 bg-primary/10" />
            <Skeleton class="h-4 w-24 bg-primary/10" />
            <Skeleton class="h-4 w-24 bg-primary/10" />
          </div>
          <Skeleton class="h-16 md:h-20 w-3/4 bg-primary/10" />
          <div class="flex flex-row justify-between pt-2">
            <div class="flex gap-4">
              <Skeleton class="h-4 w-32 bg-primary/10" />
              <Skeleton class="h-4 w-16 bg-primary/10" />
            </div>
            <Skeleton class="h-10 w-32 rounded-full bg-primary/10" />
          </div>
        </div>
        <div class="md:absolute md:top-0 md:right-0">
          <Skeleton class="w-24 h-24 rounded-full bg-primary/10" />
        </div>
      </header>

      <div class="grid grid-cols-1 md:grid-cols-12 gap-12">
        <div class="md:col-span-4 space-y-12">
          <div>
            <Skeleton class="h-4 w-32 mb-6 bg-primary/10" />
            <div class="space-y-4">
              <div v-for="i in 5" :key="i" class="flex gap-3">
                <Skeleton class="h-4 w-12 bg-primary/10" />
                <Skeleton class="h-4 w-full bg-primary/10" />
              </div>
            </div>
          </div>
        </div>
        <div class="md:col-span-8">
          <Skeleton class="h-4 w-48 mb-6 bg-primary/10" />
          <div class="space-y-6">
            <Skeleton class="h-6 w-full bg-primary/10" />
            <Skeleton class="h-6 w-11/12 bg-primary/10" />
            <Skeleton class="h-6 w-full bg-primary/10" />
            <Skeleton class="h-6 w-3/4 bg-primary/10" />
          </div>
        </div>
      </div>
    </div>

    <div v-else-if="!drink" class="flex h-[50vh] flex-col items-center justify-center gap-4">
      <div class="text-2xl font-bold">404</div>
      <div class="text-sm uppercase tracking-widest">Drink not found</div>
    </div>

    <main v-else class="max-w-4xl mx-auto space-y-16">
      <!-- Header Section (Always Visible if Drink Exists) -->
      <header
        class="flex flex-col-reverse md:flex-row md:justify-between md:items-end gap-8 pb-12 border-b border-primary/20 relative"
      >
        <div class="space-y-4 max-w-2xl">
          <!-- Icon Row (Minimal) -->
          <div class="flex flex-wrap gap-x-6 gap-y-2 text-primary/70 mb-6">
            <div class="flex items-center gap-2 group cursor-help">
              <AppDrinkIcon :name="drink.category?.name || 'Other'" class="w-4 h-4" />
              <span
                class="text-[10px] font-mono uppercase tracking-[0.2em] group-hover:text-primary transition-colors"
              >
                {{ drink.category?.name || 'Unknown' }}
              </span>
            </div>

            <div class="flex items-center gap-2 group cursor-help">
              <AppDrinkIcon :name="drink.glass || 'Other / Unknown'" class="w-4 h-4" />
              <span
                class="text-[10px] font-mono uppercase tracking-[0.2em] group-hover:text-primary transition-colors"
              >
                {{ drink.glass || 'Glass' }}
              </span>
            </div>

            <div class="flex items-center gap-2 group cursor-help">
              <AppDrinkIcon
                :name="drink.alcoholic ? 'Alcoholic' : 'Non-Alcoholic'"
                class="w-4 h-4"
              />
              <span
                class="text-[10px] font-mono uppercase tracking-[0.2em] group-hover:text-primary transition-colors"
              >
                {{ drink.alcoholic ? 'Alcoholic' : 'No Alcohol' }}
              </span>
            </div>
          </div>
          <h1 class="text-5xl md:text-7xl font-serif lowercase tracking-tighter leading-[0.9]">
            {{ drink.name }}
          </h1>
          <div class="flex flex-row justify-between">
            <div
              class="flex items-center gap-3 text-xs uppercase tracking-[0.2em] text-primary/60 font-mono"
            >
              <span>{{ drink.category?.name || 'Unknown Category' }}</span>
              <span class="w-1 h-1 rounded-full bg-current"></span>
              <span>R {{ drink.price }}</span>
            </div>
            <Button
              v-if="authStore.profile?.user_role !== 'admin'"
              size="sm"
              class="cursor-pointer rounded-full px-8 py-6 text-sm font-serif bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-lg hover:shadow-xl hover:-translate-y-1"
              @click="handleAddToTab"
            >
              Add to Tab
            </Button>
          </div>
        </div>

        <div class="md:absolute md:top-0 md:right-0 flex flex-col items-end gap-6">
          <!-- Header Actions -->
          <div
            class="w-24 h-24 flex items-center justify-center border border-solid border-primary/30 rounded-full hover:rotate-12 transition-transform duration-500 cursor-help"
          >
            <img :src="drink.thumb_url" :alt="drink.name" class="w-full h-full rounded-full" />
          </div>
        </div>
      </header>

      <div class="grid grid-cols-1 md:grid-cols-12 gap-12">
        <!-- Ingredients Column -->
        <div class="md:col-span-4 space-y-12">
          <div>
            <h2
              class="text-xs font-bold uppercase tracking-[0.3em] pb-3 border-b border-primary/10 mb-6"
            >
              Components
            </h2>

            <!-- Loading Skeleton for Differential Data -->
            <div v-if="loading && (!drink.ingredients || drink.ingredients.length === 0)">
              <div class="space-y-4">
                <div v-for="i in 5" :key="i" class="flex gap-3">
                  <Skeleton class="h-4 w-12 bg-primary/10" />
                  <Skeleton class="h-4 w-full bg-primary/10" />
                </div>
              </div>
            </div>

            <div v-else-if="formattedIngredients.length">
              <ul class="space-y-4">
                <li
                  v-for="(item, index) in formattedIngredients"
                  :key="index"
                  class="flex items-baseline gap-3 group"
                >
                  <span
                    class="text-[10px] font-mono text-primary/50 w-auto min-w-[3rem] text-right group-hover:text-primary transition-colors"
                  >
                    {{ item.measurement }}
                  </span>
                  <span
                    class="text-sm border-b border-dotted border-primary/30 flex-1 pb-1 uppercase tracking-wider group-hover:border-primary transition-colors"
                  >
                    {{ item.name }}
                  </span>
                </li>
              </ul>
            </div>
            <!-- Since we largely don't have ingredients, let's show a placeholder or nothing -->
            <div v-else class="text-sm italic opacity-40 font-serif leading-relaxed">
              A secret blend of ingredients for this
              {{ drink.category?.name?.toLowerCase() || 'beverage' }}.
            </div>
          </div>

          <!-- Meta Data -->
          <div class="space-y-6 pt-6 border-t border-primary/5">
            <div class="space-y-2 font-mono text-[10px] uppercase text-primary/40 pt-4">
              <div class="flex justify-between">
                <span>ID</span>
                <span>{{ drink.id }}</span>
              </div>
              <div class="flex justify-between">
                <span>Added</span>
                <span>{{ safeDate }}</span>
              </div>
              <div class="flex justify-between">
                <span>Menu</span>
                <span>{{ drink.category?.menu?.name || 'Standard' }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Method/Description Column -->
        <div class="md:col-span-8 flex flex-col justify-between">
          <div class="space-y-8">
            <h2
              class="text-xs font-bold uppercase tracking-[0.3em] pb-3 border-b border-primary/10"
            >
              Preparation / Notes
            </h2>

            <!-- Loading Skeleton for Differential Data -->
            <div v-if="loading && !drink.instructions">
              <div class="space-y-6">
                <Skeleton class="h-6 w-full bg-primary/10" />
                <Skeleton class="h-6 w-11/12 bg-primary/10" />
                <Skeleton class="h-6 w-full bg-primary/10" />
                <Skeleton class="h-6 w-3/4 bg-primary/10" />
              </div>
            </div>

            <div v-else class="space-y-6">
              <template v-if="parsedInstructions.length">
                <p
                  v-for="(step, index) in parsedInstructions"
                  :key="index"
                  class="text-xl md:text-2xl leading-relaxed font-serif text-primary/90"
                >
                  <span
                    class="inline-block text-[10px] font-mono mr-3 -translate-y-1 opacity-40 border border-primary/20 w-5 h-5 rounded-full text-center leading-5 select-none"
                    >{{ index + 1 }}</span
                  >
                  {{ step }}
                </p>
              </template>
              <template v-else>
                <p class="text-xl md:text-2xl leading-relaxed text-primary/40 italic">
                  No specific instructions provided.
                </p>
              </template>
            </div>
          </div>

          <!-- Decorative -->
          <div class="mt-16 md:mt-0 flex justify-center opacity-10">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor">
              <path
                d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-5.5-2.5 7.51-3.22-7.52-3.22 3.22-7.52 3.22 7.52 7.52 3.22-7.52 3.22-3.22 7.52z"
              />
            </svg>
          </div>
        </div>
      </div>
    </main>
    <!-- Footer -->
    <footer
      class="pt-8 mt-8 border-t border-primary/10 flex justify-between items-end opacity-40 hover:opacity-100 transition-opacity duration-500"
    >
      <div class="flex flex-col gap-1">
        <div class="text-[9px] uppercase tracking-[0.3em]">Bar Tab App</div>
        <div class="text-[9px] uppercase tracking-[0.3em]">Menu Collection Volume I</div>
      </div>
      <div class="font-mono text-[9px] uppercase tracking-widest">
        Item {{ drink?.id ? drink.id.toString().padStart(4, '0') : '----' }}
      </div>
    </footer>
  </div>
</template>
