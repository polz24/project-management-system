/**
 * This page displays a list of team members for a selected project.
 * It allows adding new team members and removing existing ones.
 * It also displays the role of each team member.
 */
import { useState, useEffect } from "react"
import {
  Card,
  Space,
  Button,
  Select,
  Table,
  Tag,
  message,
  Popconfirm,
  Tooltip,
} from "antd"
import {
  TeamOutlined,
  UserAddOutlined,
  DeleteOutlined,
} from "@ant-design/icons"
import { useCan } from "@refinedev/core"
import { supabaseClient } from "@/utilities/supabaseClient"
import { AddMember } from "@/components"

import { Typography } from "antd"
const { Text } = Typography

interface Project {
  id: number
  project_name: string
}

interface TeamMember {
  id: number
  user_id: number
  user_name: string
  role_name: string
  email: string
}

// Interface for the raw Supabase response
interface SupabaseTeamMember {
  id: number
  user_id: number
  users: {
    user_name: string
    email: string
    role: {
      role_name: string
    }
  }
}

export const TeamsPage = () => {
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProject, setSelectedProject] = useState<number | null>(null)
  const [members, setMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(false)
  const [isModalVisible, setIsModalVisible] = useState(false)

  // Permission checks
  const { data: createPermission } = useCan({
    resource: "teams",
    action: "create",
  })

  const { data: deletePermission } = useCan({
    resource: "teams",
    action: "delete",
  })

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabaseClient
        .from("projects")
        .select("id, project_name")
        .order("project_name")

      if (error) throw error
      setProjects(data || [])

      if (data && data.length > 0 && !selectedProject) {
        setSelectedProject(data[0].id)
      }
    } catch (error) {
      console.error("Error fetching projects:", error)
      message.error("Failed to fetch projects")
    }
  }

  const fetchTeamMembers = async (projectId: number) => {
    setLoading(true)
    try {
      const { data, error } = await supabaseClient
        .from("teams")
        .select(
          `
          id,
          user_id,
          users!user_id (
            user_name,
            email,
            role:role_id (
              role_name
            )
          )
        `
        )
        .eq("project_id", projectId)

      if (error) throw error

      // Log the raw data to see its structure
      console.log("Raw Supabase response:", JSON.stringify(data, null, 2))

      if (data) {
        const supabaseData = data as unknown as SupabaseTeamMember[]
        // Transform based on actual structure
        const transformedData: TeamMember[] = supabaseData.map((member) => ({
          id: member.id,
          user_id: member.user_id,
          user_name: member.users.user_name,
          email: member.users.email,
          // Take the first role if exists, otherwise use 'N/A'
          role_name: member.users.role.role_name || "N/A",
        }))

        setMembers(transformedData)
      }
    } catch (error) {
      console.error("Error fetching team members:", error)
      message.error("Failed to fetch team members")
    } finally {
      setLoading(false)
    }
  }

  const handleProjectChange = (value: number) => {
    setSelectedProject(value)
  }

  const handleRemoveMember = async (teamId: number) => {
    if (!selectedProject || !deletePermission?.can) return

    try {
      const { error } = await supabaseClient
        .from("teams")
        .delete()
        .eq("id", teamId)

      if (error) throw error

      message.success("Team member removed successfully")
      fetchTeamMembers(selectedProject)
    } catch (error) {
      console.error("Error removing team member:", error)
      message.error("Failed to remove team member")
    }
  }

  useEffect(() => {
    fetchProjects()
  }, [])

  useEffect(() => {
    if (selectedProject) {
      fetchTeamMembers(selectedProject)
    }
  }, [selectedProject])

  const columns = [
    {
      title: "Name",
      dataIndex: "user_name",
      key: "user_name",
    },
    {
      title: "Role",
      dataIndex: "role_name",
      key: "role_name",
      render: (role: string) => {
        const colorMap: { [key: string]: string } = {
          "Project Manager": "green",
          Developer: "blue",
          Designer: "purple",
          "Business Analyst": "cyan",
          "Test Engineer": "orange",
          "DevOps Engineer": "magenta",
        }
        return <Tag color={colorMap[role] || "default"}>{role}</Tag>
      },
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
    },
    ...(deletePermission?.can
      ? [
          {
            title: "Actions",
            key: "actions",
            render: (record: TeamMember) => (
              <Popconfirm
                title='Are you sure you want to remove this member?'
                onConfirm={() => handleRemoveMember(record.id)}
                okText='Yes'
                cancelText='No'
              >
                <Button icon={<DeleteOutlined />} danger />
              </Popconfirm>
            ),
          },
        ]
      : []),
  ]

  return (
    <Card
      title={
        <Space>
          <TeamOutlined />
          <span>Team Members</span>
        </Space>
      }
      extra={
        <Space>
          <Text strong>Project:</Text>
          <Select
            style={{ width: 200 }}
            placeholder='Select Project'
            value={selectedProject}
            onChange={handleProjectChange}
            optionFilterProp='label'
            showSearch
            options={projects.map((project) => ({
              value: project.id,
              label: project.project_name,
            }))}
          />
          {createPermission?.can && (
            <Button
              type='primary'
              icon={<UserAddOutlined />}
              onClick={() => setIsModalVisible(true)}
            >
              Add Member
            </Button>
          )}
        </Space>
      }
    >
      <Table
        columns={columns}
        dataSource={members}
        rowKey='id'
        loading={loading}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showTotal: (total) => `Total ${total} members`,
        }}
      />

      {createPermission?.can && selectedProject && (
        <AddMember
          isModalVisible={isModalVisible}
          onClose={() => setIsModalVisible(false)}
          projectId={selectedProject}
          onSuccess={() => fetchTeamMembers(selectedProject)}
          existingMembers={members.map((m) => m.user_id)}
        />
      )}
    </Card>
  )
}
