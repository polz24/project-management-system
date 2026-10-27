/**
 * ProjectCardSkeleton component is used to display a skeleton of a project card.
 * It is used when the data is loading and the user is waiting for the data to be displayed.
 */
import { Card, Skeleton } from "antd"

const ProjectCardSkeleton = () => {
  return (
    <Card
      size='small'
      bodyStyle={{
        display: "flex",
        justifyContent: "center",
        gap: "8px",
      }}
      title={
        <Skeleton.Button
          active
          size='small'
          style={{
            width: "200px",
            height: "22px",
          }}
        />
      }
    >
      <Skeleton.Button
        active
        size='small'
        style={{
          width: "200px",
        }}
      />
      <Skeleton.Avatar active size='small' />
    </Card>
  )
}

export default ProjectCardSkeleton
