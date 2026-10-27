/**
 * Milestone List Page displays a list of milestones and allows the user to filter by project.
 * The user can also create, edit, delete milestones and update the stage of a milestone.
 */
import { useState, useEffect } from "react"
import { Table, Select, Typography, Tag, Space, message,
  Button, Popconfirm } from "antd"
import { IMilestone, IProject, ISprint } from "@/interfaces"
import { supabaseClient } from "@/utilities/supabaseClient"
import dayjs from "dayjs"
import SprintCard from "@/components/milestones/sprintCard"
import { DeleteOutlined, EditOutlined, PlusOutlined } from "@ant-design/icons"
import CreateMilestone from "./create"
import { EditMilestone } from "./edit"

const { Option } = Select
const { Title } = Typography

//Helper function to format dates
const formatDate = (date: Date | null) => {
  if (!date) return "Not set"
  return dayjs(new Date(date)).format("DD-MM-YYYY")
}

const MilestoneList = () => {
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false)
  const [isEditModalVisible, setIsEditModalVisible] = useState(false)
  const [selectedMilestone, setSelectedMilestone] = useState<IMilestone | null>(null)
  const [loading, setLoading] = useState(false)
  const [milestones, setMilestones] = useState<IMilestone[]>([])
  const [projects, setProjects] = useState<IProject[]>([])
  const [sprints, setSprints] = useState<ISprint[]>([])
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(
    null
  )

  useEffect(() => {
    fetchProjects()
    fetchData()
  }, [])

  // Fetch data when project filter changes
  useEffect(() => {
    fetchData()
  }, [selectedProjectId])

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabaseClient
        .from("projects")
        .select("*")
        .order("project_name")

      if (error) throw error
      setProjects(data || [])
    } catch (error) {
      message.error("Error fetching projects")
      console.error("Error:", error)
    }
  }

  const fetchData = async () => {
    try {
      setLoading(true)

      // Build the milestones query
      let milestonesQuery = supabaseClient
        .from("milestones")
        .select("*")
        .order("created_at", { ascending: false })

      // Apply project filter if selected
      if (selectedProjectId) {
        milestonesQuery = milestonesQuery.eq("project_id", selectedProjectId)
      }

      // Fetch filtered milestones
      const { data: milestonesData, error: milestonesError } =
        await milestonesQuery

      if (milestonesError) throw milestonesError

      // Fetch sprints
      const { data: sprintsData, error: sprintsError } = await supabaseClient
        .from("sprints")
        .select("*")

      if (sprintsError) throw sprintsError

      setMilestones(milestonesData)
      setSprints(sprintsData)
    } catch (error) {
      message.error("Error fetching data")
      console.error("Error:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleStageChange = async (
    milestoneId: number,
    newStage: IMilestone["stage"]
  ) => {
    try {
      const { error } = await supabaseClient
        .from("milestones")
        .update({ stage: newStage })
        .eq("id", milestoneId)

      if (error) throw error

      message.success("Milestone stage updated successfully")

      setMilestones((prev) =>
        prev.map((milestone) =>
          milestone.id === milestoneId
            ? { ...milestone, stage: newStage }
            : milestone
        )
      )
    } catch (error) {
      message.error("Error updating milestone stage")
      console.error("Error:", error)
    }
  }

  const getStageTag = (stage: IMilestone["stage"]) => {
    const stageColors = {
      "On Track": "green",
      Delayed: "red",
      Completed: "blue",
    }

    return <Tag color={stageColors[stage]}>{stage}</Tag>
  }

  const handleDelete = async (milestoneId: number) => {
    try {
      const { error } = await supabaseClient
        .from("milestones")
        .delete()
        .eq("id", milestoneId)

      if (error) throw error

      message.success("Milestone deleted successfully")
      fetchData() // Refresh the data after deletion
    } catch (error) {
      message.error("Error deleting milestone")
      console.error("Error:", error)
    }
  }

  const columns = [
    {
      title: "Milestone",
      dataIndex: "milestone_name",
      key: "milestone_name",
      render: (text: string) => (
        <Typography.Text strong>{text}</Typography.Text>
      ),
    },
    {
      title: "Sprints",
      dataIndex: "id",
      key: "sprints",
      render: (milestoneId: number) => (
        <SprintCard milestoneId={milestoneId} sprints={sprints} />
      ),
    },
    {
      title: "Stage",
      dataIndex: "stage",
      key: "stage",
      render: (stage: IMilestone["stage"], record: IMilestone) => (
        <Space>
          {getStageTag(stage)}
          <Select
            defaultValue={stage}
            style={{ width: 120 }}
            onChange={(value) =>
              handleStageChange(record.id, value as IMilestone["stage"])
            }
          >
            <Option value='Not Started'>Not Started</Option>
            <Option value='On Track'>On Track</Option>
            <Option value='Delayed'>Delayed</Option>
            <Option value='Completed'>Completed</Option>
          </Select>
        </Space>
      ),
    },
    {
      title: "Created At",
      dataIndex: "created_at",
      key: "created_at",
      render: (date: Date) => formatDate(date),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_: unknown, record: IMilestone) => (
        <Space>
          <Button
            icon={<EditOutlined />}
            onClick={() => {
              setSelectedMilestone(record)
              setIsEditModalVisible(true)
            }}
          />
          <Popconfirm
            title='Are you sure you want to delete this milestone?'
            onConfirm={() => handleDelete(record.id)}
            okText='Yes'
            cancelText='No'
          >
            <Button icon={<DeleteOutlined />} danger />
          </Popconfirm>
        </Space>
      ),
    },
  ]
  return (
    <>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
          flexWrap: "wrap",
          gap: "16px",
        }}
      >
        <Title level={3}>Milestones</Title>
        <Space>
          <Select
            style={{ width: 200 }}
            placeholder='Filter by Project'
            allowClear
            onChange={(value) => setSelectedProjectId(value)}
            loading={loading}
          >
            {projects.map((project) => (
              <Option key={project.id} value={project.id}>
                {project.project_name}
              </Option>
            ))}
          </Select>
          <Button
            type='primary'
            icon={<PlusOutlined />}
            onClick={() => setIsCreateModalVisible(true)}
          >
            Add Milestone
          </Button>
        </Space>
      </div>
      <Table
        columns={columns}
        dataSource={milestones}
        rowKey='id'
        loading={loading}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showTotal: (total) => `Total ${total} items`,
        }}
      />
      <CreateMilestone
        visible={isCreateModalVisible}
        onCancel={() => setIsCreateModalVisible(false)}
        onSuccess={() => {
          setIsCreateModalVisible(false)
          fetchData()
        }}
      />
      <EditMilestone
        visible={isEditModalVisible}
        onCancel={() => {
          setIsEditModalVisible(false)
          setSelectedMilestone(null)
        }}
        onSuccess={() => {
          setIsEditModalVisible(false)
          setSelectedMilestone(null)
          fetchData()
        }}
        milestone={selectedMilestone}
      />
    </>
  )
}
export default MilestoneList
