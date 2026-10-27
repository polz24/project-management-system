/**
 * DueDateForm component allows users to set a due date for a task.
 */
import { useForm } from "@refinedev/antd"
import { HttpError } from "@refinedev/core"
import { Button, DatePicker, Form, Space } from "antd"
import dayjs from "dayjs"

interface DueDateFormProps {
  initialValues: {
    due_date?: Date
  }
  cancelForm: () => void
  onFinish: (values: { due_date?: Date }) => Promise<void>
}

export const DueDateForm: React.FC<DueDateFormProps> = ({
  initialValues,
  cancelForm,
  onFinish,
}) => {
  const { formProps, saveButtonProps } = useForm<
    { due_date?: String },
    HttpError,
    { due_date?: String }
  >({
    queryOptions: {
      enabled: false, // Disable initial data fetching
    },
    redirect: false, // Prevent redirect after submission
    onMutationSuccess: () => {
      cancelForm() // Close accordion on success
    },
  })
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <Form {...formProps} initialValues={initialValues}>
        <Form.Item
          noStyle
          name='due_date'
          getValueProps={(value) => {
            if (!value) return { value: undefined }
            return { value: dayjs(value).hour(12).minute(0).second(0) }
          }}
        >
          <DatePicker
            format='DD-MM-YYYY'
            style={{ backgroundColor: "#fff" }}
            showTime={false}
          />
        </Form.Item>
      </Form>
      <Space>
        <Button type='default' onClick={cancelForm}>
          Cancel
        </Button>
        <Button {...saveButtonProps} type='primary'>
          Save
        </Button>
      </Space>
    </div>
  )
}
