import type { ColumnDef } from '@tanstack/vue-table'
import type { Bars, BarMenus } from '@/services/supabase/types/barTypes'
import { RouterLink } from 'vue-router'

export const columns: ColumnDef<Bars[0]>[] = [
  {
    accessorKey: 'name',
    header: () => h('div', { class: 'text-left' }, 'Name'),
    cell: ({ row }) => {
      const slug = row.original.slug as string

      return h(
        'div',
        { class: 'text-left flex flex-wrap gap-2' },
        h(
          RouterLink,
          {
            to: `/bars/${slug}`,
            class: `text-left font-medium`
          },
          () => row.getValue('name')
        )
      )
    }
  },
  {
    accessorKey: 'bar_menu',
    header: () => h('div', { class: 'text-left' }, 'Menus'),
    cell: ({ row }) => {
      const barMenus = row.getValue('bar_menu') as BarMenus[]
      console.log('barMenus', barMenus)

      if (!Array.isArray(barMenus) || barMenus.length === 0) {
        return h('div', { class: 'text-left text-gray-500' }, 'No menus')
      }

      return h(
        'div',
        { class: 'text-left flex flex-wrap gap-2' },
        barMenus.map((m) =>
          h(
            RouterLink,
            {
              to: `/${(m.menu_name || '').toLowerCase()}`,
              class: `text-left font-medium`
            },
            () => m.menu_name
          )
        )
      )
    }
  }
]
