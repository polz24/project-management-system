/**
 * This file contains the EditUser component which is used to edit a user.
 */
import { Edit, useForm, useSelect } from "@refinedev/antd"
import { Form, Input, Select } from "antd"
import { useParams } from "react-router-dom"

export const EditUser = () => {
  const { id } = useParams() // Get the id from URL params

  const { formProps, saveButtonProps, queryResult } = useForm({
    id, // Explicitly pass the id here
    meta: {
      select: `*, roles (id, role_name)`,
    },
  })

  const { selectProps: roleSelectProps } = useSelect({
    resource: "roles",
    optionLabel: "role_name",
    optionValue: "id",
  })

  // Get the initial values from the query result
  const initialValues = {
    ...formProps.initialValues,
    role_id:
      formProps.initialValues?.role_id || queryResult?.data?.data?.role_id,
  }

  return (
    <Edit saveButtonProps={saveButtonProps}>
      <Form {...formProps} layout='vertical' initialValues={initialValues}>
        <Form.Item name='user_name' label='Name' rules={[{ required: true }]}>
          <Input />
        </Form.Item>

        <Form.Item
          name='email'
          label='Email'
          rules={[{ required: true, type: "email" }]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          name='role_id'
          label='Job Title'
          rules={[
            {
              required: true,
              message: "Please select a job title",
            },
          ]}
        >
          <Select
            {...roleSelectProps}
            placeholder='Select job title'
            allowClear
          />
        </Form.Item>
      </Form>
    </Edit>
  )
}
