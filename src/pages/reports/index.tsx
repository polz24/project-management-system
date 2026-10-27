/**
 * Reports Page displays various reports for projects, users, and tasks.
 */
import { useEffect, useState } from "react"
import { Card, Tabs, Button, message } from "antd"
import { PrinterOutlined, SyncOutlined } from "@ant-design/icons"
import { ProjectReport } from "@/components/reports/ProjectReport"
import { UserReport } from "@/components/reports/UserReport"
import { TaskReport } from "@/components/reports/TaskReport"
import { Typography } from "antd"
import { calculateAndUpdateTaskTotalMinutes } from "@/utilities/taskUtils"
import { supabaseClient } from "@/utilities/supabaseClient"
const { Title } = Typography

export const ReportsPage = () => {
  const [activeTab, setActiveTab] = useState("1")
  const [loading, setLoading] = useState(false)
  const [updating, setUpdating] = useState(false)

  const getReportTitle = () => {
    switch (activeTab) {
      case "1":
        return "Project Report"
      case "2":
        return "User Report"
      case "3":
        return "Task Report"
      default:
        return "Reports"
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const handleUpdateAllTaskMinutes = async () => {
    try {
      setUpdating(true)
      const { data: tasks, error } = await supabaseClient
        .from("tasks")
        .select("id")

      if (error) throw error

      await Promise.all(
        tasks.map((task) => calculateAndUpdateTaskTotalMinutes(task.id))
      )

      message.success("Successfully updated all tasks' total minutes")
    } catch (error) {
      console.error("Error updating tasks' total minutes:", error)
      message.error("Failed to update tasks' total minutes")
    } finally {
      setUpdating(false)
    }
  }

  //Print Style

  useEffect(() => {
    const style = document.createElement("style")
    style.innerHTML = `
      @media print {
      /* Hide everything initially */
        body * {
          visibility: hidden;
        }
        
        /* Show only the report content */
        .reports-content,
        .reports-content * {
          visibility: visible;
        }

        /* Position the report content at the top */
        .reports-content {
          position: absolute;
          left: 0;
          top: 0;
          width: 100%;
        }
        /* Hide specific elements we don't want to print */
        .no-print {
          display: none !important;
        }
        /* Hide tab navigation */
        .ant-tabs-nav {
          display: none !important;
        }
        
        /* Reset the card styles */
        .ant-card {
          border: none !important;
          box-shadow: none !important;
          
        }
        /* Ensure the report content takes full width */
        .reports-content {
          width: 100% !important;
          margin: 0 !important;
          padding: 0 !important;
        }

        /* Table styles */
        .ant-table {
          width: 100% !important;
        }
        .ant-table-cell {
          padding: 8px !important;
          font-size: 12px !important;
          //white-space: nowrap !important;
        }
        .ant-table-thead > tr > th {
          white-space: nowrap !important;
          background-color: #f0f0f0 !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        /* Page settings */
        @page {
          size: landscape;
          margin: 1cm;
        }
        
      }
    `
    document.head.appendChild(style)

    return () => {
      document.head.removeChild(style)
    }
  }, [])

  return (
    <div className='reports-content'>
      <Card
        title={
          <Title level={3} style={{ margin: 0 }}>
            {getReportTitle()}
          </Title>
        }
        extra={
          <div className='no-print' style={{ display: "flex", gap: "8px" }}>
            <Button
              onClick={handleUpdateAllTaskMinutes}
              icon={<SyncOutlined spin={updating} />}
              className='no-print'
              loading={updating}
            >
              Update Task Hours
            </Button>
            <Button
              type='primary'
              icon={<PrinterOutlined />}
              onClick={handlePrint}
              className='no-print'
            >
              Print Report
            </Button>
          </div>
        }
      >
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          type='card'
          items={[
            {
              key: "1",
              label: "Projects",
              children: (
                <ProjectReport loading={loading} setLoading={setLoading} />
              ),
            },
            {
              key: "2",
              label: "Users",
              children: (
                <UserReport loading={loading} setLoading={setLoading} />
              ),
            },
            {
              key: "3",
              label: "Tasks",
              children: (
                <TaskReport loading={loading} setLoading={setLoading} />
              ),
            },
          ]}
        />
      </Card>
    </div>
  )
}

export default ReportsPage
