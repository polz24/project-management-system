/** 
 * Sprints List Page displays a list of sprints in either card or list view.
 * It also allows filtering by project and milestone.
 * It provides the ability to create, edit, and delete sprints.
 */
import React, { useEffect, useState } from "react"
import { useCan } from "@refinedev/core"
import {
  Card,
  Col,
  Row,
  Typography,
  Spin,
  message,
  Radio,
  Space,
  Table,
  Button,
  Popconfirm,
  Select,
  Tooltip,
} from "antd"
import {
  AppstoreOutlined,
  UnorderedListOutlined,
  EditOutlined,
  DeleteOutlined,
} from "@ant-design/icons"
import { supabaseClient } from "@/utilities/supabaseClient"
import { ISprint, IProject, IMilestone } from "@/interfaces"
import dayjs from "dayjs"
import SprintsEditModal from "@/components/sprints/sprint-edit-modal"
import SprintsCreateModal from "@/components/sprints/sprint-create-modal"
import { ActionButtons } from "@/components/role-based-access/action-buttons"
import { CreateButtonWithTooltip } from "@/components/role-based-access/create-button-tooltip"

const { Title, Text } = Typography
const { Option } = Select

// Define separate interfaces for the relationships
interface SprintWithRelations extends Omit<ISprint, "project" | "milestone"> {
  project: IProject | null
  milestone: IMilestone | null
}

type ViewType = "card" | "list"

