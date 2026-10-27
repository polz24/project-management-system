/** UserList Component
* Displays a list of projects with search functionality and action buttons for edit and delete
**/

import { Text } from "@/components"
import CustomAvatar from "@/components/custom-avatar"
import { ActionButtons } from "@/components/role-based-access/action-buttons"
import { CreateButtonWithTooltip } from "@/components/role-based-access/create-button-tooltip"
import { IUser } from "@/interfaces"
import { SearchOutlined } from "@ant-design/icons"
import { List, useTable } from "@refinedev/antd"
import { useCan, useGo } from "@refinedev/core"
import { Button, Input, Space, Table } from "antd"
import { useState } from "react"

export const UserList = () => {
  const go = useGo()
  const [searchText, setSearchText] = useState("")
  const [searchedColumn, setSearchedColumn] = useState("")

  // Add permission checks
  const { data: createPermission } = useCan({
    resource: "users",
    action: "create",
  })

  const { data: editPermission } = useCan({
    resource: "users",
    action: "edit",
  })

  const { data: deletePermission } = useCan({
    resource: "users",
    action: "delete",
  })

  const { tableProps, setFilters } = useTable<IUser>({
    resource: "users",
    pagination: {
      pageSize: 7,
    },
    sorters: {
      initial: [
        {
          field: "id",
          order: "asc",
        },
      ],
    },
    filters: {
      initial: [],
      defaultBehavior: "replace",
    },
    meta: {
      select: `
        *,
        roles(id, role_name)
      `,
    },
  })

  const handleSearch = (
    selectedKeys: React.Key[],
    confirm: () => void,
    dataIndex: string
  ) => {
    const value = selectedKeys[0]?.toString() || ""
    confirm()
    setSearchText(value)
    setSearchedColumn(dataIndex)

    if (value) {
      setFilters([
        {
          field: dataIndex,
          operator: "contains",
          value: value,
        },
      ])
    } else {
      setFilters([])
    }
  }

  const handleReset = (clearFilters: () => void, confirm: () => void) => {
    clearFilters()
    setSearchText("")
    setSearchedColumn("")
    confirm()
    setFilters([])
  }

  return (
    <List
      breadcrumb={false}
      headerButtons={() => (
        <CreateButtonWithTooltip
          onClick={() => {
            go({
              to: {
                resource: "users",
                action: "create",
              },
              options: {
                keepQuery: true,
              },
              type: "replace",
            })
          }}
          canCreate={createPermission?.can}
          resourceName='users'
        />
      )}
    >
      <Table {...tableProps} rowKey='id' dataSource={tableProps.dataSource}>
        <Table.Column
          dataIndex='user_name'
          title='Name'
          filterDropdown={({
            setSelectedKeys,
            selectedKeys,
            confirm,
            clearFilters,
          }) => (
            <div style={{ padding: 8 }} onKeyDown={(e) => e.stopPropagation()}>
              <Input
                autoFocus
                placeholder='Search User'
                value={selectedKeys[0]}
                onChange={(e) => {
                  setSelectedKeys(e.target.value ? [e.target.value] : [])
                }}
                onPressEnter={() =>
                  handleSearch(selectedKeys, confirm, "user_name")
                }
                style={{
                  marginBottom: 8,
                  display: "block",
                  width: 200,
                }}
              />
              <Space
                style={{ display: "flex", justifyContent: "space-between" }}
              >
                <Button
                  type='primary'
                  onClick={() =>
                    handleSearch(selectedKeys, confirm, "user_name")
                  }
                  icon={<SearchOutlined />}
                  size='small'
                >
                  Search
                </Button>
                <Button
                  onClick={() =>
                    clearFilters && handleReset(clearFilters, confirm)
                  }
                  size='small'
                >
                  Reset
                </Button>
              </Space>
            </div>
          )}
          filterIcon={() => (
            <SearchOutlined
              style={{
                color:
                  searchedColumn === "user_name" && searchText
                    ? "#1890ff"
                    : undefined,
              }}
            />
          )}
          render={(value, record: IUser) => (
            <Space>
              <CustomAvatar shape='circle' name={record.user_name} />
              <Text style={{ whiteSpace: "nowrap" }}>{record.user_name}</Text>
            </Space>
          )}
        />

        <Table.Column
          dataIndex={["roles", "role_name"]}
          title='Job Title'
          render={(value: string) => <Text>{value || "No Role Assigned"}</Text>}
        />

        <Table.Column dataIndex='email' title='Email' />

        <Table.Column
          dataIndex='id'
          title='Actions'
          fixed='right'
          render={(value) => (
            <Space>
              <ActionButtons
                onEdit={() => {
                  go({
                    to: {
                      resource: "users",
                      action: "edit",
                      id: value,
                    },
                    options: {
                      keepQuery: true,
                    },
                    type: "replace",
                  })
                }}
                onDelete={() => {
                  // Your delete handler
                }}
                canEdit={editPermission?.can}
                canDelete={deletePermission?.can}
                hideText
              />
            </Space>
          )}
        />
      </Table>
    </List>
  )
}
