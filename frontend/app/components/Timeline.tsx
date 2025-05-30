import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Action } from "~/server/action.server";

export function Timeline({ actions }: { actions: JsonifyObject<Action>[] }) {
  return (
    <div className="flow-root">
      <ul className="-mb-8">
        {actions?.map((action, actionIdx) => (
          <li key={action.id}>
            <div className="relative pb-8">
              {actionIdx !== actions.length - 1 ? (
                <span
                  className="absolute left-4 top-4 -ml-px h-full w-0.5 bg-gray-200"
                  aria-hidden="true"
                />
              ) : null}
              <div className="relative flex space-x-3">
                <div>
                  <span className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center ring-8 ring-white">
                    <svg
                      className="h-5 w-5 text-white"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </span>
                </div>
                <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                  <div>
                    <p className="text-sm text-gray-500">
                      {action.user.name || "Utilisateur"}{" "}
                      <span className="font-medium text-gray-900">
                        {action.title}
                      </span>
                    </p>
                    <p className="mt-0.5 text-sm text-gray-500">
                      {action.description}
                    </p>
                  </div>
                  <div className="whitespace-nowrap text-right text-sm text-gray-500">
                    <time dateTime={action.date.toLocaleString()}>
                      {format(action.date, "PPP", { locale: fr })}
                    </time>
                  </div>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
