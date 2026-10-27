/**
 * SprintCard component is a card that displays the sprints of a milestone.
 */
import { ISprint } from "@/interfaces"
import { CaretDownFilled } from "@ant-design/icons"
import { Card, List, Space, Typography } from "antd"
import dayjs from "dayjs"
import { useState } from "react"

// Add proper interface for props
interface SprintCardProps {
  milestoneId: number
  sprints: ISprint[]
}

const SprintCard = ({
  milestoneId,
  sprints,
}: {
  milestoneId: number
  sprints: ISprint[]
}) => {
  const [isExpanded, setIsExpanded] = useState(false)

  const milestoneSprints = sprints.filter(
    (sprint) => Number(sprint.milestone_id) === Number(milestoneId)
  )

  //Helper function to format dates
  const formatDate = (date: Date | null) => {
    if (!date) return "Not set"
    return dayjs(new Date(date)).format("DD-MM-YYYY")
  }

  return (
    <Card
      size='small'
      extra={
        <CaretDownFilled
          onClick={(e) => {
            e.stopPropagation()
            setIsExpanded(!isExpanded)
          }}
          style={{ cursor: "pointer" }}
        />
      }
      title={`${milestoneSprints.length} Sprint(s)`}
      style={{ width: "100%" }}
    >
      {isExpanded && (
        <List
          size='small'
          dataSource={milestoneSprints}
          rowKey={(record) => record.id}
          renderItem={(sprint) => (
            <List.Item key={sprint.id}>
              <Space direction='vertical' size='small'>
                <Typography.Text strong>{sprint.sprint_name}</Typography.Text>
                <Typography.Text type='secondary'>
                  {formatDate(sprint.start_date)} -{" "}
                  {formatDate(sprint.due_date)}
                </Typography.Text>
              </Space>
            </List.Item>
          )}
        />
      )}
    </Card>
  )
}

export default SprintCard
