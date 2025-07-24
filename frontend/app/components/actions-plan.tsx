
import { ArrowDown, Plus, Save } from "lucide-react";
import React, { useRef, useState } from "react";
import { CommodityType } from "../lib/types";
import { ConsumablesDataTable } from "./consumables-data-table";
import { Button } from "./ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "./ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";



export function ActionsPlan({ actions }: { actions: any }) {

  const [selectedAction, setSelectedAction] = useState<string | null>(null);
  const actionRefs = useRef<(HTMLDivElement | null)[]>([]);
  // State pour gérer les consommables de chaque action
  const [actionConsumables, setActionConsumables] = useState<Record<string, typeof actions[0]['consumables']>>({});
  // State pour tracker les actions avec des modifications non sauvegardées
  const [unsavedActions, setUnsavedActions] = useState<Set<string>>(new Set());

  // Fonction pour sauvegarder les consommables d'une action
  const saveConsumables = async (actionId: string) => {
    const consumables = getActionConsumables(actionId);
    const formData = new FormData();
    formData.append("intent", "update-consumables");
    formData.append("actionId", actionId);
    formData.append("consumables", JSON.stringify(consumables));

    try {
      const response = await fetch(window.location.pathname, {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        setUnsavedActions(prev => {
          const newSet = new Set(prev);
          newSet.delete(actionId);
          return newSet;
        });
        // Optionnel: afficher un message de succès
        console.log("Consommables sauvegardés avec succès");
      }
    } catch (error) {
      console.error("Erreur lors de la sauvegarde:", error);
    }
  };

  // Fonction pour marquer une action comme modifiée
  const markActionAsModified = (actionId: string) => {
    setUnsavedActions(prev => new Set(prev.add(actionId)));
  };

  // Fonction pour ajouter un consommable à une action
  const addConsumableToAction = (actionId: string) => {
    const newConsumable = {
      id: `temp-${Date.now()}`,
      name: "",
      quantity: 0,
      originalQuantity: null,
      unit: "",
      description: "",
      commodity: CommodityType.FERMENTATION_ADDITIVES
    };

    setActionConsumables(prev => ({
      ...prev,
      [actionId]: [...(prev[actionId] || actions.find(a => a.id === actionId)?.consumables || []), newConsumable]
    }));
    markActionAsModified(actionId);
  };

  // Fonction pour mettre à jour plusieurs champs d'un consommable en même temps
  const updateMultipleFields = (actionId: string, consumableId: string, updates: Record<string, string | number>) => {
    setActionConsumables(prev => ({
      ...prev,
      [actionId]: (prev[actionId] || actions.find(a => a.id === actionId)?.consumables || []).map(c =>
        c.id === consumableId ? { ...c, ...updates } : c
      )
    }));
    markActionAsModified(actionId);
  };

  // Fonction pour mettre à jour un consommable
  const updateConsumable = (actionId: string, consumableId: string, field: string, value: string | number) => {
    setActionConsumables(prev => ({
      ...prev,
      [actionId]: (prev[actionId] || actions.find(a => a.id === actionId)?.consumables || []).map(c =>
        c.id === consumableId ? { ...c, [field]: value } : c
      )
    }));
    markActionAsModified(actionId);
  };

  // Fonction pour supprimer un consommable
  const deleteConsumable = (actionId: string, consumableId: string) => {
    setActionConsumables(prev => ({
      ...prev,
      [actionId]: (prev[actionId] || actions.find(a => a.id === actionId)?.consumables || []).filter(c =>
        c.id !== consumableId
      )
    }));
    markActionAsModified(actionId);
  };

  // Fonction pour obtenir les consommables d'une action (avec les modifications)
  const getActionConsumables = (actionId: string) => {
    return actionConsumables[actionId] || actions.find(a => a.id === actionId)?.consumables || [];
  };

  console.log('actions', actions)
  return (
    <Card className="w-full h-full">
      <CardHeader>
        <CardTitle>
          <div className="flex flex-row items-center justify-between">
            <h4 className="text-lg font-bold">Planification</h4>
            <Select value={selectedAction ?? undefined}
              onValueChange={value => {
                setSelectedAction(value);
                const idx = actions.findIndex(a => a.name === value);
                if (actionRefs.current[idx]) {
                  actionRefs.current[idx]?.scrollIntoView({ behavior: "smooth", block: "center" });
                }
              }}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner" />
              </SelectTrigger>
              {actions.length > 0 && <SelectContent>
                {actions.map((action, index) =>
                  <SelectItem key={index} value={action.id}>{action.type.name}</SelectItem>
                )}
              </SelectContent>}
            </Select>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="h-[200px] overflow-y-auto w-[450px]">
        {
          [...actions]
            .sort((a, b) => new Date(b.startedAt ?? b.createdAt).getTime() - new Date(a.startedAt ?? a.createdAt).getTime()).map((action, index) =>
              <div key={index} className="flex flex-col" ref={el => actionRefs.current[index] = el}>
                <div className="flex flex-col gap-2 w-full mb-2">
                  <div className="flex flex-row items-center gap-2 bg-background border border-input rounded-md p-1">
                    {action.icon && React.cloneElement(action.icon, { className: "w-4 h-4" })}
                    <h4 className="text-normal font-bold">{action.type.name}</h4>
                  </div>
                  <div className="flex flex-col w-full">
                    <p className="text-sm text-muted-foreground">{action.type.description}</p>
                    <div className="flex flex-row items-center justify-between">
                      <p className="text-sm text-muted-foreground">Début</p>
                      <p className="text-sm text-muted-foreground">{action.startedAt?.toLocaleDateString()}</p>
                    </div>
                    <div className="flex flex-row items-center justify-between">
                      <p className="text-sm text-muted-foreground">Fin</p>
                      <p className="text-sm text-muted-foreground">{action.finishedAt?.toLocaleDateString()}</p>
                    </div>
                    <div className="flex flex-row items-center justify-between">
                      <p className="text-sm text-muted-foreground">Durée</p>
                      <p className="text-sm text-muted-foreground">{action.duration} jours</p>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-2 overflow-y-auto h-full">
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

      </CardContent>
      <CardFooter className="flex flex-row items-center justify-center">
        <Button size="icon" className="size-8" onClick={() => {
          const lastIdx = actions.length - 1;
          if (actionRefs.current[lastIdx]) {
            actionRefs.current[lastIdx]?.scrollIntoView({ behavior: "smooth", block: "center" });
          }
        }}>
          <ArrowDown className="w-4 h-4" />
        </Button>
      </CardFooter>
    </Card >
  )
}
