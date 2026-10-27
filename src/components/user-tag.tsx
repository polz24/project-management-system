/**
 * User tag component to display user name and avatar.
 */
import { Space, Tag } from "antd"

import { IUser } from "@/interfaces"
import CustomAvatar from "./custom-avatar"
import { Text } from "./text"

type Props = {
  user: IUser
}

export const UserTag = ({ user }: Props) => {
  return (
    <Tag
      key={user.uid}
      style={{
        padding: 2,
        paddingRight: 8,
        borderRadius: 24,
        lineHeight: "unset",
        marginRight: "unset",
      }}
    >
      <Space size={4}>
        <CustomAvatar
          name={user.user_name}
          style={{ display: "inline-flex" }}
          size='small'
        />
        <Text style={{ marginLeft: 4 }}>{user.user_name}</Text>
      </Space>
    </Tag>
  )
}
