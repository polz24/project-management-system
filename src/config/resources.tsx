/**
 * This file contains the resources configuration for the Refine UI.
 * A resource in Refine performs these actions:
 * list -> get all records (Read)
 * show -> get a single record (Read)
 * create -> create a record (Create)
 * edit -> update a record (Update)
 * delete -> delete a record (Delete)
 * or clone
 */
import {
  DashboardOutlined, FlagOutlined, ProjectOutlined, ShopOutlined,
  SnippetsOutlined, TeamOutlined, UnorderedListOutlined, UserOutlined,
} from "@ant-design/icons"
import { IResourceItem } from "@refinedev/core"

export const resources: IResourceItem[] = [
  {
    name: "dashboard",
    list: "/",
    meta: {
      label: "Dashboard",
      icon: <DashboardOutlined />,
    },
  },
  {
    name: "projects",
    list: "/projects",
    show: "/projects/:id",
    create: "/projects/new",
    edit: "/projects/edit/:id",
    meta: {
      label: "Projects",
      icon: <ShopOutlined />,
    },
  },

  {
    name: "users",
    list: "/users",
    create: "/users/new",
    edit: "/users/edit/:id",
    meta: {
      label: "Users",
      icon: <UserOutlined />,
    },
  },

  {
    name: "teams",
    list: "/teams",
    meta: {
      label: "Teams",
      icon: <TeamOutlined />,
    },
  },

  {
    name: "tasks",
    list: "/tasks",
    create: "/tasks/new",
    edit: "/tasks/edit/:id",
    meta: {
      label: "Tasks",
      icon: <ProjectOutlined />,
    },
  },

  {
    name: "sprints",
    list: "/sprints",
    meta: {
      label: "Sprints",
      icon: <UnorderedListOutlined />,
    },
  },

  {
    name: "milestones",
    list: "/milestones",
      meta: {
      label: "Milestones",
      icon: <FlagOutlined />,
    },
  },

  {
    name: "reports",
    list: "/reports",
    meta: {
      label: "Reports",
      icon: <SnippetsOutlined />,
    },
  },
]
