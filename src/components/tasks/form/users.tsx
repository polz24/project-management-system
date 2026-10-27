/**
 * UsersForm component is a form that allows the user to select a user from a list of users.
 * The form is used to assign a task to a user.
 */
import { useEffect, useState } from "react"
import { Form, Select, Button, Space, message } from "antd"
import { supabaseClient } from "@/utilities/supabaseClient"

interface IUser {
  uid?: number
  user_name: string
  email: string
  role_id: string
  roles?: {
    id: string
    role_name: string
  }
  id: string
}

interface Props {
  initialValues: {
    userId?: number
    taskId?: number
  }
  cancelForm: () => void
  onFinish?: (values: { userId: number }) => void
}

const UsersForm: React.FC<Props> = ({
  initialValues,
  cancelForm,
  onFinish,
}) => {
  const [users, setUsers] = useState<IUser[]>([])
  const [loading, setLoading] = useState(false)
  const [fetchLoading, setFetchLoading] = useState(true)

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setFetchLoading(true)

        const { data, error } = await supabaseClient
          .from("users")
          .select("uid, user_name, email, role_id, id, roles(id, role_name)")
          .order("user_name", { ascending: true })

        if (error) {
          throw error
        }

        if (data) {
          const typedUsers: IUser[] = data.map((user) => ({
            uid: user.uid,
            user_name: user.user_name,
            email: user.email,
            role_id: user.role_id,
            id: user.id,
          }))
          setUsers(typedUsers)
        }
      } catch (error) {
        console.error("Error fetching users:", error)
        message.error("Failed to fetch users")
      } finally {
        setFetchLoading(false)
      }
    }

    fetchUsers()
  }, [])
  const handleFormSubmit = async (values: { userId: number }) => {
    if (!values.userId) {
      message.error("Please select a user")
      return
    }

    setLoading(true)
    try {
      await onFinish?.(values)
    } catch (error) {
      console.error("Error updating user:", error)
      message.error("Failed to update user")
    } finally {
      setLoading(false)
    }
  }
  return (
    <Form
      initialValues={{
        userId: initialValues.userId,
      }}
      onFinish={handleFormSubmit}
    >
      <Form.Item
        name='userId'
        style={{ marginBottom: "8px" }}
        rules={[{ required: true, message: "Please select a user" }]}
      >
        <Select
          placeholder='Select a user'
          style={{ width: "100%" }}
          options={users.map((user) => ({
            label: user.user_name,
            value: user.uid,
          }))}
          loading={fetchLoading}
          disabled={loading || fetchLoading}
        />
      </Form.Item>
      <Space>
        <Button
          type='primary'
          htmlType='submit'
          loading={loading}
          disabled={fetchLoading}
        >
          Save
        </Button>
        <Button onClick={cancelForm} disabled={loading}>
          Cancel
        </Button>
      </Space>
    </Form>
  )
}

export default UsersForm
