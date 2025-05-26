import { redirect, type LoaderFunctionArgs } from "@remix-run/node";
import { useState } from "react";
import { Calendar } from "~/components/ui/calendar";
import { getOptionalUser } from "~/server/auth.server";

export const loader = async ({ context }: LoaderFunctionArgs) => {
  const user = await getOptionalUser({ context });
  if (user?.role !== "USER") {
    return redirect("/unauthorized");
  }
  return null;
};

export default function Dashboard() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  return (
    <div className="flex h-full items-center justify-center flex-col gap-4">
      <h1 className="text-4xl font-bold">Dashboard page</h1>
      <div className="flex flex-col gap-4 border border-gray-200 rounded-lg p-4">
        <div className="flex flex-col gap-2">
          <h2 className="text-2xl font-bold">
            {date?.toLocaleDateString() ?? new Date().toLocaleDateString()}
          </h2>
        </div>
        <Calendar
          mode="single"
          selected={date}
          onSelect={setDate}
          className="rounded-md border shadow"
        />
      </div>
      <div className="flex flex-col gap-4 border border-gray-200 rounded-lg p-4">
        <div className="flex flex-col gap-2">
          <h2 className="text-2xl font-bold">Prochaine mise en bouteille</h2>
          <p className="text-sm text-gray-500">
            Vous avez une mise en bouteille le {date?.toLocaleDateString()}
          </p>
        </div>
      </div>
    </div>
  );
}
