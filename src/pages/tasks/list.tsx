/**
 * TasksListPage Component
 * Implements a Kanban board view for tasks with drag-and-drop functionality
 */
import {
  type HttpError,
  useList,
  useNavigation,
  useUpdate,
  CrudFilters,
  LogicalFilter,
  useCan,
  useGetIdentity,
} from "@refinedev/core"
import type { GetFieldsFromList } from "@refinedev/nestjs-query"
import type { DragEndEvent } from "@dnd-kit/core"
import { KanbanAddCardButton } from "@/components/tasks/kanban/add-card-button"
import {
  KanbanBoardContainer,
  KanbanBoard,
} from "@/components/tasks/kanban/board"
import ProjectCardSkeleton from "@/components/tasks/kanban/project-card"
import { KanbanColumn } from "@/components/tasks/kanban/column"
import KanbanColumnSkeleton from "@/components/tasks/kanban/kanban"
import KanbanItem from "@/components/tasks/kanban/item"
import { ITask, ITaskStage } from "@/interfaces"
import { ProjectCardMemo } from "@/components/tasks/kanban/card"
import React, { useState, useEffect } from "react"
import { notification, Select, Space } from "antd"
import { supabaseClient } from "@/utilities/supabaseClient"

const { Option } = Select

type Task = GetFieldsFromList<ITask>
type TaskStage = GetFieldsFromList<ITaskStage> & {
  title: string
  id: string
  tasks: ITask[]
}

