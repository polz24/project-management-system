/**
 * Sprints Edit Modal Component allows user to edit a sprint
 * It fetches the sprint data from the database and populates the form
 * It also fetches the projects to populate the project select dropdown
 * It validates the form and updates the sprint data in the database
 */
import { Modal, Form, Input, DatePicker, Select, message } from "antd"
import { useState, useEffect } from "react"
import { supabaseClient } from "@/utilities/supabaseClient"
import dayjs from "dayjs"
import isSameOrAfter from "dayjs/plugin/isSameOrAfter"

dayjs.extend(isSameOrAfter)

interface SprintsEditModalProps {
  visible: boolean
  sprintId: number
  onCancel: () => void
  onSuccess: () => void
}

const SprintsEditModal: React.FC<SprintsEditModalProps> = ({
  visible,
  sprintId,
  onCancel,
  onSuccess,
}) => {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [projects, setProjects] = useState<
    { id: number; project_name: string }[]
  >([])

  useEffect(() => {
    if (visible && sprintId) {
      fetchProjects()
      fetchSprintData()
    }
  }, [visible, sprintId])

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
      console.error("Error:", error)
    }
  }

  const fetchSprintData = async () => {
    try {
      const { data, error } = await supabaseClient
        .from("sprints")
        .select("*")
        .eq("id", sprintId)
        .single()

      if (error) throw error

      // Set form values
      form.setFieldsValue({
        sprint_name: data.sprint_name,
        project_id: data.project_id,
        start_date: data.start_date ? dayjs(data.start_date) : null,
        due_date: data.due_date ? dayjs(data.due_date) : null,
      })
    } catch (error) {
      message.error("Error fetching sprint data")
      console.error("Error:", error)
    }
  }

  const handleSubmit = async (values: any) => {
    try {
      setLoading(true)

      const { error } = await supabaseClient
        .from("sprints")
        .update({
          sprint_name: values.sprint_name,
          project_id: values.project_id,
          start_date: dayjs(values.start_date).format("YYYY-MM-DD"),
          due_date: dayjs(values.due_date).format("YYYY-MM-DD"),
        })
        .eq("id", sprintId)

      if (error) throw error

      message.success("Sprint updated successfully")
      onSuccess()
    } catch (error: any) {
      message.error(
        "Error updating sprint: " + (error.message || "Unknown error")
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      title='Edit Sprint'
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
          <Select placeholder='Select a project'>
            {projects.map((project) => (
              <Select.Option key={project.id} value={project.id}>
                {project.project_name}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          name='sprint_name'
          label='Sprint Name'
          rules={[{ required: true, message: "Please enter sprint name" }]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          name='start_date'
          label='Start Date'
          rules={[{ required: true, message: "Please select start date" }]}
        >
          <DatePicker style={{ width: "100%" }} format='DD-MM-YYYY' />
        </Form.Item>

        <Form.Item
          name='due_date'
          label='Due Date'
          rules={[
            { required: true, message: "Please select end date" },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (
                  !value ||
                  !getFieldValue("start_date") ||
                  dayjs(value).isSameOrAfter(getFieldValue("start_date"))
                ) {
                  return Promise.resolve()
                }
                return Promise.reject(
                  new Error("Due date must be after start date")
                )
              },
            }),
          ]}
        >
          <DatePicker style={{ width: "100%" }} format='DD-MM-YYYY' />
        </Form.Item>
      </Form>
    </Modal>
  )
}

export default SprintsEditModal
