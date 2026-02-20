import type { DeleteUser } from '@/interfaces/UserInterfaces'
import profileApi from '@/services/api/profileApi'
import type { Profiles } from '@/services/supabase/types/profileTypes'
import type { ColumnDef } from '@tanstack/vue-table'

const { deleteProfile } = profileApi

export const columns: ColumnDef<Profiles[0]>[] = [
  {
    accessorKey: 'username',
    header: () => h('div', { class: 'text-left' }, 'Name'),
    cell: ({ row }) => {
      const username = row.original.username
      return h(
        RouterLink,
        {
          to: `/users/${username}`,
          class: 'text-left font-medium hover:bg-muted block w-full',
        },
        () => username,
      )
    },
  },
  {
    accessorKey: 'user_role',
    header: () => h('div', { class: 'text-left' }, 'Role'),
    cell: ({ row }) => {
      const role = row.original.user_role
      return h('div', { class: 'text-left' }, role)
    },
  },
  {
    id: 'actions',
    header: () => h('div', { class: 'text-left' }, 'Actions'),
    enableHiding: false,
    cell: ({ row, table }) => {
      const user = row.original

      return h(
        'div',
        { class: 'relative' },
        h(DropdownAction, {
          object: {
            id: user.id,
            name: user.username,
            editFn: () => {
              // @ts-expect-error - Custom meta property

              table.options.meta?.onEditUser?.(user)
            },
            deleteFn: () => deleteProfile({ id: user?.id } as DeleteUser),
          },
        }),
      )
    },
  },
]
