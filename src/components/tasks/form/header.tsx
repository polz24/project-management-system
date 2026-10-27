/**
 * DescriptionHeader, DueDateHeader, and UsersHeader are components that display a task's description, due date, and users respectively.
 */
import { MarkdownField } from "@refinedev/antd"
import { Typography, Space, Tag, Tooltip } from "antd"
import dayjs from "dayjs"
import { getDateColor } from "@/utilities"
import { Text } from "@/components/text"
import { ITask, IUser } from "@/interfaces"
import { UserTag } from "../../user-tag"
import { useEffect, useState } from "react"
import { supabaseClient } from "@/utilities/supabaseClient"

type DescriptionProps = {
  description?: ITask["description"]
}

type DueDateProps = {
  dueDate?: ITask["due_date"]
}

type UserProps = {
  userId?: ITask["userId"]
}

// display a task's description if it exists, otherwise display a link to add one
export const DescriptionHeader = ({ description }: DescriptionProps) => {
  if (description) {
    return (
      <Typography.Paragraph ellipsis={{ rows: 8 }}>
        <MarkdownField value={description} />
      </Typography.Paragraph>
    )
  }

  // if the task doesn't have a description, display a link to add one
  return <Typography.Link>Add task description</Typography.Link>
}

// display a task's due date if it exists, otherwise display a link to add one
export const DueDateHeader = ({ dueDate }: DueDateProps) => {
  if (dueDate) {
    // get the color of the due date
    const color = getDateColor({
      date: dueDate,
      defaultColor: "processing",
    })

    // depending on the due date, display a different color and text
    const getTagText = () => {
      switch (color) {
        case "error":
          return "Overdue"

        case "warning":
          return "Due soon"

        default:
          return "Processing"
      }
    }

    return (
      <Space size={[0, 8]}>
        <Tag color={color}>{getTagText()}</Tag>
        <Text>{dayjs(dueDate).format("MMMM D, YYYY - h:ma")}</Text>
      </Space>
    )
  }

  // if the task doesn't have a due date, display a link to add one
  return <Typography.Link>Add due date</Typography.Link>
}
// display a task's users if it exists, otherwise display a link to add one

export const UsersHeader = ({ userId }: UserProps) => {
  const [user, setUser] = useState<IUser | null>(null)

  useEffect(() => {
    const fetchUser = async () => {
      if (userId) {
        const { data, error } = await supabaseClient
          .from("users")
          .select("*")
          .eq("uid", userId)
          .single()

        if (!error && data) {
          setUser(data)
        }
      }
    }
    fetchUser()
  }, [userId])

  if (!userId || !user) {
    return <Typography.Link>Assign to users</Typography.Link>
  }
  return (
    <Space size={[0, 8]} wrap>
      <UserTag
        //key={user.uid}
        user={user}
      />
    </Space>
  )
}
