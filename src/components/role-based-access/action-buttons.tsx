/**
 * ActionButtons component is a reusable component that renders two buttons: Edit and Delete.
 * It also contains a special case for task movement, where the permission check is done in the component.
 */
import { Button, Tooltip, Popconfirm } from "antd"
import { EditOutlined, DeleteOutlined } from "@ant-design/icons"

interface ActionButtonsProps {
  onEdit?: () => void
  onDelete?: () => void
  canEdit?: boolean
  canDelete?: boolean
  hideText?: boolean
}

export const ActionButtons: React.FC<ActionButtonsProps> = ({
  onEdit,
  onDelete,
  canEdit = true,
  canDelete = true,
  hideText = true,
}) => {
  return (
    <>
      <Tooltip title={!canEdit ? "You don't have permission to edit" : ""}>
        <Button
          icon={<EditOutlined />}
          onClick={onEdit}
          disabled={!canEdit}
          type='link'
          size='small'
        >
          {!hideText && "Edit"}
        </Button>
      </Tooltip>

      <Popconfirm
        title='Are you sure you want to delete this record?'
        onConfirm={onDelete}
        okText='Yes'
        cancelText='No'
        disabled={!canDelete}
      >
        <Tooltip
          title={!canDelete ? "You don't have permission to delete" : ""}
        >
          <Button
            icon={<DeleteOutlined />}
            danger
            disabled={!canDelete}
            type='link'
            size='small'
          >
            {!hideText && "Delete"}
          </Button>
        </Tooltip>
      </Popconfirm>
    </>
  )
}
