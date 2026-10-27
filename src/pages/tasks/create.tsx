/**
 * TasksCreatePage Component
 * Handles creation of new tasks with project and sprint selection
 */

import { useSearchParams } from "react-router-dom"
import { useModalForm } from "@refinedev/antd"
import { useNavigation } from "@refinedev/core"
import { Form, Input, Modal, Select, message } from "antd"
import { ITask, IUser } from "@/interfaces"
import { useEffect, useState } from "react"
import { supabaseClient } from "@/utilities/supabaseClient"

interface IProject {
  id: number
  project_name: string
}

interface ISprint {
  id: number
  sprint_name: string
}

export const TasksCreatePage = () => {
  // Get search parameters from URL
  const [searchParams] = useSearchParams()
  const { list } = useNavigation()

  // State management for users, projects and sprints
  const [users, setUsers] = useState<IUser[]>([])
  const [projects, setProjects] = useState<IProject[]>([])
  const [sprints, setSprints] = useState<ISprint[]>([])

  // Modal form configuration
  const { formProps, modalProps, close } = useModalForm<ITask>({
    action: "create",
    defaultVisible: true,
  })

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [usersData, projectsData, sprintsData] = await Promise.all([
          supabaseClient.from("users").select("*"),
          supabaseClient
            .from("projects")
            .select("id, project_name")
            .order("project_name"),
          supabaseClient
            .from("sprints")
            .select("id, sprint_name")
            .order("sprint_name"),
        ])

        if (usersData.error) throw new Error("Error fetching users")
        if (projectsData.error) throw new Error("Error fetching projects")
        if (sprintsData.error) throw new Error("Error fetching sprints")

        setUsers(usersData.data || [])
        setProjects(projectsData.data || [])
        setSprints(sprintsData.data || [])
      } catch (error) {
        message.error("Error fetching data")
        console.error("Error:", error)
      }
    }

    fetchData()
  }, [])

  return (
    <Modal
      {...modalProps}
      onCancel={() => {
        close()
        list("tasks", "replace")
      }}
      title='Add new task'
      width={512}
    >
      <Form
        {...formProps}
        layout='vertical'
        onFinish={(values: any) => {
          const formattedValues = {
            ...values,
            stageId: searchParams.get("stageId")
              ? Number(searchParams.get("stageId"))
              : null,
            userId: values.userId ? Number(values.userId) : null,
            project_id: values.project_id ? Number(values.project_id) : null,
            sprint_id: values.sprint_id ? Number(values.sprint_id) : null,
          }

          formProps?.onFinish?.(formattedValues)
        }}
      >
        <Form.Item
          label='Project'
          name='project_id'
          rules={[{ required: true, message: "Please select a project" }]}
        >
          <Select
            placeholder='Select a project'
            optionFilterProp='children'
            showSearch
            filterOption={(
              input: string,
              option?: { label: string; value: number }
            ) =>
              (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
            }
            options={projects.map((project) => ({
              label: project.project_name,
              value: project.id,
            }))}
          />
        </Form.Item>

        <Form.Item label='Sprint' name='sprint_id'>
          <Select
            allowClear
            placeholder='Select sprint'
            optionFilterProp='children'
            showSearch
            filterOption={(
              input: string,
              option?: { label: string; value: number }
            ) =>
              (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
            }
            options={sprints.map((sprint) => ({
              label: sprint.sprint_name,
              value: sprint.id,
            }))}
          />
        </Form.Item>
        <Form.Item
          label='Title'
          name='title'
          rules={[{ required: true, message: "Please enter title" }]}
        >
          <Input />
        </Form.Item>
      </Form>
    </Modal>
  )
}
