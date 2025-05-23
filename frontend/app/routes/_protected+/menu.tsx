import { json } from "@remix-run/node";

export const loader = async () => {
  // TODO: Add your data fetching logic here
  return json({ menu: [] });
};

export default function Menu() {
  return (
    <div>
      <h1>Menu</h1>
    </div>
  );
}
