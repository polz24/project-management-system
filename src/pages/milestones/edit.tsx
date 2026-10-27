/**
 * EditMilestone component to edit a milestone and associate sprints with it.
 */
import { Modal, Form, Input, message, Select } from "antd"
import { useEffect, useState } from "react"
import { IMilestone, ISprint } from "@/interfaces"
import { supabaseClient } from "@/utilities/supabaseClient"

interface EditMilestoneProps {
  visible: boolean
  onCancel: () => void
  onSuccess: () => void
  milestone: IMilestone | null
}

export const EditMilestone: React.FC<EditMilestoneProps> = ({
  visible,
  onCancel,
  onSuccess,
  milestone,
}) => {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [sprints, setSprints] = useState<ISprint[]>([])

  // Fetch sprints and set initial form values when modal opens
  useEffect(() => {
    if (visible && milestone) {
      fetchSprints()
      // Set initial values
      form.setFieldsValue({
        milestone_name: milestone.milestone_name,
      })
    }
  }, [visible, milestone, form])

  const fetchSprints = async () => {
    if (!milestone) return

    try {
      // Fetch all sprints for this project
      const { data, error } = await supabaseClient
        .from("sprints")
        .select("*")
        .eq("project_id", milestone.project_id)

      if (error) throw error

      setSprints(data || [])

      // Fetch sprints associated with this milestone
      const { data: associatedSprints, error: sprintsError } =
        await supabaseClient
          .from("sprints")
          .select("id")
          .eq("milestone_id", milestone.id)

      if (sprintsError) throw sprintsError

      // Set the sprint_ids in the form
      form.setFieldsValue({
        sprint_ids: associatedSprints.map((sprint) => sprint.id),
      })
    } catch (error) {
      message.error("Error fetching sprints")
      console.error("Error:", error)
    }
  }

  const handleSubmit = async (values: any) => {
    if (!milestone) return

    try {
      setLoading(true)

      // Update milestone
      const { error: milestoneError } = await supabaseClient
        .from("milestones")
        .update({
          milestone_name: values.milestone_name,
        })
        .eq("id", milestone.id)

      if (milestoneError) throw milestoneError

      // Clear existing sprint associations
      const { error: clearError } = await supabaseClient
        .from("sprints")
        .update({ milestone_id: null })
        .eq("milestone_id", milestone.id)

      if (clearError) throw clearError

      // Update selected sprints with new milestone_id
      if (values.sprint_ids?.length > 0) {
        const { error: updateError } = await supabaseClient
          .from("sprints")
          .update({ milestone_id: milestone.id })
          .in("id", values.sprint_ids)

        if (updateError) throw updateError
      }

      message.success("Milestone updated successfully")
      onSuccess()
    } catch (error: any) {
      message.error(
        "Error updating milestone: " + (error.message || "Unknown error")
      )
      console.error("Error:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      title='Edit Milestone'
      open={visible}
      onCancel={onCancel}
      onOk={() => form.submit()}
      confirmLoading={loading}
      width={600}
      destroyOnClose
    >
      <Form form={form} layout='vertical' onFinish={handleSubmit}>
        <Form.Item
          name='milestone_name'
          label='Milestone Name'
          rules={[{ required: true, message: "Please enter milestone name" }]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          name='sprint_ids'
          label='Associated Sprints'
          help='Select sprints to associate with this milestone'
        >
          <Select
            mode='multiple'
            placeholder='Select sprints'
            style={{ width: "100%" }}
            optionFilterProp='children'
          >
            {sprints.map((sprint) => (
              <Select.Option
                key={sprint.id}
                value={sprint.id}
                disabled={
                  sprint.milestone_id && sprint.milestone_id !== milestone?.id
                }
              >
                {sprint.sprint_name}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>
      </Form>
    </Modal>
  )
}
