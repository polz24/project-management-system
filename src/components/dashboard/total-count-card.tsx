/* This component is a reusable card component that displays a metric with an optional icon and title.
It is used primarily in the dashboard to show various statistics. */
import React from "react"

import { AuditOutlined, ShopOutlined, TeamOutlined } from "@ant-design/icons"

import { Card, Skeleton } from "antd"

import { Text } from "@/components"
import { Tiny } from "@ant-design/plots"

type Type = "projects" | "users" | "tasks" | "dueProjects" | "assignedUsers"

type Props = {
  resource: Type
  isLoading: boolean
  totalCount?: number
}

/* A reusable card component that displays a metric with an optional icon and title.
Used primarily in the dashboard to show various statistics. */

export const DashboardTotalCountCard = ({
  resource,
  isLoading,
  totalCount,
}: Props) => {
  const { primaryColor, secondaryColor, icon, title } = variants[resource]

  const DemoRing = () => {
    const percent = variants[resource].percent
    const config = {
      percent,
      width: 50,
      height: 50,
      color: [primaryColor, secondaryColor],
      annotations: [
        {
          type: "text",
          style: {
            text: `${percent * 100}%`,
            x: "50%",
            y: "50%",
            textAlign: "center",
            fontSize: 12,
            fontStyle: "bold",
          },
        },
      ],
    }

    return <Tiny.Ring {...config} />
  }

  return (
    <Card
      style={{ height: "96px", padding: 0 }}
      bodyStyle={{
        padding: "8px 8px 8px 12px",
      }}
      size='small'
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          whiteSpace: "nowrap",
        }}
      >
        {icon}
        <Text size='md' className='secondary' style={{ marginLeft: "8px" }}>
          {title}
        </Text>
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <Text
          size='xxxl'
          strong
          style={{
            flex: 1,
            whiteSpace: "nowrap",
            flexShrink: 0,
            textAlign: "start",
            marginLeft: "48px",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {isLoading ? (
            <Skeleton.Button
              style={{
                marginTop: "8px",
                width: "74px",
              }}
            />
          ) : (
            totalCount
          )}
        </Text>
        <DemoRing />
      </div>
    </Card>
  )
}

const IconWrapper = ({
  color,
  children,
}: React.PropsWithChildren<{ color: string }>) => {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: "32px",
        height: "32px",
        borderRadius: "50%",
        backgroundColor: color,
      }}
    >
      {children}
    </div>
  )
}

const variants: {
  [key in Type]: {
    primaryColor: string
    secondaryColor?: string
    icon: React.ReactNode
    title: string
    percent: number
  }
} = {
  projects: {
    primaryColor: "#1677FF",
    secondaryColor: "#BAE0FF",
    icon: (
      <IconWrapper color='#E6F4FF'>
        <ShopOutlined
          className='md'
          style={{
            color: "#1677FF",
          }}
        />
      </IconWrapper>
    ),
    title: "Total Projects",
    percent: 1.0,
  },
  users: {
    primaryColor: "#52C41A",
    secondaryColor: "#D9F7BE",
    icon: (
      <IconWrapper color='#F6FFED'>
        <TeamOutlined
          className='md'
          style={{
            color: "#52C41A",
          }}
        />
      </IconWrapper>
    ),
    title: "Total Resources",
    percent: 1.0,
  },
  tasks: {
    primaryColor: "#FA541C",
    secondaryColor: "#FFD8BF",
    icon: (
      <IconWrapper color='#FFF2E8'>
        <AuditOutlined
          className='md'
          style={{
            color: "#FA541C",
          }}
        />
      </IconWrapper>
    ),
    title: "Total Tasks",
    percent: 1.0,
  },
  dueProjects: {
    primaryColor: "#ffc0cb",
    secondaryColor: "#FF6961",
    icon: (
      <IconWrapper color='#FFF2F4'>
        <ShopOutlined
          className='md'
          style={{
            color: "#FF6961",
          }}
        />
      </IconWrapper>
    ),
    title: "Projects Overdue",
    percent: 0.3,
  },
  assignedUsers: {
    primaryColor: "#ffc0cb",
    secondaryColor: "#FF6961",
    icon: (
      <IconWrapper color='#FFF2F4'>
        <ShopOutlined
          className='md'
          style={{
            color: "#FF6961",
          }}
        />
      </IconWrapper>
    ),
    title: "Assigned Users",
    percent: 0.9,
  },
}
