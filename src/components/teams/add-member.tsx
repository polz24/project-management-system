/**
 * AddMember component is used to create a team for a Project by adding a team member to it.
 */
import { supabaseClient } from "@/utilities/supabaseClient"
import { Modal, Select, Form, message } from "antd"
import type { SelectProps } from "antd"
import { useEffect, useState } from "react"

export interface AddMemberProps {
  isModalVisible: boolean
  onClose: () => void
  projectId: number
  onSuccess: () => void
  existingMembers: number[]
}

interface User {
  uid: number
  user_name: string
  email: string
  role_id: number
  roles: {
    role_name: string
  }
}

// Define the exact structure that Supabase returns
interface SupabaseUser {
  uid: number
  user_name: string
  email: string
  role_id: number
  roles:
    | {
        role_name: string
      }[]
    | null
}

export const AddMember: React.FC<AddMemberProps> = ({
  isModalVisible,
  onClose,
  projectId,
  onSuccess,
  existingMembers,
}) => {
  const [form] = Form.useForm()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetchAvailableUsers = async () => {
      try {
        const { data, error } = await supabaseClient
          .from("users")
          .select(
            `
            uid,
            user_name,
            email,
            role_id,
            roles!role_id (
              role_name
            )
          `
          )
          .not("uid", "in", `(${existingMembers.join(",")})`)
          .order("user_name")

        if (error) throw error

        if (data) {
          // Type assertion to help TypeScript understand the data structure
          const typedData = data as SupabaseUser[]

          const transformedData: User[] = typedData.map((user) => ({
            uid: user.uid,
            user_name: user.user_name,
            email: user.email,
            role_id: user.role_id,
            roles: {
              role_name: user.roles?.[0]?.role_name || "N/A",
            },
          }))

          setUsers(transformedData)
        }
      } catch (error) {
        console.error("Error fetching users:", error)
        message.error("Failed to fetch users")
      }
    }

    if (isModalVisible) {
      fetchAvailableUsers()
      form.resetFields()
    }
  }, [isModalVisible, existingMembers, form])

  const handleSubmit = async () => {
    try {
      setLoading(true)
      const values = await form.validateFields()

      const selectedUser = users.find((user) => user.uid === values.userId)
      if (!selectedUser) throw new Error("User not found")

      const { error } = await supabaseClient.from("teams").insert({
        project_id: projectId,
        user_id: values.userId,
        role_id: selectedUser.role_id,
      })

      if (error) throw error

      message.success("Team member added successfully")
      onSuccess()
      onClose()
    } catch (error) {
      console.error("Error adding team member:", error)
      message.error("Failed to add team member")
    } finally {
      setLoading(false)
    }
  }

  // Define filter function for Select
  const filterOption: SelectProps["filterOption"] = (input, option) => {
    if (option?.label) {
      return (option.label as string)
        .toLowerCase()
        .includes(input.toLowerCase())
    }
    return false
  }

  return (
    <Modal
      title='Add Team Member'
      open={isModalVisible}
      onCancel={onClose}
      onOk={handleSubmit}
      confirmLoading={loading}
    >
      <Form form={form} layout='vertical'>
        <Form.Item
          name='userId'
          label='Select User'
          rules={[{ required: true, message: "Please select a user" }]}
        >
          <Select
            placeholder='Select a user'
            optionFilterProp='label'
            showSearch
            filterOption={filterOption}
            options={users.map((user) => ({
              value: user.uid,
              label: `${user.user_name} (${user.roles.role_name})`,
            }))}
          />
        </Form.Item>
      </Form>
    </Modal>
  )
}
