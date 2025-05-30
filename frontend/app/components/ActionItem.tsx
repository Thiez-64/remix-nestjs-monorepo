import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useState } from "react";
import { Action } from "~/server/action.server";

export default function ActionItem({ action }: { action: Action }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(action.title);
  const [editedDescription, setEditedDescription] = useState(
    action.description
  );

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = () => {
    // Envoyer les données modifiées au serveur via une requête POST ou PUT
    console.log("Enregistrer les modifications :", {
      title: editedTitle,
      description: editedDescription,
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedTitle(action.title);
    setEditedDescription(action.description);
    setIsEditing(false);
  };
  return (
    <div className="border p-4 rounded-md shadow-sm mb-4">
      {isEditing ? (
        <div>
          <input
            type="text"
            value={editedTitle}
            onChange={(e) => setEditedTitle(e.target.value)}
            className="w-full border rounded-md p-2 mb-2"
          />
          <textarea
            value={editedDescription}
            onChange={(e) => setEditedDescription(e.target.value)}
            className="w-full border rounded-md p-2 mb-2"
          />
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              className="bg-blue-500 text-white px-4 py-2 rounded"
            >
              Enregistrer
            </button>
            <button
              onClick={handleCancel}
              className="bg-gray-500 text-white px-4 py-2 rounded"
            >
              Annuler
            </button>
          </div>
        </div>
      ) : (
        <div>
          <h3 className="text-lg font-bold">{action.title}</h3>
          <p className="text-sm text-gray-600">{action.description}</p>
          <p className="text-sm text-gray-500">
            Date : {format(new Date(action.date), "PPP", { locale: fr })}
          </p>
          <button
            onClick={handleEdit}
            className="bg-blue-500 text-white px-4 py-2 rounded mt-2"
          >
            Modifier
          </button>
        </div>
      )}
    </div>
  );
}
