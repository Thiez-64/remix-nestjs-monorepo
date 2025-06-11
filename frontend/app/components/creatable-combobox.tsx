import { Check, ChevronDown, ChevronUp, Plus } from "lucide-react";
import * as React from "react";
import { Button } from "./ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "./ui/command";

interface Option {
  id: string;
  name: string;
}

interface Props {
  value: string;
  onChange: (value: string) => void;
  options: Option[];
}

export const CreatableCombobox = ({ value, onChange, options }: Props) => {
  const [open, setOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState(value);

  React.useEffect(() => {
    setInputValue(value);
  }, [value]);

  const lowerOptions = options.map(o => o.name.toLowerCase());
  const isNew = inputValue && !lowerOptions.includes(inputValue.toLowerCase());

  return (
    <div className="relative">
      <Button
        type="button"
        onClick={() => setOpen(!open)}
        variant="outline"
        className="w-full justify-between text-muted-foreground text-sm font-normal"
      >
        {value || "Choisir ou créer un consommable"}
        <span className="ml-auto">{open ? <ChevronUp /> : <ChevronDown />}</span>
      </Button>

      {open && (
        <div className="absolute z-10 mt-2 w-full bg-white border rounded-md shadow-md">
          <Command>
            <CommandInput
              value={inputValue}
              onValueChange={(val) => {
                setInputValue(val);
                onChange(val);
              }}
              placeholder="Rechercher ou créer"
            />
            <CommandEmpty>Aucun résultat</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.id}
                  value={option.name}
                  onSelect={() => {
                    onChange(option.name);
                    setInputValue(option.name);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={`mr-2 h-4 w-4 ${value === option.name ? "opacity-100" : "opacity-0"}`}
                  />
                  {option.name}
                </CommandItem>
              ))}
              {isNew && (
                <CommandItem
                  onSelect={() => {
                    onChange(inputValue);
                    setOpen(false);
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Créer « {inputValue} »
                </CommandItem>
              )}
            </CommandGroup>
          </Command>
        </div>
      )}
    </div>
  );
};
