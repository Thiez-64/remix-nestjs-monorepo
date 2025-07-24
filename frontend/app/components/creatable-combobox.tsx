import { Check, ChevronDown, ChevronUp, Plus } from "lucide-react";
import * as React from "react";
import { createPortal } from "react-dom";
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
  dropUp?: boolean;
}

export const CreatableCombobox = ({ value, onChange, options, dropUp = false }: Props) => {
  const [open, setOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState(value);
  const buttonRef = React.useRef<HTMLButtonElement>(null);
  const menuRef = React.useRef<HTMLDivElement>(null);
  const [position, setPosition] = React.useState({ top: 0, left: 0, width: 0 });

  React.useEffect(() => {
    setInputValue(value);
  }, [value]);

  React.useEffect(() => {
    if (open && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setPosition({
        top: dropUp ? rect.top - 2 : rect.bottom + 2,
        left: rect.left,
        width: rect.width
      });
    }
  }, [open, dropUp]);

  // Fermer le menu au clic extérieur
  React.useEffect(() => {
    if (!open) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        buttonRef.current && !buttonRef.current.contains(target) &&
        menuRef.current && !menuRef.current.contains(target)
      ) {
        setOpen(false);
      }
    };

    const handleScroll = () => {
      setOpen(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [open]);

  const lowerOptions = options.map(o => o.name.toLowerCase());
  const isNew = inputValue && !lowerOptions.includes(inputValue.toLowerCase());

  const menuContent = open ? (
    <div
      className="fixed z-50 bg-white border rounded-md shadow-lg max-h-60 overflow-y-auto"
      style={{
        top: position.top,
        left: position.left,
        width: position.width,
        transform: dropUp ? 'translateY(-100%)' : 'none'
      }}
      ref={menuRef}
    >
          <Command>
            <CommandInput
              value={inputValue}
              onValueChange={(val) => {
                setInputValue(val);
                // Ne pas déclencher onChange pendant la frappe, seulement en local
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
  ) : null;

  return (
    <div className="relative">
      <Button
        type="button"
        onClick={() => setOpen(!open)}
        variant="outline"
        className="w-full justify-between text-muted-foreground text-sm font-normal"
        ref={buttonRef}
      >
        {value || "Create or choose a consumable"}
        <span className="ml-auto">{open ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}</span>
      </Button>

      {typeof window !== 'undefined' && createPortal(menuContent, document.body)}
    </div>
  );
};
