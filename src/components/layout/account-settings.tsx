/**
 * Account settings drawer component for the user to view and edit their profile.
 */
import { useForm } from "@refinedev/antd"
import { HttpError, useGetIdentity } from "@refinedev/core"
import { CloseOutlined } from "@ant-design/icons"
import { Button, Card, Drawer, Form, Input, message } from "antd"
import { Text } from "../text"
import { SaveButton } from "@refinedev/antd"
import CustomAvatar from "../custom-avatar"
import { IUser } from "@/interfaces"
//import { UserRole } from "@/constants/roles"

type Props = {
  opened: boolean
  setOpened: (opened: boolean) => void
  user: string
}

export const AccountSettings: React.FC<Props> = ({
  opened,
  setOpened,
  user,
}) => {
  const { data: currentUser } = useGetIdentity<IUser>()

  const { formProps, saveButtonProps } = useForm<IUser, HttpError>({
    resource: "users",
    action: "edit",
    id: user,
    meta: {
      select: "*, user_name, email, role_id, roles(id, role_name)",
    },
    onMutationSuccess: () => {
      message.success("Profile updated successfully")
      setOpened(false)
    },
    onMutationError: (error) => {
      message.error(error?.message || "Error updating profile")
    },
  })

  const closeModal = () => {
    setOpened(false)
  }

  return (
    <Drawer
      onClose={closeModal}
      open={opened}
      width={756}
      styles={{
        body: { background: "#f5f5f5", padding: 0 },
        header: { display: "none" },
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "16px",
          backgroundColor: "#fff",
          borderBottom: "1px solid #f0f0f0",
        }}
      >
        <Text strong style={{ fontSize: "16px" }}>
          Settings
        </Text>
        <Button
          type='text'
          icon={<CloseOutlined />}
          onClick={() => closeModal()}
        />
      </div>
      <div style={{ padding: "24px" }}>
        <Card bordered={false}>
          <Form
            {...formProps}
            layout='vertical'
            style={{
              maxWidth: "600px",
              margin: "0 auto",
            }}
          >
            <div style={{ textAlign: "center", marginBottom: "24px" }}>
              <CustomAvatar
                shape='square'
                name={formProps?.initialValues?.user_name || ""}
                style={{
                  width: 50,
                  height: 50,
                  marginBottom: "24px",
                }}
              />
            </div>
            <Form.Item label='Name' name='user_name'>
              <Input placeholder='Name' disabled />
            </Form.Item>
            <Form.Item label='Email' name='email'>
              <Input placeholder='Email' disabled />
            </Form.Item>
            <Form.Item label='Role' name={["roles", "role_name"]}>
              <Input disabled />
            </Form.Item>
          </Form>

          {/* <SaveButton
            {...saveButtonProps}
            style={{
              display: "block",
              marginLeft: "auto",
            }}
          /> */}
        </Card>
      </div>
    </Drawer>
  )
}
