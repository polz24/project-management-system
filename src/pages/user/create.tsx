/** Create User Page
 * A modal form component for creating new users in the system
 */
import { useGo } from "@refinedev/core"
import { Form, Input, Modal } from "antd"
import { useModalForm, useSelect } from "@refinedev/antd"
import { IUser } from "@/interfaces"

export const CreateUser = () => {
  const go = useGo()

  const goToListPage = () => {
    go({
      to: { resource: "users", action: "list" },
      options: { keepQuery: true },
      type: "replace",
    })
  }
  const { formProps, modalProps } = useModalForm({
    action: "create",
    defaultVisible: true,
    resource: "users",
    redirect: false,
    mutationMode: "pessimistic",
    onMutationSuccess: goToListPage,
  })

  const { selectProps } = useSelect<IUser>({
    resource: "users",
  })
  return (
    <Modal
      {...modalProps}
      mask={true}
      onCancel={goToListPage}
      title='Create User'
      width={512}
    >
      <Form {...formProps} layout='vertical'>
        <Form.Item
          label='User Name'
          name='user_name'
          rules={[{ required: true }]}
        >
          <Input placeholder='Please enter name' />
        </Form.Item>
        <Form.Item label='Job Title' name='role_name'>
          <Input placeholder='Please enter job title' />
        </Form.Item>
        <Form.Item label='Email' name='email' rules={[{ required: true }]}>
          <Input placeholder='Please enter email' />
        </Form.Item>
        <Form.Item
          label='Password'
          name='password'
          rules={[{ required: true }]}
        >
          <Input placeholder='Please enter password' />
        </Form.Item>
      </Form>
    </Modal>
  )
}
