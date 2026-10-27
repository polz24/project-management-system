/**
 * Current User Component is used to display the current user's avatar and name.
 * It also contains a popover that displays the user's name and account settings.
 */
import { Popover, Button } from "antd"
import CustomAvatar from "../custom-avatar"
import { useGetIdentity } from "@refinedev/core"
import { Text } from "../text"
import { SettingOutlined } from "@ant-design/icons"
import { useState } from "react"
import { AccountSettings } from "./account-settings"
import { IUser } from "@/interfaces"

const CurrentUser = () => {
  const [isOpen, setIsOpen] = useState(false)
  const { data: user } = useGetIdentity<IUser>()

  const content = (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Text strong style={{ padding: "12px 20px" }}>
        {user?.user_name}
      </Text>
      <div
        style={{
          borderTop: "1px solid #d9d9d9",
          padding: "4px",
          display: "flex",
          flexDirection: "column",
          gap: "4px",
        }}
      >
        <Button
          style={{ textAlign: "left" }}
          icon={<SettingOutlined />}
          type='text'
          block
          onClick={() => setIsOpen(true)}
        >
          Account Settings
        </Button>
      </div>
    </div>
  )
  return (
    <>
      <Popover
        placement='bottomRight'
        trigger='click'
        overlayInnerStyle={{ padding: 0 }}
        overlayStyle={{ zIndex: 999 }}
        content={content}
      >
        <CustomAvatar
          name={user?.user_name}
          size='default'
          style={{ cursor: "pointer" }}
        />
      </Popover>
      {user && (
        <AccountSettings opened={isOpen} setOpened={setIsOpen} user={user.id} />
      )}
    </>
  )
}
export default CurrentUser
