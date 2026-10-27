/**
 * Access control provider for Refine
 * This file contains the access control provider for the PMS application.
 * It uses the user's role to determine what actions they can perform on each resource.
 * It also contains a special case for task movement, where the permission check is done in the component.
 */
import { AccessControlProvider } from "@refinedev/core"
import { UserRole, ROLE_NAMES } from "@/constants/roles"

// Define detailed permissions with CRUD operations for each resource
const ROLE_PERMISSIONS: Record<number, Record<string, string[]>> = {
  [UserRole.BUSINESS_ANALYST]: {
    dashboard: ["list", "show"],
    users: ["list", "show"],
    tasks: ["list", "show"],
    sprints: ["list", "show"],
    teams: ["list", "show"],
  },
  [UserRole.DESIGNER]: {
    dashboard: ["list", "show"],
    users: ["list", "show"],
    tasks: ["list", "show"],
    sprints: ["list", "show"],
    teams: ["list", "show"],
  },
  [UserRole.DEVELOPER]: {
    dashboard: ["list", "show"],
    users: ["list", "show"],
    tasks: ["list", "show"],
    sprints: ["list", "show"],
    teams: ["list", "show"],
  },
  [UserRole.TEST_ENGINEER]: {
    dashboard: ["list", "show"],
    tasks: ["list", "show"],
    sprints: ["list", "show"],
    users: ["list", "show"],
    teams: ["list", "show"],
  },
  [UserRole.DEVOPS_ENGINEER]: {
    dashboard: ["list", "show"],
    users: ["list", "show"],
    tasks: ["list", "show"],
    sprints: ["list", "show"],
    teams: ["list", "show"],
  },
  [UserRole.PROJECT_MANAGER]: {
    // Project Manager has full access to all resources
    dashboard: ["list", "show", "create", "edit", "delete"],
    projects: ["list", "show", "create", "edit", "delete"],
    tasks: ["list", "show", "create", "edit", "delete"],
    sprints: ["list", "show", "create", "edit", "delete"],
    teams: ["list", "show", "create", "edit", "delete"],
    users: ["list", "show", "create", "edit", "delete"],
    milestones: ["list", "show", "create", "edit", "delete"],
    reports: ["list", "show", "create", "edit", "delete"],
  },
}

// Action mapping for Refine's default actions
const ACTION_MAPPING: Record<string, string> = {
  list: "list",
  show: "show",
  create: "create",
  edit: "edit",
  delete: "delete",
}

export const accessControlProvider: AccessControlProvider = {
  can: async ({ resource, action, params }) => {
    try {
      const userJSON = localStorage.getItem("user")
      if (!userJSON) {
        console.log("No user data found in localStorage")
        return { can: false }
      }

      const user = JSON.parse(userJSON)
      const roleId: keyof typeof ROLE_NAMES = user.role_id

      console.log("Access check for:", {
        user_name: user.user_name,
        role_id: roleId,
        role_name: ROLE_NAMES[roleId],
        resource,
        action,
      })

      // Special handling for task movement
      if (resource === "tasks" && action === "edit") {
        // If it's a project manager, they can edit all tasks
        if (roleId === UserRole.PROJECT_MANAGER) {
          return { can: true }
        }

        // For task movement, we'll check ownership in the component
        // This allows the drag functionality to work while actual permission
        // check happens in the component
        if (params?.id) {
          return { can: true }
        }
      }

      // Get permissions for user's role
      const rolePermissions = ROLE_PERMISSIONS[roleId] || {}
      const resourcePermissions = resource
        ? rolePermissions[resource] || []
        : []

      // Map the action to our permission system
      const mappedAction = ACTION_MAPPING[action] || action

      // Check if the action is allowed for this resource
      const hasAccess = resourcePermissions.includes(mappedAction)

      // console.log("Access check result:", {
      //   resource,
      //   action: mappedAction,
      //   allowed: hasAccess,
      //   allowedActions: resourcePermissions,
      // })

      return { can: hasAccess }
    } catch (error) {
      console.error("Access control error:", error)
      return { can: false }
    }
  },
}
