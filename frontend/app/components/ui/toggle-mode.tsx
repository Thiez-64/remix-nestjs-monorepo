import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Switch } from "./switch";

export function ModeToggle() {
  const { theme, setTheme } = useTheme();
  return (
    <Switch
      checked={theme === "dark"}
      onCheckedChange={() => setTheme(theme === "dark" ? "light" : "dark")}
      checkedIcon={<Moon size={12} />}
      uncheckedIcon={<Sun size={12} />}
      className="cursor-pointer"
      aria-label="Toggle dark mode"
    />
  );
}
