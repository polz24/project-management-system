/**
 * TasksEditPage Component
 * Handles editing of existing tasks with real-time updates and form validation
 */
import { useState } from "react"

import { DeleteButton, useModalForm } from "@refinedev/antd"
import { useCan, useInvalidate, useNavigation } from "@refinedev/core"

import {
  AlignLeftOutlined,
  FieldTimeOutlined,
  UsergroupAddOutlined,
} from "@ant-design/icons"
import { message, Modal, Space, Tag, Typography } from "antd"

import {
  Accordion,
  DescriptionForm,
  DescriptionHeader,
  DueDateForm,
  DueDateHeader,
  StageForm,
  TitleForm,
  UsersHeader,
} from "@/components"

import { ITask } from "@/interfaces"
import UsersForm from "@/components/tasks/form/users"
import { supabaseClient } from "@/utilities/supabaseClient"
import dayjs from "dayjs"

export const TasksEditPage = () => {
  const [activeKey, setActiveKey] = useState<string | undefined>()
  const { list } = useNavigation()
  const invalidate = useInvalidate()

  // Permission check for editing tasks
  const { data: editPermission } = useCan({
    resource: "tasks",
    action: "edit",
  })

  // Modal form configuration with live mode
  const { modalProps, close, queryResult } = useModalForm<ITask>({
    action: "edit",
    defaultVisible: true,
  })
  const {
    description,
    due_date,
    userId,
    title,
    id: taskId,
  } = (queryResult?.data?.data as ITask) ?? {
    description: "",
    due_date: "",
    userId: null,
    title: "",
    id: null,
  }
  const isLoading = queryResult?.isLoading ?? true

  // If user doesn't have permission, show read-only view
  if (!editPermission?.can) {
    return (
      <Modal
        visible={true}
        onCancel={() => list("tasks", "replace")}
        footer={null}
        title={<Typography.Title level={4}>{title}</Typography.Title>}
        width={586}
      >
        <Space direction='vertical' size='large' style={{ width: "100%" }}>
          {/* Description Section */}
          <div>
            <Space>
              <AlignLeftOutlined />
              <Typography.Text strong>Description</Typography.Text>
            </Space>
            <div style={{ marginTop: 8 }}>
              <DescriptionHeader description={description} />
            </div>
          </div>

          {/* Due Date Section */}
          <div>
            <Space>
              <FieldTimeOutlined />
              <Typography.Text strong>Due Date</Typography.Text>
            </Space>
            <div style={{ marginTop: 8 }}>
              <DueDateHeader dueDate={due_date} />
            </div>
          </div>

          {/* Users Section */}
          <div>
            <Space>
              <UsergroupAddOutlined />
              <Typography.Text strong>Assigned To</Typography.Text>
            </Space>
            <div style={{ marginTop: 8 }}>
              <UsersHeader userId={userId} />
            </div>
          </div>
        </Space>
      </Modal>
    )
  }

  const handleSubmit = async (values: Partial<ITask>) => {
    try {
      const { data, error } = await supabaseClient
        .from("tasks")
        .update(values)
        .eq("id", taskId)
        .select()
        .single()

      if (error) throw error

      // Immediately invalidate the cache
      await invalidate({
        resource: "tasks",
        invalidates: ["list", "many"],
      })

      // Trigger an immediate refetch
      await queryResult?.refetch()

      message.success("Task updated successfully")
      return data
    } catch (error) {
      console.error("Error updating task:", error)
      message.error("Error updating task")
      return null
    }
  }
  // If user doesn't have permission, show message or redirect
  if (!editPermission?.can) {
    return (
      <Modal
        visible={true}
        onCancel={() => list("tasks", "replace")}
        footer={null}
      >
        <div style={{ padding: "20px", textAlign: "center" }}>
          You don't have permission to edit this task.
        </div>
      </Modal>
    )
  }

  return (
    <Modal
      {...modalProps}
      className='kanban-update-modal'
      onCancel={() => {
        close()
        list("tasks", "replace")
      }}
      title={<TitleForm initialValues={{ title }} isLoading={isLoading} />}
      width={586}
      footer={
        <DeleteButton
          type='link'
          onSuccess={() => {
            list("tasks", "replace")
          }}
        >
          Delete card
        </DeleteButton>
      }
    >
      <StageForm isLoading={isLoading} />
      <Accordion
        accordionKey='description'
        activeKey={activeKey}
        setActive={setActiveKey}
        fallback={<DescriptionHeader description={description} />}
        isLoading={isLoading}
        icon={<AlignLeftOutlined />}
        label='Description'
      >
        <DescriptionForm
          initialValues={{ description }}
          cancelForm={() => setActiveKey(undefined)}
        />
      </Accordion>
      <Accordion
        accordionKey='due_date'
        activeKey={activeKey}
        setActive={setActiveKey}
        fallback={<DueDateHeader dueDate={due_date} />}
        isLoading={isLoading}
        icon={<FieldTimeOutlined />}
        label='Due date'
      >
        <DueDateForm
          initialValues={{ due_date: due_date ?? undefined }}
          cancelForm={() => setActiveKey(undefined)}
          onFinish={async (values) => {
            await handleSubmit({ due_date: values.due_date })
            setActiveKey(undefined)
          }}
        />
      </Accordion>
      <Accordion
        accordionKey='users'
        activeKey={activeKey}
        setActive={setActiveKey}
        fallback={<UsersHeader userId={userId} />}
        isLoading={isLoading}
        icon={<UsergroupAddOutlined />}
        label='Users'
      >
        <UsersForm
          initialValues={{
            userId: queryResult?.data?.data?.userId,

            taskId: queryResult?.data?.data?.id
              ? Number(queryResult.data.data.id)
              : undefined,
          }}
          cancelForm={() => setActiveKey(undefined)}
          onFinish={async (values) => {
            //   await handleSubmit(values)
            //   setActiveKey(undefined)
            // }}
            const result = await handleSubmit(values)
            if (result && queryResult && queryResult.data) {
              // Force an immediate UI update
              queryResult.data.data = {
                ...queryResult.data.data,
                ...values,
              }
              // Invalidate the cache
              await invalidate({
                resource: "tasks",
                invalidates: ["list", "many"],
              })

              // Trigger a refetch
              await queryResult?.refetch()

              // Close the accordion
              setActiveKey(undefined)
            }
          }}
        />
      </Accordion>
    </Modal>
  )
}
