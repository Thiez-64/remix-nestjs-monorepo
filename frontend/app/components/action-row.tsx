import { Plus, Save } from "lucide-react"
import React from "react"
import { ConsumablesDataTable } from "./consumables-data-table"
import { Button } from "./ui/button"

export const ActionRow = ({ action }: { action: any }) => {
  return (
    <div className="flex flex-col" >
      <div className="flex flex-col gap-2 w-full">
        <div className="flex flex-row items-center gap-2 bg-background border border-input rounded-md p-2">
          {action.icon && React.cloneElement(action.icon, { className: "w-4 h-4" })}
          <h4 className="text-lg font-bold">{action.name}</h4>
        </div>
        <div className="flex flex-col w-full">
          <p className="text-sm text-muted-foreground">{action.description}</p>
          <div className="flex flex-row items-center justify-between">
            <p className="text-sm text-muted-foreground">Affecté à</p>
            <p className="text-sm text-muted-foreground">{action.createdAt?.toLocaleDateString()}</p>
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <div className="flex flex-row gap-2">
          <Button size="icon" className="size-8" onClick={() => addConsumableToAction(action.id)} >
            <Plus className="w-4 h-4" />
          </Button>
          {unsavedActions.has(action.id) && <Button size="icon" className="size-8" onClick={() => saveConsumables(action.id)} >
            <Save className="w-4 h-4" />
          </Button>}
        </div>
        <ConsumablesDataTable consumables={getActionConsumables(action.id)}
          stocks={[]}
          editable={true}
          onUpdateConsumable={(consumableId, field, value) => updateConsumable(action.id, consumableId, field, value)}
          onDeleteConsumable={(consumableId) => deleteConsumable(action.id, consumableId)}
          onUpdateMultipleFields={(consumableId, updates) => updateMultipleFields(action.id, consumableId, updates)} />
      </div>
    </div>
  )
}
