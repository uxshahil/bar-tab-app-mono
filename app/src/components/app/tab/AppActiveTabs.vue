<script setup lang="ts">
const tabsStore = useTabsStore()
const authStore = useAuthStore()
const { openTabsList: openTabs, tab: currentTab } = storeToRefs(tabsStore)
const { profile } = storeToRefs(authStore)
const isOpen = ref(false)
const emit = defineEmits(['tab-selected'])

onMounted(async () => {
  await tabsStore.getOpenTabs()
})

const selectTab = async (tab: Tabs[0]) => {
  await tabsStore.getTab(tab.id.toString())
  await tabsStore.getTabSplits(tab.id.toString())
  await tabsStore.getTabItems(tab.id.toString())
  emit('tab-selected', tab)
  isOpen.value = false
}

const createNewTab = async () => {
  if (!profile.value?.id) return

  // Get count of tabs created today
  const { count } = await todaysTabsCountQuery()
  const nextCount = (count || 0) + 1

  // Format: TAB-MMDD-XXXX
  const today = new Date()
  const month = (today.getMonth() + 1).toString().padStart(2, '0')
  const day = today.getDate().toString().padStart(2, '0')
  const sequence = nextCount.toString().padStart(4, '0')

  const tabNumber = `TAB-${month}${day}-${sequence}`

  const tabId = await tabsStore.createTab({
    user_id: profile.value.id,
    bar_id: 1, // Default to 1 for now
    tab_number: tabNumber,
    status: 'open',
    subtotal: 0,
    tax_amount: 0,
    total_before_tip: 0,
    tip_amount: 0,
    total_owed: 0,
  })

  if (tabId) {
    await tabsStore.getOpenTabs()
    const newTab = openTabs.value?.find((t) => t.id === tabId)
    if (newTab) {
      await selectTab(newTab)
    }
  }
}
</script>

<template>
  <Popover v-model:open="isOpen">
    <PopoverTrigger as-child>
      <Button variant="outline" class="relative hover:cursor-pointer">
        <iconify-icon icon="lucide:receipt" class="mr-2" />
        Active Tabs
        <Badge
          v-if="openTabs?.length"
          variant="secondary"
          class="ml-2 h-5 min-w-5 px-1 flex items-center justify-center rounded-full text-xs"
        >
          {{ openTabs.length }}
        </Badge>
      </Button>
    </PopoverTrigger>
    <PopoverContent class="w-80 p-0" align="end">
      <div class="p-4 border-b">
        <h4 class="font-medium leading-none">Active Tabs</h4>
        <p class="text-sm text-muted-foreground mt-1">Currently open customer tabs.</p>
      </div>
      <div class="max-h-[300px] overflow-y-auto">
        <div v-if="openTabs?.length" class="divide-y">
          <div
            v-for="tab in openTabs"
            :key="tab.id"
            @click="selectTab(tab)"
            class="p-3 hover:bg-muted/50 transition-colors cursor-pointer flex justify-between items-center"
            :class="{ 'bg-muted': currentTab?.id === tab.id }"
          >
            <div>
              <p class="font-medium text-sm">{{ tab.tab_number }}</p>
              <p class="text-xs text-muted-foreground">
                {{
                  new Date(tab.created_at).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                }}
              </p>
            </div>
            <div class="text-right">
              <p class="font-bold text-sm">{{ formatCurrency(tab.total_owed) }}</p>
              <Badge variant="outline" class="text-[10px] uppercase">{{ tab.status }}</Badge>
            </div>
          </div>
        </div>
        <div v-else class="p-8 text-center text-muted-foreground text-sm">
          No active tabs found.
        </div>
      </div>
      <div class="p-2 border-t bg-muted/20">
        <Button
          variant="ghost"
          class="w-full justify-start text-xs h-8 hover:cursor-pointer"
          @click="createNewTab"
        >
          <iconify-icon icon="lucide:plus" class="mr-2 h-3 w-3" />
          Create New Tab
        </Button>
      </div>
    </PopoverContent>
  </Popover>
</template>
