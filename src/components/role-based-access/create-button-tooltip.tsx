/**
 * CreateButtonWithTooltip component
 * This component is a reusable component that renders a CreateButton with a Tooltip.
 * The Tooltip displays a message if the user doesn't have permission to create a record.
 */
import { Tooltip } from "antd"
import { CreateButton } from "@refinedev/antd"

interface CreateButtonWithTooltipProps {
  onClick: () => void
  canCreate?: boolean
  resourceName?: string
}

export const CreateButtonWithTooltip: React.FC<
  CreateButtonWithTooltipProps
> = ({ onClick, canCreate = true, resourceName = "record" }) => {
  return (
    <Tooltip
      title={
        !canCreate ? `You don't have permission to create ${resourceName}` : ""
      }
    >
      <CreateButton onClick={onClick} disabled={!canCreate} />
    </Tooltip>
  )
}
