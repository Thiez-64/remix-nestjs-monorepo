import { getInputProps } from "@conform-to/react";
import {
  ColumnDef
} from "@tanstack/react-table";
import { Field } from "./forms";
import { DataTable } from "./ui/data-table";
import { Switch } from "./ui/switch";

type ActionRow = {
  id: string;
  name: string;
  description: string | null;
  startedAt: Date;
  finishedAt: Date;
  isCompleted: boolean;
  duration: number;
  tankId: string;

}
export function ActionsDataTable({ data }: { data: ActionRow[] }) {
  const columns: ColumnDef<ActionRow>[] = [

    {
      accessorKey: "name",
      header: "Nom",
      cell: ({ row }) => {
        return <div className="font-bold">{row.getValue("name")}</div>;
      },
    },
    {
      accessorKey: "description",
      header: "Description",
      cell: ({ row }) => {
        return <div className="font-bold">{row.getValue("description")}</div>;
      },
    },
    {
      accessorKey: "tankId",
      header: "Cuve",
      cell: ({ row }) => {
        const tankId = row.getValue("tankId") as string;
        return <div className="font-bold">{tankId}</div>;
      },
    },
    {
      accessorKey: "startedAt",
      header: "Date de début",
      cell: ({ row }) => {
        const startedAt = row.getValue("startedAt") as Date;
        const fields = {
          startedAt: {
            value: startedAt,
            errors: [],
          },
        }
        return (
          <Field
            inputProps={getInputProps(fields.startedAt, { type: "date" })}
            errors={fields.startedAt.errors}
          />
        );
      },
    },
    {
      accessorKey: "finishedAt",
      header: "Date de fin",
      cell: ({ row }) => {
        const finishedAt = row.getValue("finishedAt") as Date;
        const fields = {
          finishedAt: {
            value: finishedAt,
            errors: [],
          },
        }
        return (
          <Field
            inputProps={getInputProps(fields.finishedAt, { type: "date" })}
            errors={fields.finishedAt.errors}
          />
        );
      },
    },
    {
      accessorKey: "duration",
      header: "Durée",
      cell: ({ row }) => {
        const duration = row.getValue("duration") as number;
        return <div className="font-bold">{duration.toFixed(1)}Jours</div>;
      },
    },
    {
      accessorKey: "isCompleted",
      header: "Terminée",
      cell: ({ row }) => {
        const isCompleted = row.getValue("isCompleted") as boolean;
        return (<Switch checked={isCompleted} onCheckedChange={() => { }} />);
      },
    },


  ];



  const actionsWithStatus = data.map(action => {
    return {
      ...action,
    };
  });

  return (
    <div className="space-y-4">
      <DataTable columns={columns} data={actionsWithStatus} pagination={false} emptyMessage="Aucune action." />
    </div>
  );
} 
