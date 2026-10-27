/** Kanban column component allows to render a column in the kanban board.*/
import { Text } from "@/components/text"
import { PlusOutlined } from "@ant-design/icons"
import { useDroppable, type UseDroppableArguments } from "@dnd-kit/core"
import { useCan } from "@refinedev/core"
import { Badge, Button, Space, Tooltip } from "antd"

type Props = {
  id: string
  title: string
  description?: React.ReactNode
  count: number
  data?: UseDroppableArguments["data"]
  onAddClick?: (args: { id: string }) => void
}

export const KanbanColumn = ({
  children,
  id,
  title,
  description,
  count,
  data,
  onAddClick,
}: React.PropsWithChildren<Props>) => {
  const { isOver, setNodeRef, active } = useDroppable({ id, data })

  const { data: createPermission } = useCan({
    resource: "tasks",
    action: "create",
  })

  const onAddClickHandler = () => {
    onAddClick?.({ id })
  }

  return (
    <div
      ref={setNodeRef}
      style={{
        display: "flex",
        flexDirection: "column",
        padding: "0 16px",
      }}>
      <div style={{ padding: "12px" }}>
        <Space style={{ width: "100%", justifyContent: "space-between" }}>
          <Space>
            <Text
              ellipsis={{ tooltip: title }}
              size='xs'
              strong
              style={{
                textTransform: "uppercase",
                whiteSpace: "nowrap",
              }}>
              {title}
            </Text>
            {!!count && <Badge count={count} color='cyan' />}
          </Space>
          <Tooltip
            title={
              !createPermission?.can
                ? "You don't have permission to create tasks"
                : ""
            }
          >
            <Button
              shape='circle'
              icon={<PlusOutlined />}
              onClick={onAddClickHandler}
              disabled={!createPermission?.can}
            />
          </Tooltip>
        </Space>
        {description}
      </div>
      <div
        style={{
          flex: 1,
          overflowY: active ? "unset" : "auto",
          border: "2px dashed transparent",
          borderColor: isOver ? "#00000040" : "transparent",
          borderRadius: "4px",
        }}
      >
        <div
          style={{
            marginTop: "12px",
            display: "flex",
            flexDirection: "column",
            gap: "8px",
          }}
        >
          {children}
        </div>
      </div>
    </div>
  )
}
