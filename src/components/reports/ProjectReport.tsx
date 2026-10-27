/** Project Report component
 * Displays a table of projects with their total tasks, pending tasks, due date, estimated due date and total hours
 * The table can be filtered by date range
 * The total hours are calculated by summing the totalMinutes from tasks
 * The estimated due date is the due date of the latest task
 * The pending tasks are tasks that are not in the "Done" or "Completed" stage
 * The pending tasks are displayed in an orange tag if there are any, otherwise in a green tag
 */
import { useState, useEffect } from "react"
import { Table, Tag, DatePicker, Typography } from "antd"
import { supabaseClient } from "@/utilities/supabaseClient"
import dayjs from "dayjs"

const { RangePicker } = DatePicker

interface ProjectReport {
  id: number
  project_name: string
  total_tasks: number
  pending_tasks: number
  due_date: Date
  estimated_due_date: string | null
  totalMinutes: number
}

interface ProjectReportProps {
  loading: boolean
  setLoading: (loading: boolean) => void
}

export const ProjectReport = ({ loading, setLoading }: ProjectReportProps) => {
  const [projectReports, setProjectReports] = useState<ProjectReport[]>([])
  const [dateRange, setDateRange] = useState<
    [dayjs.Dayjs | null, dayjs.Dayjs | null]
  >([null, null])

  const fetchProjectReports = async () => {
    setLoading(true)
    try {
      let query = supabaseClient.from("projects").select(`
          id,
          project_name,
          due_date,
          tasks (
            id,
            stageId,
            due_date,
            totalMinutes,
            taskStages (
              id,
              title
            )
          )
        `)

      if (dateRange[0] && dateRange[1]) {
        query = query
          .gte("due_date", dateRange[0].format("YYYY-MM-DD"))
          .lte("due_date", dateRange[1].format("YYYY-MM-DD"))
      }

      const { data: projectsData, error } = await query

      if (error) throw error

      const transformedData: ProjectReport[] = projectsData.map(
        (project: any) => {
          const tasks = project.tasks || []
          const pendingTasks = tasks.filter((task: any) => {
            const stageTitle = task.stages?.title?.toLowerCase()
            return stageTitle !== "done" && stageTitle !== "completed"
          })

          // Calculate total minutes by summing totalMinutes from tasks
          const totalMinutes = tasks.reduce((acc: number, task: any) => {
            return acc + (task.totalMinutes || 0)
          }, 0)
          //console.log("Total minutes for project:", totalMinutes)

          const taskDueDates = tasks
            .map((task: any) => task.due_date)
            .filter(Boolean)
            .sort((a: string, b: string) => dayjs(b).unix() - dayjs(a).unix())

          return {
            id: project.id,
            project_name: project.project_name,
            total_tasks: tasks.length,
            pending_tasks: pendingTasks.length,
            due_date: project.due_date,
            estimated_due_date: taskDueDates[0] || null,
            totalMinutes: totalMinutes,
          }
        }
      )

      setProjectReports(transformedData)
    } catch (error) {
      console.error("Error fetching project reports:", error)
    } finally {
      setLoading(false)
    }
  }

  const TimeDisplay: React.FC<{ minutes: number }> = ({ minutes }) => {
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60

    return (
      <Typography.Text>
        {hours}h {remainingMinutes}m
      </Typography.Text>
    )
  }

  const projectColumns = [
    {
      title: "Project Name",
      dataIndex: "project_name",
      key: "project_name",
      width: "25%",
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
      render: (pending_tasks: number) => (
        <Tag color={pending_tasks > 0 ? "orange" : "green"}>
          {pending_tasks}
        </Tag>
      ),
    },
    {
      title: "Due Date",
      dataIndex: "due_date",
      key: "due_date",
      width: "20%",
      render: (date: Date) =>
        date ? dayjs(date).format("DD-MM-YYYY") : "Not set",
    },
    {
      title: "Estimated Due Date",
      dataIndex: "estimated_due_date",
      key: "estimated_due_date",
      width: "25%",
      render: (date: string | null) =>
        date ? dayjs(date).format("DD-MM-YYYY") : "Not set",
    },

    {
      title: "Total Hours",
      dataIndex: "totalMinutes",
      render: (minutes: number) => <TimeDisplay minutes={minutes} />,
      sorter: (a: ProjectReport, b: ProjectReport) =>
        (a.totalMinutes || 0) - (b.totalMinutes || 0),
    },
  ]

  useEffect(() => {
    fetchProjectReports()
  }, [dateRange])

  return (
    <>
      <div style={{ marginBottom: 16 }} className='no-print'>
        <RangePicker
          onChange={(dates) =>
            setDateRange(dates as [dayjs.Dayjs | null, dayjs.Dayjs | null])
          }
          format='DD-MM-YYYY'
          style={{ width: 300 }}
          placeholder={["Start Date", "End Date"]}
        />
      </div>
      <Table
        columns={projectColumns}
        dataSource={projectReports}
        rowKey='id'
        loading={loading}
        pagination={false}
        style={{ overflowX: "auto" }}
      />
    </>
  )
}
