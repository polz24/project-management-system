import { render, waitFor } from "@testing-library/react"
import { fireEvent } from "@testing-library/dom"
import { screen } from "@testing-library/dom"
import { TasksListPage } from "./list"
import {
  useList,
  useNavigation,
  useUpdate,
  useCan,
  useGetIdentity,
} from "@refinedev/core"
import { notification } from "antd"

// Mock the required hooks and modules
jest.mock("@refinedev/core", () => ({
  useList: jest.fn(),
  useNavigation: jest.fn(),
  useUpdate: jest.fn(),
  useCan: jest.fn(),
  useGetIdentity: jest.fn(),
}))

jest.mock("antd", () => ({
  ...jest.requireActual("antd"),
  notification: {
    error: jest.fn(),
  },
}))

jest.mock("@/utilities/supabaseClient", () => ({
  supabaseClient: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          data: [{ id: 1 }, { id: 2 }],
          error: null,
        })),
      })),
    })),
  },
}))

describe("TasksListPage", () => {
  const mockStages = {
    data: [
      { id: "1", title: "TO DO" },
      { id: "2", title: "IN PROGRESS" },
      { id: "3", title: "IN REVIEW" },
      { id: "4", title: "DONE" },
    ],
  }

  const mockTasks = {
    data: [
      {
        id: "1",
        title: "Task 1",
        stageId: "1",
        userId: "1",
        due_date: "2024-03-01",
      },
      {
        id: "2",
        title: "Task 2",
        stageId: "2",
        userId: "2",
        due_date: "2024-03-02",
      },
    ],
  }

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks()

    // Setup default mock implementations
    ;(useList as jest.Mock).mockImplementation((params) => {
      if (params.resource === "taskStages") {
        return { data: mockStages, isLoading: false }
      }
      if (params.resource === "tasks") {
        return { data: mockTasks, isLoading: false }
      }
      return { data: { data: [] }, isLoading: false }
    })
    ;(useNavigation as jest.Mock).mockReturnValue({
      replace: jest.fn(),
    })
    ;(useUpdate as jest.Mock).mockReturnValue({
      mutate: jest.fn(),
    })
    ;(useCan as jest.Mock).mockReturnValue({
      data: { can: true },
    })
    ;(useGetIdentity as jest.Mock).mockReturnValue({
      data: { id: "1", uid: 1 },
    })
  })

  test("renders loading skeleton when data is loading", () => {
    ;(useList as jest.Mock).mockImplementation(() => ({
      data: null,
      isLoading: true,
    }))

    render(<TasksListPage />)
    expect(screen.getByTestId("page-skeleton")).toBeInTheDocument()
  })

  test("renders kanban board with correct columns and tasks", async () => {
    render(<TasksListPage />)

    await waitFor(() => {
      mockStages.data.forEach((stage) => {
        expect(screen.getByText(stage.title)).toBeInTheDocument()
      })
    })

    await waitFor(() => {
      mockTasks.data.forEach((task) => {
        expect(screen.getByText(task.title)).toBeInTheDocument()
      })
    })
  })

  test("handles task drag and drop with permission", async () => {
    const updateMutate = jest.fn()
    ;(useUpdate as jest.Mock).mockReturnValue({
      mutate: updateMutate,
    })

    render(<TasksListPage />)

    // Simulate drag end event
    const dragEndEvent = {
      active: {
        id: "1",
        data: { current: { userId: "1", stageId: "1" } },
      },
      over: { id: "2" },
    }

    // Get the KanbanBoard component and trigger onDragEnd
    const board = screen.getByTestId("kanban-board")
    fireEvent(board, "dragend", dragEndEvent)

    expect(updateMutate).toHaveBeenCalledWith({
      id: "1",
      values: { stageId: "2" },
    })
  })

  test("prevents task drag when user lacks permission", async () => {
    // Mock user without permission
    ;(useCan as jest.Mock).mockReturnValue({
      data: { can: false },
    })
    ;(useGetIdentity as jest.Mock).mockReturnValue({
      data: { id: "2", uid: 2 },
    })

    render(<TasksListPage />)

    const dragEndEvent = {
      active: {
        id: "1",
        data: { current: { userId: "1", stageId: "1" } },
      },
      over: { id: "2" },
    }

    const board = screen.getByTestId("kanban-board")
    fireEvent(board, "dragend", dragEndEvent)

    expect(notification.error).toHaveBeenCalledWith({
      message: "Permission Denied",
      description: "You can only move tasks assigned to you",
    })
  })

  test("handles filter changes correctly", async () => {
    render(<TasksListPage />)

    // Test project filter
    const projectSelect = screen.getByPlaceholderText("Filter by Project")
    fireEvent.change(projectSelect, { target: { value: "1" } })

    // Test milestone filter
    const milestoneSelect = screen.getByPlaceholderText("Filter by Milestone")
    fireEvent.change(milestoneSelect, { target: { value: "1" } })

    // Test sprint filter
    const sprintSelect = screen.getByPlaceholderText("Filter by Sprint")
    fireEvent.change(sprintSelect, { target: { value: "1" } })

    // Test user filter
    const userSelect = screen.getByPlaceholderText("Filter by User")
    fireEvent.change(userSelect, { target: { value: "1" } })

    // Verify that useList was called with updated filters
    expect(useList).toHaveBeenCalledWith(
      expect.objectContaining({
        filters: expect.arrayContaining([
          expect.objectContaining({ field: "project_id", value: "1" }),
          expect.objectContaining({ field: "sprint_id", value: "1" }),
          expect.objectContaining({ field: "userId", value: "1" }),
        ]),
      })
    )
  })

  test("handles add card button click", async () => {
    const replaceMock = jest.fn()
    ;(useNavigation as jest.Mock).mockReturnValue({
      replace: replaceMock,
    })

    render(<TasksListPage />)

    const addButton = screen.getByTestId("add-card-button")
    fireEvent.click(addButton)

    expect(replaceMock).toHaveBeenCalledWith("/tasks/new")
  })
})
