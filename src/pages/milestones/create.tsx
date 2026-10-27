/**
 * Milestone creation form that allows the user to select a project and sprints to associate with the milestone.
 * The form is displayed in a modal and is used to create a new milestone in the database.
 */
import { Modal, Form, Input, Select, message } from "antd"
import { supabaseClient } from "@/utilities/supabaseClient"
import { useState, useEffect } from "react"

interface CreateMilestoneProps {
  visible: boolean
  onCancel: () => void
  onSuccess: () => void
}

interface FormValues {
  milestone_name: string
  project_id: number
  sprint_ids: number[]
}

interface Project {
  id: number
  project_name: string
}

interface Sprint {
  id: number
  sprint_name: string
  project_id: number
}
const CreateMilestone = ({
  visible,
  onCancel,
  onSuccess,
}: CreateMilestoneProps) => {
  const [form] = Form.useForm<FormValues>()
  const [projects, setProjects] = useState<Project[]>([])
  const [sprints, setSprints] = useState<Sprint[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(
    null
  )
  useEffect(() => {
    fetchProjects()
  }, [])

  useEffect(() => {
    if (selectedProjectId) {
      fetchSprintsByProject(selectedProjectId)
    } else {
      setSprints([])
      form.setFieldValue("sprint_ids", [])
    }
  }, [selectedProjectId])

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabaseClient
        .from("projects")
        .select("id, project_name")
        .order("project_name")

      if (error) throw error
      setProjects(data || [])
    } catch (error) {
      message.error("Error fetching projects")
      console.error(error)
    }
  }
  const fetchSprintsByProject = async (projectId: number) => {
    try {
      const { data, error } = await supabaseClient
        .from("sprints")
        .select("id, sprint_name, project_id")
        .eq("project_id", projectId)
        .order("sprint_name")

      if (error) throw error
      setSprints(data || [])
    } catch (error) {
      message.error("Error fetching sprints")
      console.error(error)
    }
  }
  const handleProjectChange = (value: number) => {
    setSelectedProjectId(value)
    form.setFieldValue("sprint_ids", [])
  }
  const handleSubmit = async (values: FormValues) => {
    try {
      setLoading(true)

      // Create the milestone with current date and without specifying the ID
      const { data: milestoneData, error: milestoneError } =
        await supabaseClient
          .from("milestones")
          .insert([
            {
              milestone_name: values.milestone_name,
              project_id: values.project_id,
              created_at: new Date().toISOString().split("T")[0], // Set today's date in YYYY-MM-DD format
              stage: "On Track", // Set default stage
            },
          ])
          .select()
          .single()

      if (milestoneError) throw milestoneError

      // Update sprints with the new milestone_id
      if (milestoneData && values.sprint_ids.length > 0) {
        const { error: sprintsError } = await supabaseClient
          .from("sprints")
          .update({ milestone_id: milestoneData.id })
          .in("id", values.sprint_ids)

        if (sprintsError) throw sprintsError
      }
      message.success("Milestone created successfully")
      form.resetFields()
      onSuccess()
    } catch (error) {
      message.error("Error creating milestone")
      console.error("Error:", error)
    } finally {
      setLoading(false)
    }
  }
  return (
    <Modal
      title='Create Milestone'
      open={visible}
      onCancel={onCancel}
      onOk={() => form.submit()}
      confirmLoading={loading}
      destroyOnClose
    >
      <Form
        form={form}
        layout='vertical'
        onFinish={handleSubmit}
        preserve={false}
      >
        <Form.Item
          name='project_id'
          label='Project'
          rules={[{ required: true, message: "Please select a project" }]}
        >
          <Select
            placeholder='Select a project'
            onChange={handleProjectChange}
            loading={loading}
          >
            {projects.map((project) => (
              <Select.Option key={project.id} value={project.id}>
                {project.project_name}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          name='sprint_ids'
          label='Sprints'
          rules={[
            { required: true, message: "Please select at least one sprint" },
          ]}
        >
          <Select
            mode='multiple'
            placeholder='Select sprints'
            disabled={!selectedProjectId}
            loading={loading}
            optionFilterProp='children'
            showSearch
          >
            {sprints.map((sprint) => (
              <Select.Option key={sprint.id} value={sprint.id}>
                {sprint.sprint_name}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          name='milestone_name'
          label='Milestone Name'
          rules={[{ required: true, message: "Please enter milestone name" }]}
        >
          <Input />
        </Form.Item>
      </Form>
    </Modal>
  )
}
export default CreateMilestone
