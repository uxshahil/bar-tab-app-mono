<script setup lang="ts">
const menusStore = useMenusStore()
const { menus } = storeToRefs(menusStore)

await menusStore.getMenus()
</script>

<template>
  <AppResourcePage title="Menus" :data="menus" :columns="columns" :loading="!menus" :options="{}" />
</template>
