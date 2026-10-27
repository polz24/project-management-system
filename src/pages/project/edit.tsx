/**
 * ProjectEdit Component
 * Handles the editing of existing projects with live updates and validation
 */
import React, { useState } from "react"
import {
  Edit,
  ListButton,
  RefreshButton,
  useForm,
  useSelect,
} from "@refinedev/antd"

import { Alert, Button, DatePicker, Form, Input } from "antd"

import MDEditor from "@uiw/react-md-editor"
import { IProject } from "@/interfaces"
import dayjs from "dayjs"

export const ProjectEdit = () => {
  // State to track if the project data is outdated
  const [isDeprecated, setIsDeprecated] = useState(false)

  /**
   * useForm hook configuration for project editing
   * Handles form state, validation, and submission with live mode
   */

  const {
    formProps,
    saveButtonProps,
    query: queryResult,
  } = useForm<IProject>({
    // Enable manual live mode for real-time updates
    liveMode: "manual",
    // Handler for live updates from other users
    onLiveEvent: () => {
      setIsDeprecated(true)
    },
  })

  const postData = queryResult?.data?.data
  const { selectProps: categorySelectProps } = useSelect<IProject>({
    resource: "projects",
    defaultValue: postData?.id,
  })

  /**
   * Handles refreshing the project data
   * Updates the form with latest data and resets deprecated state
   */

  const handleRefresh = () => {
    queryResult?.refetch()
    setIsDeprecated(false)
  }

  return (
    <Edit
      saveButtonProps={saveButtonProps}
      headerProps={{
        extra: (
          <>
            <ListButton />
            <RefreshButton onClick={handleRefresh} />
          </>
        ),
      }}
    >
      {/* Warning alert for outdated data */}
      {isDeprecated && (
        <Alert
          message="This project is changed. Reload to see it's latest version."
          type='warning'
          style={{
            marginBottom: 20,
          }}
          action={
            <Button onClick={handleRefresh} size='small' ghost>
              Refresh
            </Button>
          }
        />
      )}
      {/* Project edit form */}
      <Form {...formProps} layout='vertical'>
        <Form.Item
          label='Project Name'
          name='project_name'
          rules={[
            {
              required: true,
            },
          ]}
        >
          <Input />
        </Form.Item>

        {/* Start Date Field */}
        <Form.Item
          name='start_date'
          label='Start Date'
          getValueProps={(value) => {
            if (!value) return { value: undefined }
            return { value: dayjs(value) }
          }}
        >
          <DatePicker format='DD-MM-YYYY' style={{ backgroundColor: "#fff" }} />
        </Form.Item>

        {/* Due Date Field */}
        <Form.Item
          name='due_date'
          label='Due Date'
          getValueProps={(value) => {
            if (!value) return { value: undefined }
            return { value: dayjs(value) }
          }}
        >
          <DatePicker format='DD-MM-YYYY' style={{ backgroundColor: "#fff" }} />
        </Form.Item>

        {/* Project Description Field */}
        <Form.Item
          label='Description'
          name='description'
          rules={[
            {
              required: true,
            },
          ]}
        >
          <MDEditor preview='edit' data-color-mode='light' height={250} />
        </Form.Item>
      </Form>
    </Edit>
  )
}
