/**
 * TimeLogModal component is a modal that allows users to log time for a task.
 */
import { ITask, TimeLog } from "@/interfaces"
import {
  Button,
  Col,
  Form,
  Input,
  InputNumber,
  Modal,
  Row,
  Space,
  Typography,
} from "antd"

interface TimeLogFormData {
  hours: number
  minutes: number
  comments: string
}
interface TimeLogModalProps {
  open: boolean
  onClose: () => void
  task?: ITask
  onSubmit: (timeLog: Partial<TimeLog>) => void
}

export const TimeLogModal: React.FC<TimeLogModalProps> = ({
  open,
  onClose,
  task,
  onSubmit,
}) => {
  //Add null check
  if (!task) {
    return null
  }

  const [form] = Form.useForm<TimeLogFormData>()

  const handleSubmit = (values: TimeLogFormData) => {
    // Convert hours and minutes to total minutes
    const totalMinutes = values.hours * 60 + values.minutes

    // Call onSubmit with the correct Partial<TimeLog> structure
    onSubmit({
      minutes: totalMinutes,
      comments: values.comments,
      logDate: new Date(),
    })
    form.resetFields()
    onClose()
  }

  return (
    <Modal
      open={open}
      onCancel={onClose}
      title={`Log time - ${task.title}`}
      footer={null}
      //destroyOnClose
    >
      <Form<TimeLogFormData>
        form={form}
        layout='vertical'
        onFinish={handleSubmit}
        initialValues={{ hours: 0, minutes: 0 }}
      >
        <Row gutter={16} style={{ marginTop: 16 }}>
          <Col span={12}>
            <Form.Item
              name='hours'
              label='Hours'
              rules={[
                { required: true, message: "Please input hours!" },
                { type: "number", min: 0 },
              ]}
            >
              <InputNumber
                min={0}
                style={{ width: "100%" }}
                placeholder='Hours'
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name='minutes'
              label='Minutes'
              rules={[
                { required: true, message: "Please input minutes!" },
                { type: "number", min: 0, max: 59 },
                {
                  validator: (_, value) =>
                    value >= 0 && value < 60
                      ? Promise.resolve()
                      : Promise.reject("Minutes must be between 0 and 59"),
                },
              ]}
            >
              <InputNumber
                min={0}
                max={59}
                style={{ width: "100%" }}
                placeholder='Minutes'
              />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          name='comments'
          label='Comments'
          rules={[{ required: true, message: "Please add comments!" }]}
        >
          <Input.TextArea rows={4} placeholder='What did you work on?' />
        </Form.Item>

        <Form.Item style={{ marginBottom: 0, textAlign: "right" }}>
          <Space>
            <Button onClick={onClose}>Cancel</Button>
            <Button type='primary' htmlType='submit'>
              Submit
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  )
}
