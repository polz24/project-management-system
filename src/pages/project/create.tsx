/**
 * ProjectCreate Component
 * Handles the creation of new projects with form validation and submission
 */

import { Create, useForm } from "@refinedev/antd"
import { Form, Input } from "antd"
import MDEditor from "@uiw/react-md-editor"
import { IProject } from "@/interfaces"

export const ProjectCreate = () => {
  /**
   * useForm hook for form management
   * Handles form state, validation, and submission
   */
  const { formProps, saveButtonProps } = useForm<IProject>()

  return (
    <Create saveButtonProps={saveButtonProps}>
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
        <Form.Item label='Description' name='description'>
          <MDEditor preview='edit' data-color-mode='light' />
        </Form.Item>
      </Form>
    </Create>
  )
}
