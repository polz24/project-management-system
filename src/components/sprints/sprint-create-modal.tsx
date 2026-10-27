/**
 * Create Sprint Modal is used to create a new sprint.
 */
import { Form, Input, Select, DatePicker, message, Modal } from "antd"
import { useState, useEffect } from "react"
import { supabaseClient } from "@/utilities/supabaseClient"
import dayjs from "dayjs"

interface SprintsCreateModalProps {
  visible: boolean
  onCancel: () => void
  onSuccess: () => void
}

const SprintsCreateModal: React.FC<SprintsCreateModalProps> = ({
  visible,
  onCancel,
  onSuccess,
}) => {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [projects, setProjects] = useState<
    { id: number; project_name: string }[]
  >([])

  useEffect(() => {
    fetchProjects()
  }, [])

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

  const handleSubmit = async (values: any) => {
    try {
      setLoading(true)

      const { error } = await supabaseClient.from("sprints").insert({
        sprint_name: values.sprint_name,
        project_id: values.project_id,
        start_date: dayjs(values.start_date).format("YYYY-MM-DD"),
        due_date: dayjs(values.due_date).format("YYYY-MM-DD"),
      })

      if (error) throw error

      message.success("Sprint created successfully")
      form.resetFields()
      onSuccess()
    } catch (error: any) {
      message.error(
        "Error creating sprint: " + (error.message || "Unknown error")
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      title='Create Sprint'
      open={visible}
      onCancel={() => {
        form.resetFields()
        onCancel()
      }}
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
          <Select placeholder='Select a project' loading={loading}>
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
                  value.isAfter(getFieldValue("start_date"))
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

export default SprintsCreateModal
