/**
 * Kanban card component is used to render a single task card in the kanban board.
 * It displays the task title, due date, assigned user, and provides actions like
 * logging time, viewing the card, and deleting the card.
 */
import React, { useMemo, memo, useState } from "react"
import {
  Button,
  Card,
  ConfigProvider,
  Dropdown,
  MenuProps,
  message,
  Modal,
  Space,
  Tag,
  Tooltip,
} from "antd"
import {
  ClockCircleOutlined,
  DeleteOutlined,
  EyeOutlined,
  FieldTimeOutlined,
  MoreOutlined,
} from "@ant-design/icons"
import {
  useCan,
  useDelete,
  useGetIdentity,
  useNavigation,
} from "@refinedev/core"

import CustomAvatar from "@/components/custom-avatar"
import { getDateColor } from "@/utilities"
import { Text } from "@/components/text"
import { TextIcon } from "@/components/text-icon"
import { theme } from "antd"

import dayjs from "dayjs"
import { ITask, TimeLog } from "@/interfaces"
import { supabaseClient } from "@/utilities/supabaseClient"
import { TimeLogModal } from "../time-log-modal"
import { calculateAndUpdateTaskTotalMinutes } from "@/utilities/taskUtils"

interface User {
  uid: number
  user_name: string
}

interface ProjectCardProps {
  id: string
  title: string
  updatedAt: Date
  dueDate?: Date
  userId?: string
  users: any
  assignedUser: {
    uid: number
    user_name: string
  } | null
  isDragging?: boolean
  task: ITask
}

