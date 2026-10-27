
/**
 * ProjectList Component
 * Displays a list of projects with search, sort, and filter capabilities
 */

// Import necessary dependencies and components
import { List, useTable, EditButton, DeleteButton } from "@refinedev/antd"
import { Space, Table, Input, Button } from "antd"
import { IProject } from "@/interfaces"
import { SearchOutlined } from "@ant-design/icons"
import { useState } from "react"



export const ProjectList = () => {
  // State for managing search functionality
  const [searchText, setSearchText] = useState("")
  const [searchedColumn, setSearchedColumn] = useState("")

  /**
   * useTable hook configuration for project data management
   * Handles pagination, sorting, and filtering
   */

  const { tableProps, setFilters } = useTable<IProject>({
    resource: "projects",
    // Pagination configuration
    pagination: {
      pageSize: 10,
    },
    // Initial sorting configuration
    sorters: {
      initial: [
        {
          field: "id",
          order: "asc",
        },
      ],
    },
    // Filter configuration
    filters: {
      initial: [],
      defaultBehavior: "replace", // Replaces existing filters instead of appending
    },
    // Fields to fetch from the API
    meta: {
      fields: ["id", "project_name", "description", "start_date", "due_date"],
    },
  })

  /**
   * Handles the search functionality for the table
   * @param selectedKeys - Array of selected search keys
   * @param confirm - Confirmation function from antd
   * @param dataIndex - Column to search in
   */

  const handleSearch = (
    selectedKeys: React.Key[],
    confirm: () => void,
    dataIndex: string
  ) => {
    const value = selectedKeys[0]?.toString() || ""
    confirm()
    setSearchText(value)
    setSearchedColumn(dataIndex)

    // Apply filters if search value exists
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
  /**
   * Handles resetting the search filters
   * @param clearFilters - Function to clear filters
   * @param confirm - Confirmation function from antd
   */

  const handleReset = (clearFilters: () => void, confirm: () => void) => {
    clearFilters()
    setSearchText("")
    setSearchedColumn("")
    confirm()
    setFilters([])
  }

  return (
    <List>
      <Table {...tableProps} rowKey='id' dataSource={tableProps.dataSource}>
        <Table.Column
          dataIndex='project_name'
          title='Project Name'
          filterDropdown={({
            setSelectedKeys,
            selectedKeys,
            confirm,
            clearFilters,
          }) => (
            <div style={{ padding: 8 }} onKeyDown={(e) => e.stopPropagation()}>
              <Input
                autoFocus
                placeholder='Search Project Name'
                value={selectedKeys[0]}
                onChange={(e) => {
                  setSelectedKeys(e.target.value ? [e.target.value] : [])
                }}
                onPressEnter={() =>
                  handleSearch(selectedKeys, confirm, "project_name")
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
                    handleSearch(selectedKeys, confirm, "project_name")
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
                  searchedColumn === "project_name" && searchText
                    ? "#1890ff"
                    : undefined,
              }}
            />
          )}
        />
        <Table.Column
          dataIndex='description'
          title='Description'
          sorter={(a, b) => {
            if (a.description && b.description) {
              return a.description.localeCompare(b.description)
            }
            return 0
          }}
        />
        <Table.Column
          dataIndex='start_date'
          title='Start Date'
          render={(value) => value && new Date(value).toLocaleDateString()}
          sorter={(a, b) => {
            if (a.start_date && b.start_date) {
              return (
                new Date(a.start_date).getTime() -
                new Date(b.start_date).getTime()
              )
            }
            return 0
          }}
        />
        <Table.Column
          dataIndex='due_date'
          title='Due Date'
          render={(value) => value && new Date(value).toLocaleDateString()}
          sorter={(a, b) => {
            if (a.due_date && b.due_date) {
              return (
                new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
              )
            }
            return 0
          }}
        />
        <Table.Column<IProject>
          title='Actions'
          dataIndex='actions'
          render={(_, record) => (
            <Space>
              <EditButton hideText size='small' recordItemId={record.id} />
              <DeleteButton hideText size='small' recordItemId={record.id} />
            </Space>
          )}
        />
      </Table>
    </List>
  )
}
