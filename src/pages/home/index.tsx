/* DashboardPage Component
 * Main dashboard view that displays various project metrics and statistics */

// Import necessary dependencies
import React, { useEffect, useState } from "react"
import { supabaseClient } from "@/utilities/supabaseClient"
import { Card, Col, Row } from "antd"
import { DashboardTotalCountCard } from "@/components/dashboard/total-count-card"
import { Column, Pie } from "@ant-design/plots" // Import Column and Pie components from Ant Design Plots

// Define types for dashboard metrics
interface TaskStageCount {
  stage: string
  count: number
  tasks: {
    date: string
    count: number
  }[]
}

interface MilestoneData {
  stage: string
  count: number
}
// Define DashboardPage component

export const DashboardPage = () => {
  const [dashboardStats, setDashboardStats] = useState({
    usersCount: 0,
    projectsCount: 0,
    tasksCount: 0,
    milestoneCount: 0,
  })

  // Loading state for API calls
  const [loading, setLoading] = useState<boolean>(true)

  // Local state for dashboard metrics
  const [taskStageData, setTaskStageData] = useState<TaskStageCount[]>([])
  const [milestoneData, setMilestoneData] = useState<MilestoneData[]>([])

  const getTotalCount = async (tableName: string) => {
    let count = 0
    let hasMore = true
    let from = 0
    const PAGE_SIZE = 100

    while (hasMore) {
      const { data, error } = await supabaseClient
        .from(tableName)
        .select("id", { count: "exact" })
        .range(from, from + PAGE_SIZE - 1)

      if (error) {
        console.error(`Error fetching ${tableName} count:`, error)
        break
      }

      if (!data || data.length === 0) {
        hasMore = false
      } else {
        count += data.length
        from += PAGE_SIZE
        hasMore = data.length === PAGE_SIZE
      }
    }

    return count
  }
  //Fetch tasks data
  const fetchTaskStageData = async () => {
    const { data, error } = await supabaseClient.from("tasks").select(`
        id,
        title,
        stageId,
        stages:taskStages(title)
      `)

    if (!error && data) {
      const groupedByStage = data.reduce(
        (acc: Record<string, TaskStageCount>, task: any) => {
          const stageName = task.stages?.title || "Unassigned"
          const dueDate = task.due_date || "Unassigned Date"

          if (!acc[stageName]) {
            acc[stageName] = {
              stage: stageName,
              count: 0,
              tasks: [],
            }
          }

          acc[stageName].count++

          const existingDateIndex = acc[stageName].tasks.findIndex(
            (t) => t.date === dueDate
          )
          if (existingDateIndex >= 0) {
            acc[stageName].tasks[existingDateIndex].count++
          } else {
            acc[stageName].tasks.push({
              date: dueDate,
              count: 1,
            })
          }

          return acc
        },
        {}
      )

      const chartData = Object.values(groupedByStage).sort((a, b) =>
        a.stage.localeCompare(b.stage)
      )

      setTaskStageData(chartData)
    }
  }

  //Fetch milestones data

  const fetchMilestoneData = async () => {
    const { data, error } = await supabaseClient
      .from("milestones")
      .select("stage")

    if (!error && data) {
      const stageCounts = data.reduce(
        (acc: { [key: string]: number }, milestone) => {
          const stage = milestone.stage || "Unassigned"
          acc[stage] = (acc[stage] || 0) + 1
          return acc
        },
        {}
      )

      const formattedData = Object.entries(stageCounts).map(
        ([stage, count]) => ({
          stage,
          count,
        })
      )
      console.log("Formatted Milestone Data:", formattedData) // Debug log
      setMilestoneData(formattedData)
    }
  }

  /**
   * useEffect hook to handle dashboard data fetching
   * This hook runs when the component mounts and when specified dependencies change
   */

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true)
      try {
        const [users, projects, tasks, milestones] = await Promise.all([
          getTotalCount("users"),
          getTotalCount("projects"),
          getTotalCount("tasks"),
          getTotalCount("milestones"),
        ])

        setDashboardStats({
          usersCount: users,
          projectsCount: projects,
          tasksCount: tasks,
          milestoneCount: milestones,
        })

        await Promise.all([fetchTaskStageData(), fetchMilestoneData()])
      } catch (error) {
        console.error("Error fetching dashboard data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  const barConfig = {
    data: taskStageData,
    xField: "stage",
    yField: "count",
    colorField: "stage",
    label: {
      position: "inside",
      style: {
        fill: "#FFFFFF",
        opacity: 0.6,
      },
    },
    xAxis: {
      label: {
        autoHide: true,
        autoRotate: false,
      },
    },
    meta: {
      stage: { alias: "Task Stage" },
      count: { alias: "Number of Tasks" },
    },
    color: ({ stage }: { stage: string }) => {
      switch (stage) {
        case "Unassigned":
          return "#9e9e9e"
        case "TO DO":
          return "#ff9800"
        case "IN PROGRESS":
          return "#2196f3"
        case "IN REVIEW":
          return "#9c27b0"
        case "DONE":
          return "#4caf50"
        default:
          return "#1890ff"
      }
    },
    columnStyle: {
      radius: [4, 4, 0, 0],
    },
    state: {
      active: {
        style: {
          shadowColor: "#000",
          shadowBlur: 4,
          shadowOffsetX: 0,
          shadowOffsetY: 0,
        },
      },
    },
  }

  const pieConfig = {
    data: milestoneData,
    angleField: "count",
    colorField: "stage",
    // Add or modify tooltip configuration
    tooltip: {
      formatter: (datum: { stage: string; count: number }) => {
        return {
          name: datum.stage,
          value: datum.count,
        }
      },
    },
    radius: 0.8,
    label: {
      type: "outer",
      //offset: "-30%",
      content: ({ stage, count }: { stage: string; count: number }) =>
        `${stage}: ${count}`,
      style: {
        fontSize: 14,
        textAlign: "center",
      },
    },

    color: ({ stage }: { stage: string }) => {
      switch (stage) {
        case "Not Started":
          return "#ff9800"
        case "On Track":
          return "#2196f3"
        case "Completed":
          return "#4caf50"
        case "Delayed":
          return "#f44336"
        default:
          return "#9e9e9e"
      }
    },
    interactions: [{ type: "element-active" }],
    statistic: {
      title: false,
      content: {
        style: {
          whiteSpace: "pre-wrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        },
        formatter: function (datum: any, data: any[]) {
          const total = data.reduce((prev, curr) => prev + curr.count, 0)
          return `Total\n${total}`
        },
      },
    },
    legend: {
      position: "bottom",
    },
  }

  return (
    <div className='page-container'>
      <Row gutter={[32, 32]}>
        <Col xs={24} sm={24} xl={8}>
          <DashboardTotalCountCard
            resource='projects'
            isLoading={loading}
            totalCount={dashboardStats.projectsCount}
          />
        </Col>
        <Col xs={24} sm={24} xl={8}>
          <DashboardTotalCountCard
            resource='users'
            isLoading={loading}
            totalCount={dashboardStats.usersCount}
          />
        </Col>
        <Col xs={24} sm={24} xl={8}>
          <DashboardTotalCountCard
            resource='tasks'
            isLoading={loading}
            totalCount={dashboardStats.tasksCount}
          />
        </Col>

        {/* Charts */}
        <Col xs={24}>
          <Row gutter={[32, 32]}>
            <Col xs={24} xl={16}>
              <Card title='Task Distribution by Stage'>
                <Column {...barConfig} height={400} />
              </Card>
            </Col>
            <Col xs={24} xl={8}>
              <Card title='Milestone Stages'>
                <Pie {...pieConfig} height={400} />
              </Card>
            </Col>
          </Row>
        </Col>
      </Row>
    </div>
  )
}