const ProjectCard: React.FC<ProjectCardProps> = ({
  id,
  title,
  dueDate,
  assignedUser,
  task,
}) => {
  //Add check for task
  if (!task) {
    return null
  }
  const { data: user } = useGetIdentity<{
    id: string
    uid: number
  }>()
  const [timeLogModalVisible, setTimeLogModalVisible] = useState(false)
  const { token } = theme.useToken()
  const { edit } = useNavigation()
  const { mutate } = useDelete()

  // Add permission checks

  const { data: deletePermission } = useCan({
    resource: "tasks",
    action: "delete",
    params: { id },
  })

  const { data: movePermission } = useCan({
    resource: "tasks",
    action: "edit",
  })

  // Allow time logging if user owns the task OR has edit permission
  const canLogTime = movePermission?.can || user?.uid === assignedUser?.uid

  const handleTimeLogSubmit = (timeLog: Partial<TimeLog>): void => {
    const submitTimeLog = async () => {
      try {
        const taskId =
          typeof task.id === "string" ? parseInt(task.id, 10) : task.id

        const { error: timeLogError } = await supabaseClient
          .from("time_logs")
          .insert({
            task_id: task.id,
            user_id: assignedUser?.uid || user!.uid, // Can use ! since we know user exists
            minutes: timeLog.minutes || 0,
            comments: timeLog.comments || "",
            log_date: new Date(),
          })

        if (timeLogError) throw timeLogError

        // Update task's totalMinutes right after logging time
        await calculateAndUpdateTaskTotalMinutes(taskId)

        message.success("Time logged successfully")
        setTimeLogModalVisible(false)
      } catch (error) {
        message.error("Failed to log time")
        console.error("Error:", error)
      }
    }
    submitTimeLog()
  }
  // Render time log action button only for own tasks
  const renderTimeLogAction = () => {
    if (!canLogTime) {
      return null
    }

    return (
      <Space
        onClick={(e) => {
          e.stopPropagation()
          setTimeLogModalVisible(true)
        }}
        style={{
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          padding: "0 8px", // Add some padding
        }}
      >
        <FieldTimeOutlined
          style={{
            color: "#68d0cb",
            fontSize: "18px", // Make icon bigger
          }}
        />
        <Text
          strong // Makes text bold
          style={{
            color: "#68d0cb",
            marginLeft: "4px", // Space between icon and text
          }}
        >
          Log Time
        </Text>
      </Space>
    )
  }

  const dropdownItems = useMemo(() => {
    const dropdownItems: MenuProps["items"] = [
      {
        label: "View card",
        key: "1",
        icon: <EyeOutlined />,
        onClick: () => {
          edit("tasks", id, "replace")
        },
      },

      {
        danger: true,
        label: (
          <Tooltip
            title={
              !deletePermission?.can
                ? "You don't have permission to delete tasks"
                : ""
            }
            placement='left'
          >
            <span>Delete Card</span>
          </Tooltip>
        ),
        key: "2",
        icon: <DeleteOutlined />,
        disabled: !deletePermission?.can,
        onClick: (e) => {
          // Prevent the dropdown from closing immediately
          e.domEvent.stopPropagation()

          const confirmDelete = () => {
            mutate({
              resource: "tasks",
              id,
              meta: {
                operation: "task",
              },
            })
          }

          Modal.confirm({
            title: "Delete Task",
            content: "Are you sure you want to delete this task?",
            okText: "Yes",
            okType: "danger",
            cancelText: "No",
            onOk: confirmDelete,
          })
        },
      },
    ]
    return dropdownItems
  }, [edit, id, mutate, deletePermission])

  const dueDateOptions = useMemo(() => {
    if (!dueDate) return null

    const date = dayjs(dueDate)

    return {
      color: getDateColor({ date: dueDate }) as string,
      text: date.format("MMM DD"),
    }
  }, [dueDate])

  const canMoveCards = movePermission?.can

  return (
    <>
      <ConfigProvider
        theme={{
          components: {
            Tag: {
              colorText: token.colorTextSecondary,
            },
            Card: {
              headerBg: "transparent",
            },
          },
        }}
      >
        <Card
          className='kanban-card'
          style={{
            cursor: canMoveCards ? "grab" : "default",
            position: "relative",
          }}
          size='small'
          title={<Text ellipsis={{ tooltip: title }}>{title}</Text>}
          onClick={() => edit("tasks", id, "replace")}
          actions={[renderTimeLogAction()].filter(Boolean)}
          extra={
            <Dropdown
              trigger={["click"]}
              menu={{
                items: dropdownItems,
              }}
              placement='bottom'
              arrow={{ pointAtCenter: true }}
            >
              <Button
                type='text'
                shape='circle'
                icon={
                  <MoreOutlined
                    style={{
                      transform: "rotate(90deg)",
                    }}
                  />
                }
                onPointerDown={(e) => {
                  e.stopPropagation()
                }}
                onClick={(e) => {
                  e.stopPropagation()
                }}
              />
            </Dropdown>
          }
        >
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <TextIcon style={{ marginRight: "4px" }} />
            {dueDateOptions && (
              <Tag
                icon={<ClockCircleOutlined style={{ fontSize: "12px" }} />}
                style={{
                  padding: "0 4px",
                  marginInlineEnd: "0",
                  backgroundColor:
                    dueDateOptions.color === "default"
                      ? "transparent"
                      : "unset",
                }}
                color={dueDateOptions.color}
                bordered={dueDateOptions.color !== "default"}
              >
                {dueDateOptions.text}
              </Tag>
            )}

            <Space
              size={4}
              wrap
              direction='horizontal'
              align='center'
              style={{
                display: "flex",
                justifyContent: "flex-end",
                marginLeft: "auto",
                marginRight: 0,
              }}
            >
              {assignedUser && (
                <Tooltip title={assignedUser.user_name}>
                  <CustomAvatar name={assignedUser.user_name} size='small' />
                </Tooltip>
              )}
            </Space>
          </div>
        </Card>
      </ConfigProvider>
      {canLogTime && user && (
        <TimeLogModal
          open={timeLogModalVisible}
          onClose={() => setTimeLogModalVisible(false)}
          task={task}
          onSubmit={handleTimeLogSubmit}
        />
      )}
    </>
  )
}

export default ProjectCard

export const ProjectCardMemo = memo(ProjectCard, (prev, next) => {
  return (
    prev.id === next.id &&
    prev.title === next.title &&
    prev.dueDate === next.dueDate &&
    prev.updatedAt === next.updatedAt &&
    prev.assignedUser?.uid === next.assignedUser?.uid
  )
})
