/**
 * TaskReport component is used to display a table of tasks with time logs and filters
 * to filter tasks by project, milestone, sprint, and user.
 */
import { useState, useEffect } from "react"
import { Table, Select, Space, List, Typography, Tag } from "antd"
import type { ColumnType } from "antd/es/table"
import { supabaseClient } from "@/utilities/supabaseClient"
import dayjs from "dayjs"

const { Option } = Select

interface TaskReportData {
  key: number
  task_name: string
  stage: string
  user: string
  comments: Array<{
    comment: string
    user_name: string
    log_date: string
    minutes: number
  }>
  total_minutes: number
}

interface TaskReportProps {
  loading: boolean
  setLoading: (loading: boolean) => void
}

export const TaskReport = ({ loading, setLoading }: TaskReportProps) => {
  const [projects, setProjects] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [projectMilestones, setProjectMilestones] = useState<any[]>([])
  const [milestoneSprints, setMilestoneSprints] = useState<any[]>([])
  const [taskReports, setTaskReports] = useState<TaskReportData[]>([])

  const [selectedProject, setSelectedProject] = useState<number | null>(null)
  const [selectedUser, setSelectedUser] = useState<number | null>(null)
  const [selectedMilestone, setSelectedMilestone] = useState<number | null>(
    null
  )
  const [selectedSprint, setSelectedSprint] = useState<number | null>(null)

  const columns: ColumnType<TaskReportData>[] = [
    {
      title: "Task Name",
      dataIndex: "task_name",
      key: "task_name",
      width: "20%",
    },
    {
      title: "Stage",
      dataIndex: "stage",
      key: "stage",
      width: "15%",
      render: (stage: string) => {
        const stageColors: { [key: string]: string } = {
          "TO DO": "default",
          "IN PROGRESS": "processing",
          "IN REVIEW": "warning",
          DONE: "success",
          Unassigned: "error",
        }
        return <Tag color={stageColors[stage]}>{stage}</Tag>
      },
    },
    {
      title: "Assigned To",
      dataIndex: "user",
      key: "user",
      width: "15%",
    },
    {
      title: "Time Logs",
      dataIndex: "comments",
      key: "comments",
      width: "35%",
      render: (comments: TaskReportData["comments"]) => (
        <List
          size='small'
          dataSource={comments}
          renderItem={(item) => (
            <List.Item>
              <Space direction='vertical' size={0} style={{ width: "100%" }}>
                <Space>
                  <Typography.Text
                    type='secondary'
                    style={{ fontSize: "12px" }}
                  >
                    {dayjs(item.log_date).format("DD/MM/YYYY HH:mm")}
                  </Typography.Text>
                  <Typography.Text strong style={{ fontSize: "12px" }}>
                    {item.user_name}
                  </Typography.Text>
                  <Tag color='blue'>
                    {Math.floor(item.minutes / 60)}h {item.minutes % 60}m
                  </Tag>
                </Space>
                <Typography.Text style={{ fontSize: "13px" }}>
                  {item.comment}
                </Typography.Text>
              </Space>
            </List.Item>
          )}
        />
      ),
    },
    {
      title: "Total Hours",
      dataIndex: "total_minutes",
      key: "total_minutes",
      width: "15%",
      render: (minutes: number) => (
        <Typography.Text strong>
          {Math.floor(minutes / 60)}h {minutes % 60}m
        </Typography.Text>
      ),
      sorter: (a, b) => a.total_minutes - b.total_minutes,
    },
  ]

  const fetchData = async () => {
    setLoading(true)
    try {
      const { data: projectsData, error: projectsError } = await supabaseClient
        .from("projects")
        .select("*")
        .order("project_name")

      if (projectsError) throw projectsError

      const { data: usersData, error: usersError } = await supabaseClient
        .from("users")
        .select("uid, user_name")
        .order("user_name")

      if (usersError) throw usersError

      setProjects(projectsData || [])
      setUsers(usersData || [])
    } catch (error) {
      console.error("Error fetching filter data:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchProjectMilestones = async (projectId: number | null) => {
    if (!projectId) {
      setProjectMilestones([])
      setMilestoneSprints([])
      setSelectedMilestone(null)
      setSelectedSprint(null)
      return
    }

    try {
      const { data: milestonesData, error: milestonesError } =
        await supabaseClient
          .from("milestones")
          .select("id, milestone_name")
          .eq("project_id", projectId)
          .order("milestone_name")

      if (milestonesError) throw milestonesError

      setProjectMilestones(milestonesData || [])
    } catch (error) {
      console.error("Error fetching project milestones:", error)
    }
  }

  const fetchMilestoneSprints = async (milestoneId: number | null) => {
    if (!milestoneId) {
      setMilestoneSprints([])
      setSelectedSprint(null)
      return
    }

    try {
      const { data: sprintsData, error: sprintsError } = await supabaseClient
        .from("sprints")
        .select("id, sprint_name")
        .eq("milestone_id", milestoneId)
        .order("sprint_name")

      if (sprintsError) throw sprintsError

      setMilestoneSprints(sprintsData || [])
    } catch (error) {
      console.error("Error fetching milestone sprints:", error)
    }
  }

  const fetchTaskReports = async () => {
    setLoading(true)
    try {
      // First, get all sprints for the selected milestone
      let sprintIds: number[] = []
      if (selectedMilestone) {
        const { data: milestoneSprintsData, error: sprintsError } =
          await supabaseClient
            .from("sprints")
            .select("id")
            .eq("milestone_id", selectedMilestone)

        if (sprintsError) throw sprintsError
        sprintIds = milestoneSprintsData.map((sprint) => sprint.id)
      }

      // Now fetch tasks with filters
      let query = supabaseClient.from("tasks").select(`
        id,
        title,
        totalMinutes,
        project_id,
        sprint_id,
        projects:project_id (id, project_name),
        users:userId (uid, user_name),
        sprints:sprint_id (
          id, 
          sprint_name,
          milestone_id,
          milestones:milestone_id (
            id,
            milestone_name
          )
        ),
        taskStages:stageId (id, title),
        time_logs (
            id,
            minutes,
            comments,
            log_date,
            users:user_id (user_name)
          )      
      `)

      // Apply project filter
      if (selectedProject) {
        query = query.eq("project_id", selectedProject)
      }
      // Apply milestone filter by filtering tasks with sprint_ids from the selected milestone
      if (selectedMilestone && sprintIds.length > 0) {
        query = query.in("sprint_id", sprintIds)
      }
      // Apply sprint filter
      if (selectedSprint) {
        query = query.eq("sprint_id", selectedSprint)
      }
      // Apply user filter
      if (selectedUser) {
        query = query.eq("userId", selectedUser)
      }

      const { data, error } = await query

      if (error) throw error

      const transformedData: TaskReportData[] = data.map((task: any) => ({
        key: task.id,
        task_name: task.title,
        stage: task.taskStages?.title || "Unassigned",
        user: task.users?.user_name || "Unassigned",
        comments: task.time_logs
          .map((log: any) => ({
            comment: log.comments,
            user_name: log.users?.user_name,
            log_date: log.log_date,
            minutes: log.minutes,
          }))
          .sort(
            (a: any, b: any) =>
              dayjs(b.log_date).valueOf() - dayjs(a.log_date).valueOf()
          ),
        total_minutes: task.totalMinutes || 0,
      }))

      setTaskReports(transformedData)
    } catch (error) {
      console.error("Error fetching task reports:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleProjectChange = (value: number | null) => {
    setSelectedProject(value)
    fetchProjectMilestones(value)
  }

  const handleMilestoneChange = (value: number | null) => {
    setSelectedMilestone(value)
    fetchMilestoneSprints(value)
  }

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    console.log("Selected Project:", selectedProject)
    console.log("Selected Milestone:", selectedMilestone)
    console.log("Selected Sprint:", selectedSprint)
    fetchTaskReports()
  }, [selectedProject, selectedUser, selectedMilestone, selectedSprint])

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Select
          style={{ width: 200 }}
          placeholder='Filter by Project'
          allowClear
          value={selectedProject}
          onChange={handleProjectChange}
        >
          {projects.map((project) => (
            <Option key={project.id} value={project.id}>
              {project.project_name}
            </Option>
          ))}
        </Select>

        <Select
          style={{ width: 200 }}
          placeholder='Filter by Milestone'
          allowClear
          disabled={!selectedProject}
          value={selectedMilestone}
          onChange={handleMilestoneChange}
        >
          {projectMilestones.map((milestone) => (
            <Option key={milestone.id} value={milestone.id}>
              {milestone.milestone_name}
            </Option>
          ))}
        </Select>

        <Select
          style={{ width: 200 }}
          placeholder='Filter by Sprint'
          allowClear
          disabled={!selectedMilestone}
          value={selectedSprint}
          onChange={(value) => setSelectedSprint(value)}
        >
          {milestoneSprints.map((sprint) => (
            <Option key={sprint.id} value={sprint.id}>
              {sprint.sprint_name}
            </Option>
          ))}
        </Select>
        <Select
          style={{ width: 200 }}
          placeholder='Filter by User'
          allowClear
          value={selectedUser}
          onChange={(value) => setSelectedUser(value)}
        >
          {users.map((user) => (
            <Option key={user.uid} value={user.uid}>
              {user.user_name}
            </Option>
          ))}
        </Select>
      </Space>

      <Table
        columns={columns}
        dataSource={taskReports}
        loading={loading}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showTotal: (total, range) =>
            `${range[0]}-${range[1]} of ${total} tasks`,
        }}
        bordered
        style={{ marginTop: 16 }}
      />
    </div>
  )
}
