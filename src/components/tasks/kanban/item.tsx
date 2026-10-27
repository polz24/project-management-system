/** KanbanItem component is used to render a task in the kanban board.*/

import { ITask } from "@/interfaces"
import { DragOverlay, useDraggable } from "@dnd-kit/core"
import { useCan, useGetIdentity } from "@refinedev/core"
import { ReactNode } from "react"

interface KanbanItemProps {
  id: string
  data: ITask // Assuming ITask is your task interface
  children: ReactNode // Add this to properly type children
}

// Update the identity type to include uid
interface Identity {
  id: string
  uid: number // Add uid field
}

const KanbanItem = ({ children, id, data }: KanbanItemProps) => {
  const { data: identity } = useGetIdentity<{ uid: Number }>()

  // Instead, check for project manager role directly if needed
  const { data: movePermission } = useCan({
    resource: "tasks",
    action: "edit",
  })

  // Add console.log to debug the values
  console.log("Task User ID:", data.userId)
  console.log("Current User UID:", identity?.uid)
  console.log("Move Permission:", movePermission?.can)

  // Check if the current user owns the task
  const isOwnTask = identity?.uid === Number(data.userId)

  // Can only drag if user has edit permission AND either:
  // 1. They are a project manager (movePermission.can will be true) OR
  // 2. It's their own task
  const isDraggable = Boolean(movePermission?.can || isOwnTask)

  console.log({
    taskUserId: data.userId,
    currentUserUid: identity?.uid,
    isOwnTask,
    movePermission: movePermission?.can,
    isDraggable,
  })

  const { attributes, listeners, setNodeRef, active } = useDraggable({
    id,
    data,
    disabled: !isDraggable, // Disable dragging if not draggable
  })

  return (
    <div style={{ position: "relative" }}>
      <div
        ref={setNodeRef}
        {...(isDraggable ? { ...attributes, ...listeners } : {})}
        style={{
          opacity: active ? (active.id === id ? 1 : 0.5) : 1,
          borderRadius: "8px",
          position: "relative",
          cursor: isDraggable ? "grab" : "not-allowed",
          // Added a visual indicator for easy location of own tasks
          border: isOwnTask ? "2px solid #68d0cb" : undefined,
        }}
      >
        {children}
      </div>
      {active?.id === id && (
        <DragOverlay
          zIndex={1000}
          user={{
            id: String(data?.userId) || "0",
            uid: 0,
            user_name: "",
            role_id: 0,
            email: "",
          }}
        >
          <div
            style={{
              borderRadius: "8px",
              boxShadow:
                "0px 9px 28px 8px rgba(0, 0, 0, 0.05), 0px 3px 6px -4px rgba(0, 0, 0, 0.12), 0px 6px 16px 0px rgba(0, 0, 0, 0.08)",
              cursor: "isDraggable ? 'grabbing' : 'not-allowed'",
            }}
          >
            {children}
          </div>
        </DragOverlay>
      )}
    </div>
  )
}
export default KanbanItem