export const SprintsListPage: React.FC = () => {
  // Permission checks
  const { data: createPermission } = useCan({
    resource: "sprints",
    action: "create",
  })
  const { data: editPermission } = useCan({
    resource: "sprints",
    action: "edit",
  })
  const { data: deletePermission } = useCan({
    resource: "sprints",
    action: "delete",
  })
  // State declarations
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false)
  const [sprints, setSprints] = useState<SprintWithRelations[]>([])
  const [projects, setProjects] = useState<IProject[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [milestones, setMilestones] = useState<IMilestone[]>([])
  const [filteredMilestones, setFilteredMilestones] = useState<IMilestone[]>([])
  const [viewType, setViewType] = useState<ViewType>("card")
  const [selectedProject, setSelectedProject] = useState<number | null>(null)
  const [selectedMilestone, setSelectedMilestone] = useState<number | null>(
    null
  )
  const [editingSprintId, setEditingSprintId] = useState<number | null>(null)

  // Handlers

  const handleEdit = (sprintId: number) => {
    setEditingSprintId(sprintId)
  }

  const handleCreateSuccess = () => {
    setIsCreateModalVisible(false)
    fetchData()
  }

  const handleCreateCancel = () => {
    setIsCreateModalVisible(false)
  }

  const handleEditSuccess = () => {
    setEditingSprintId(null)
    fetchData()
  }

  const handleEditCancel = () => {
    setEditingSprintId(null)
  }

  // Fetch all data
  const fetchData = async () => {
    setLoading(true)
    try {
      // Fetch sprints with project and milestone data
      const { data: sprintsData, error: sprintsError } = await supabaseClient
        .from("sprints")
        .select(
          `
          *,
          project:projects (*),
          milestone:milestones (*)
        `
        )
        .order("start_date", { ascending: false })

      if (sprintsError) throw sprintsError

      // Fetch projects for filter
      const { data: projectsData, error: projectsError } = await supabaseClient
        .from("projects")
        .select("*")
        .order("project_name")

      if (projectsError) throw projectsError

      // Fetch milestones with project information
      const { data: milestonesData, error: milestonesError } =
        await supabaseClient
          .from("milestones")
          .select(
            `
          *,
          project:projects (*)
        `
          )
          .order("milestone_name")

      if (milestonesError) throw milestonesError

      setSprints(sprintsData || [])
      setProjects(projectsData || [])
      setMilestones(milestonesData || [])
    } catch (error) {
      console.error("Error fetching data:", error)
      message.error("Failed to load data")
    } finally {
      setLoading(false)
    }
  }

  // Update handleProjectChange
  const handleProjectChange = (projectId: number | null) => {
    console.log("Selected Project ID:", projectId) // Debug log
    setSelectedProject(projectId)
    setSelectedMilestone(null) // Reset milestone selection

    // Filter milestones based on selected project
    if (projectId) {
      const projectMilestones = milestones.filter(
        (milestone) => milestone.project_id === projectId
      )
      console.log("Filtered Milestones:", projectMilestones) // Debug log
      setFilteredMilestones(projectMilestones)
    } else {
      setFilteredMilestones([])
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  // Add useEffect to handle initial filtering
  useEffect(() => {
    if (selectedProject) {
      const projectMilestones = milestones.filter(
        (milestone) => milestone.project_id === selectedProject
      )
      setFilteredMilestones(projectMilestones)
    }
  }, [selectedProject, milestones])

  // Debug useEffect
  // useEffect(() => {
  //   console.log("Current milestones:", milestones)
  //   console.log("Selected project:", selectedProject)
  //   console.log("Filtered milestones:", filteredMilestones)
  // }, [milestones, selectedProject, filteredMilestones])

  // Filter sprints based on selected project and milestone
  const filteredSprints = sprints.filter((sprint) => {
    const projectMatch =
      !selectedProject || sprint.project_id === selectedProject
    const milestoneMatch =
      !selectedMilestone || sprint.milestone_id === selectedMilestone
    return projectMatch && milestoneMatch
  })

  // Handle Delete
  const handleDelete = async (sprintId: number) => {
    try {
      const { error } = await supabaseClient
        .from("sprints")
        .delete()
        .eq("id", sprintId)

      if (error) throw error

      setSprints(sprints.filter((sprint) => sprint.id !== sprintId))
      message.success("Sprint deleted successfully")
    } catch (error) {
      console.error("Error deleting sprint:", error)
      message.error("Failed to delete sprint")
    }
  }

  //Helper function to format dates
  const formatDate = (date: Date | null) => {
    if (!date) return "Not set"
    return dayjs(new Date(date)).format("DD-MM-YYYY")
  }

  // Table columns configuration
  const columns = [
    {
      title: "Sprint Name",
      dataIndex: "sprint_name",
      key: "name",
      render: (text: string) => <Text strong>{text}</Text>,
    },
    {
      title: "Project",
      dataIndex: "project",
      key: "project",
      render: (project: IProject | null) =>
        project?.project_name || "No Project",
    },
    {
      title: "Start Date",
      dataIndex: "start_date",
      key: "start_date",
      render: (date: Date) => formatDate(date),
    },
    {
      title: "Due Date",
      dataIndex: "due_date",
      key: "due_date",
      render: (date: Date) => formatDate(date),
    },
    {
      title: "Actions",
      key: "actions",
      render: (record: SprintWithRelations) => (
        <ActionButtons
          onEdit={() => setEditingSprintId(record.id)}
          onDelete={() => handleDelete(record.id)}
          canEdit={editPermission?.can}
          canDelete={deletePermission?.can}
        />
      ),
    },
  ]

  const renderFilters = () => (
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
        onChange={(value) => setSelectedMilestone(value)}
      >
        {filteredMilestones.map((milestone) => (
          <Option key={milestone.id} value={milestone.id}>
            {milestone.milestone_name}
          </Option>
        ))}
      </Select>
    </Space>
  )

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <Spin size='large' />
      </div>
    )
  }

  return (
    <>
      <div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: 24,
          }}
        >
          <Title level={3} style={{ margin: 0 }}>
            Sprints
          </Title>
          <Space>
            <CreateButtonWithTooltip
              onClick={() => setIsCreateModalVisible(true)}
              canCreate={createPermission?.can}
              resourceName='sprints'
            />

            <Radio.Group
              value={viewType}
              onChange={(e) => setViewType(e.target.value)}
              buttonStyle='solid'
            >
              <Radio.Button value='card'>
                <Space>
                  <AppstoreOutlined />
                  Card View
                </Space>
              </Radio.Button>
              <Radio.Button value='list'>
                <Space>
                  <UnorderedListOutlined />
                  List View
                </Space>
              </Radio.Button>
            </Radio.Group>
          </Space>
        </div>

        {renderFilters()}

        {viewType === "card" ? (
          <Row gutter={[16, 16]}>
            {filteredSprints.map((sprint) => (
              <Col xs={24} sm={24} md={12} lg={8} key={sprint.id}>
                <Card
                  title={sprint.sprint_name}
                  bordered={false}
                  style={{ height: "100%" }}
                  extra={
                    <Space>
                      <Tooltip
                        title={
                          !editPermission?.can
                            ? "You don't have permission to edit"
                            : ""
                        }
                      >
                        <Button
                          icon={<EditOutlined />}
                          onClick={() => setEditingSprintId(sprint.id)}
                          disabled={!editPermission?.can}
                        />
                      </Tooltip>

                      <Popconfirm
                        title='Are you sure you want to delete this sprint?'
                        onConfirm={() => handleDelete(sprint.id)}
                        okText='Yes'
                        cancelText='No'
                        disabled={!deletePermission?.can}
                      >
                        <Tooltip
                          title={
                            !deletePermission?.can
                              ? "You don't have permission to delete"
                              : ""
                          }
                        >
                          <Button
                            icon={<DeleteOutlined />}
                            danger
                            disabled={!deletePermission?.can}
                          />
                        </Tooltip>
                      </Popconfirm>
                    </Space>
                  }
                >
                  <Text strong>Project: </Text>
                  {sprint.project?.project_name || "No Project"}
                  <br />
                  <Text strong>Milestone: </Text>
                  {sprint.milestone?.milestone_name || "No Milestone"}
                  <br />
                  <Text strong>Start Date: </Text>
                  {formatDate(sprint.start_date)}
                  <br />
                  <Text strong>Due Date: </Text>
                  {formatDate(sprint?.due_date)}
                </Card>
              </Col>
            ))}
          </Row>
        ) : (
          <Table
            columns={columns}
            dataSource={filteredSprints}
            rowKey='id'
            pagination={{ pageSize: 10 }}
          />
        )}
      </div>

      {/* Create Modal */}
      {isCreateModalVisible && (
        <SprintsCreateModal
          visible={isCreateModalVisible}
          onCancel={handleCreateCancel}
          onSuccess={handleCreateSuccess}
        />
      )}
      {/* Edit Modal */}
      {editingSprintId && (
        <SprintsEditModal
          visible={!!editingSprintId}
          sprintId={editingSprintId}
          onCancel={handleEditCancel}
          onSuccess={handleEditSuccess}
        />
      )}
    </>
  )
}