export const TasksListPage = ({ children }: React.PropsWithChildren) => {
  // Permission check for task movement
  const { data: movePermission } = useCan({
    resource: "tasks",
    action: "edit",
  })

  // Get current user identity from auth context
  const { data: identity } = useGetIdentity<{ id: string; uid: number }>()

  // Navigation hook
  const { replace } = useNavigation()

  // State management for filters
  const [selectedProject, setSelectedProject] = useState<number | null>(null)
  const [selectedUser, setSelectedUser] = useState<string | null>(null)
  const [selectedSprint, setSelectedSprint] = useState<number | null>(null)
  const [selectedMilestone, setSelectedMilestone] = useState<number | null>(
    null
  )
  const [sprintIds, setSprintIds] = useState<number[]>([])

  // Create filters based on selected values
  const generateFilters = (): CrudFilters => {
    const filters: LogicalFilter[] = []

    if (selectedProject) {
      filters.push({
        field: "project_id",
        operator: "eq",
        value: selectedProject,
      })
    }

    if (selectedUser) {
      filters.push({
        field: "userId",
        operator: "eq",
        value: selectedUser,
      })
    }

    // If sprint is selected, it takes precedence over milestone filter
    if (selectedSprint) {
      filters.push({
        field: "sprint_id",
        operator: "eq",
        value: selectedSprint,
      })
    }
    // Only apply milestone filter if no sprint is selected
    else if (selectedMilestone && sprintIds.length > 0) {
      filters.push({
        field: "sprint_id",
        operator: "in",
        value: sprintIds,
      })
    }

    return filters
  }

  // Fetch stages
  const { data: stages, isLoading: isLoadingStages } = useList<ITaskStage>({
    resource: "taskStages",
    filters: [
      {
        field: "title",
        operator: "in",
        value: ["TO DO", "IN PROGRESS", "IN REVIEW", "DONE"],
      },
    ],
    sorters: [
      {
        field: "createdAt",
        order: "desc",
      },
    ],
  })

  // Fetch tasks with filters
  const { data: tasks, isLoading: isLoadingTasks } = useList<ITask>({
    resource: "tasks",
    filters: generateFilters(),
    meta: {
      select: `*, 
        users:userId (uid, user_name),
        sprints:sprint_id (
          id, 
          sprint_name,
          milestones:milestone_id (
            id,
            milestone_name
          )
        )`,
    },
    sorters: [
      {
        field: "due_date",
        order: "asc",
      },
    ],
    pagination: {
      mode: "off",
    },
  })

  // Fetch projects for filter
  const { data: projects } = useList({
    resource: "projects",
    meta: {
      select: "id, project_name",
    },
  })

  // Fetch users for filter
  const { data: users } = useList({
    resource: "users",
    meta: {
      select: "uid, user_name",
    },
  })

  // Fetch milestones for filter based on selected project
  const { data: milestones } = useList({
    resource: "milestones",
    filters: selectedProject
      ? [
          {
            field: "project_id",
            operator: "eq",
            value: selectedProject,
          } as LogicalFilter,
        ]
      : [],
    meta: {
      select: "id, milestone_name",
    },
  })

  // Fetch sprints for filter based on selected milestone
  const { data: sprints } = useList({
    resource: "sprints",
    filters: selectedMilestone
      ? [
          {
            field: "milestone_id",
            operator: "eq",
            value: selectedMilestone,
          } as LogicalFilter,
        ]
      : [],
    meta: {
      select: `
        id, 
        sprint_name,
        milestone_id
      `,
    },
  })

  // Fetch sprint IDs when milestone changes
  useEffect(() => {
    const fetchSprintIds = async () => {
      if (selectedMilestone) {
        try {
          const { data, error } = await supabaseClient
            .from("sprints")
            .select("id")
            .eq("milestone_id", selectedMilestone)

          if (error) throw error
          setSprintIds(data.map((sprint) => sprint.id))
        } catch (error) {
          console.error("Error fetching sprint IDs:", error)
          setSprintIds([])
        }
      } else {
        setSprintIds([])
      }
    }

    fetchSprintIds()
  }, [selectedMilestone])

  // Reset dependent filters when project changes
  useEffect(() => {
    if (!selectedProject) {
      setSelectedSprint(null)
      setSelectedMilestone(null)
      setSprintIds([])
    }
  }, [selectedProject])

  // Reset sprint when milestone changes
  useEffect(() => {
    setSelectedSprint(null)
  }, [selectedMilestone])

  // group tasks by stage
  const taskStages = React.useMemo(() => {
    if (!tasks?.data || !stages?.data)
      return {
        unassignedStage: [],
        stages: [],
      }

    const unassignedStage = tasks.data.filter((task) => task.stageId === null)

    // prepare unassigned stage
    const grouped: TaskStage[] = stages.data.map((stage) => ({
      ...stage,
      id: stage.id || "",
      tasks: tasks.data.filter(
        (task) => task.stageId?.toString() === stage.id?.toString()
      ),
    }))

    return {
      unassignedStage,
      columns: grouped,
    }
  }, [tasks, stages])

  const { mutate: updateTask } = useUpdate<ITask, HttpError>({
    resource: "tasks",
    mutationMode: "optimistic",
    successNotification: false,
  })

  // Modify canMoveTask to use the identity from props
  const canMoveTask = (taskUserId: string | null) => {
    // If user has move permission (Project Manager), they can move all cards
    if (movePermission?.can) {
      return true
    }

    // Users can only move their own cards
    return Number(taskUserId) === identity?.uid
  }

  const handleOnDragEnd = (event: DragEndEvent) => {
    let stageId = event.over?.id as undefined | string | null
    const taskId = event.active.id as string
    const taskData = event.active.data.current as ITask
    const taskStageId = event.active.data.current?.stageId

    if (taskStageId === stageId) {
      return
    }
    // Check if user has permission to move this card
    if (!canMoveTask(taskData.userId?.toString() || null)) {
      // You can add a notification here to inform the user
      notification.error({
        message: "Permission Denied",
        description: "You can only move tasks assigned to you",
      })
      return
    }

    if (stageId === "unassigned") {
      stageId = null
    }

    updateTask({
      id: taskId,
      values: {
        stageId: stageId,
      },
    })
  }

  const handleAddCard = (args: { stageId: string }) => {
    const path =
      args.stageId === "unassigned"
        ? "/tasks/new"
        : `/tasks/new?stageId=${args.stageId}`

    replace(path)
  }

  const isLoading = isLoadingTasks || isLoadingStages

  if (isLoading) return <PageSkeleton />

  const transformTaskToCardProps = (task: any) => {
    const assignedUser = task.userId
      ? {
          uid: task.userId,
          user_name: task.users?.user_name || "User",
        }
      : null

    return {
      id: Number(task.id),
      title: task.title,
      updatedAt: task.updated_at,
      dueDate: task.due_date || undefined,
      userId: task.userId,
      assignedUser: assignedUser,
    }
  }

  return (
    <>
      {/* Filters */}
      <Space style={{ marginBottom: 16, padding: "16px" }} wrap>
        <Select
          style={{ width: 200 }}
          placeholder='Filter by Project'
          allowClear
          value={selectedProject}
          onChange={(value: number | null) => setSelectedProject(value)}
        >
          {projects?.data?.map((project) => (
            <Option key={project.id} value={project.id}>
              {project.project_name}
            </Option>
          ))}
        </Select>

        <Select
          style={{ width: 200 }}
          placeholder='Filter by Milestone'
          allowClear
          disabled={!selectedProject}
          value={selectedMilestone}
          onChange={(value: number | null) => setSelectedMilestone(value)}
        >
          {milestones?.data?.map((milestone) => (
            <Option key={milestone.id} value={milestone.id}>
              {milestone.milestone_name}
            </Option>
          ))}
        </Select>

        <Select
          style={{ width: 200 }}
          placeholder='Filter by Sprint'
          allowClear
          disabled={!selectedMilestone}
          value={selectedSprint}
          onChange={(value: number | null) => setSelectedSprint(value)}
        >
          {sprints?.data?.map((sprint) => (
            <Option key={sprint.id} value={sprint.id}>
              {sprint.sprint_name}
            </Option>
          ))}
        </Select>

        <Select
          style={{ width: 200 }}
          placeholder='Filter by User'
          allowClear
          value={selectedUser}
          onChange={(value: string | null) => setSelectedUser(value)}
        >
          {users?.data?.map((user) => (
            <Option key={user.uid} value={user.uid}>
              {user.user_name}
            </Option>
          ))}
        </Select>
      </Space>

      <KanbanBoardContainer>
        <KanbanBoard onDragEnd={handleOnDragEnd}>
          <KanbanColumn
            id={"unassigned"}
            title={"unassigned"}
            count={taskStages?.unassignedStage?.length || 0}
            onAddClick={() => handleAddCard({ stageId: "unassigned" })}
          >
            {taskStages.unassignedStage?.map((task) => {
              return (
                <KanbanItem
                  key={task.id}
                  id={task.id.toString()}
                  data={{ ...task, title: "unassigned" }}
                >
                  <ProjectCardMemo
                    {...transformTaskToCardProps(task)}
                    id={task.id.toString()}
                    dueDate={task.due_date || undefined}
                    users={Array.isArray(task.users) ? task.users : []}
                    task={task}
                  />
                </KanbanItem>
              )
            })}
            {!taskStages.unassignedStage?.length && (
              <KanbanAddCardButton
                onClick={() => handleAddCard({ stageId: "unassigned" })}
              />
            )}
          </KanbanColumn>
          {taskStages.columns?.map((column) => {
            return (
              <KanbanColumn
                key={column.id}
                id={column.id}
                title={column.title}
                count={column.tasks.length}
                onAddClick={() => handleAddCard({ stageId: column.id })}
              >
                {isLoading && <ProjectCardSkeleton />}
                {!isLoading &&
                  column.tasks.map((task) => {
                    return (
                      <KanbanItem
                        key={task.id}
                        id={task.id.toString()}
                        data={task}
                      >
                        <ProjectCardMemo
                          {...transformTaskToCardProps(task)}
                          id={task.id.toString()}
                          users={Array.isArray(task.users) ? task.users : []}
                          dueDate={task.due_date || undefined}
                          task={task}
                        />
                      </KanbanItem>
                    )
                  })}

                {!column.tasks.length && (
                  <KanbanAddCardButton
                    onClick={() =>
                      handleAddCard({
                        stageId: column.id,
                      })
                    }
                  />
                )}
              </KanbanColumn>
            )
          })}
        </KanbanBoard>
      </KanbanBoardContainer>
      {children}
    </>
  )
}

const PageSkeleton = () => {
  const columnCount = 6
  const itemCount = 4

  return (
    <KanbanBoardContainer>
      {Array.from({ length: columnCount }).map((_, index) => {
        return (
          <KanbanColumnSkeleton key={index}>
            {Array.from({ length: itemCount }).map((_, index) => {
              return <ProjectCardSkeleton key={index} />
            })}
          </KanbanColumnSkeleton>
        )
      })}
    </KanbanBoardContainer>
  )
}
