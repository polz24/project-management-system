/**
 * UserReport component displays a table of user reports
 * including total projects, active projects, total tasks,
 * pending tasks, and total hours spent on tasks.
 */
import { useState, useEffect, Key } from "react"
import { Button, Input, Space, Table, Tag } from "antd"
import { supabaseClient } from "@/utilities/supabaseClient"
import { SearchOutlined } from "@ant-design/icons"
import { ColumnType } from "antd/es/table"
import { FilterDropdownProps } from "antd/es/table/interface"

interface UserReport {
  uid: string
  user_name: string
  total_projects: number
  active_projects: number
  total_tasks: number
  pending_tasks: number
  total_minutes: number
}

interface UserReportProps {
  loading: boolean
  setLoading: (loading: boolean) => void
}

export const UserReport = ({ loading, setLoading }: UserReportProps) => {
  const [userReports, setUserReports] = useState<UserReport[]>([])
  const [searchText, setSearchText] = useState("")

  // Add this function
  const getFilteredReports = () => {
    if (!searchText) return userReports
    return userReports.filter((report) =>
      report.user_name.toLowerCase().includes(searchText.toLowerCase())
    )
  }

  const fetchUserReports = async () => {
    setLoading(true)
    try {
      const { data: userData, error } = await supabaseClient.from("users")
        .select(`
          uid,
          user_name,
          tasks (
            id,
            stageId,
            project_id,
            totalMinutes,
            taskStages (
              id,
              title
            )
          )
        `)

      if (error) {
        console.log("Supabase Error:", error)
        throw error
      }

      // After getting user data, fetch projects separately
      const { data: projectsData, error: projectsError } = await supabaseClient
        .from("projects")
        .select("id")

      if (projectsError) {
        console.log("Supabase Error:", projectsError)
        throw projectsError
      }

      const transformedData: UserReport[] = userData.map((user: any) => {
        const tasks = user.tasks || []

        // Get unique projects from tasks
        const userProjectIds = Array.from(
          new Set(tasks.map((task: any) => task.project_id))
        )

        // Get all projects this user is involved in
        const userProjects = projectsData.filter((project: any) =>
          userProjectIds.includes(project.id)
        )

        // Get active projects (projects with pending tasks)
        const activeProjects = userProjectIds.filter((projectId: any) => {
          // Get all tasks for this project
          const projectTasks = tasks.filter(
            (task: any) => task.project_id === projectId
          )

          // Check if there are any pending tasks in this project
          return projectTasks.some((task: any) => {
            const stageTitle = task.taskStages?.title?.toLowerCase()
            return stageTitle !== "done" && stageTitle !== "completed"
          })
        })

        // Count pending tasks based on their stages
        const pendingTasks = tasks.filter((task: any) => {
          const stageTitle = task.taskStages?.title?.toLowerCase()
          return stageTitle !== "done" && stageTitle !== "completed"
        })

        // Calculate total minutes from all tasks
        const totalMinutes = tasks.reduce((acc: number, task: any) => {
          return acc + (task.totalMinutes || 0)
        }, 0)

        return {
          uid: user.uid,
          user_name: user.user_name,
          total_projects: userProjects.length,
          active_projects: activeProjects.length,
          total_tasks: tasks.length,
          pending_tasks: pendingTasks.length,
          total_minutes: totalMinutes,
        }
      })

      setUserReports(transformedData)
    } catch (error) {
      console.error("Error fetching user reports:", error)
    } finally {
      setLoading(false)
    }
  }

  // Add TimeDisplay component for formatting hours and minutes
  const TimeDisplay = ({ minutes }: { minutes: number }) => {
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    return (
      <span>
        {hours}h {remainingMinutes}m
      </span>
    )
  }

  const userColumns: ColumnType<UserReport>[] = [
    {
      title: "User Name",
      dataIndex: "user_name",
      key: "user_name",
      width: "20%",
      filterDropdown: ({
        setSelectedKeys,
        selectedKeys,
        confirm,
        clearFilters,
      }: FilterDropdownProps) => (
        <div style={{ padding: 8 }}>
          <Input
            placeholder='Search user name'
            value={selectedKeys[0]}
            onChange={(e) =>
              setSelectedKeys(e.target.value ? [e.target.value] : [])
            }
            onPressEnter={() => confirm()}
            style={{ width: 188, marginBottom: 8, display: "block" }}
          />
          <Space>
            <Button
              type='primary'
              onClick={() => confirm()}
              size='small'
              style={{ width: 90 }}
            >
              Search
            </Button>
            <Button
              onClick={() => {
                clearFilters?.()
                confirm()
              }}
              size='small'
              style={{ width: 90 }}
            >
              Reset
            </Button>
          </Space>
        </div>
      ),
      filterIcon: (filtered: boolean) => (
        <SearchOutlined style={{ color: filtered ? "#1890ff" : undefined }} />
      ),
      onFilter: (value: boolean | Key, record: UserReport) => {
        const searchValue = String(value).toLowerCase()
        return record.user_name.toLowerCase().includes(searchValue)
      },
    },

    {
      title: "Total Projects",
      dataIndex: "total_projects",
      key: "total_projects",
      width: "15%",
    },
    {
      title: "Active Projects",
      dataIndex: "active_projects",
      key: "active_projects",
      width: "20%",
      render: (active: number) => (
        <Tag color={active > 0 ? "blue" : "default"}>{active}</Tag>
      ),
    },
    {
      title: "Total Tasks",
      dataIndex: "total_tasks",
      key: "total_tasks",
      width: "15%",
    },
    {
      title: "Pending Tasks",
      dataIndex: "pending_tasks",
      key: "pending_tasks",
      width: "15%",
      render: (pending: number) => (
        <Tag color={pending > 0 ? "orange" : "green"}>{pending}</Tag>
      ),
    },

    {
      title: "Total Hours",
      dataIndex: "total_minutes",
      key: "total_minutes",
      width: "20%",
      render: (minutes: number) => <TimeDisplay minutes={minutes} />,
      sorter: (a, b) => a.total_minutes - b.total_minutes,
    },
  ]

  useEffect(() => {
    fetchUserReports()
  }, [])

  return (
    <Table
      columns={userColumns}
      dataSource={userReports}
      rowKey='uid'
      loading={loading}
      pagination={false}
      style={{ overflowX: "auto" }}
    />
  )
}
