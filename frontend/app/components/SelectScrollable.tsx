import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";

export function SelectScrollable({
  name,
  value,
  onValueChange,
}: {
  name: string;
  value?: string;
  onValueChange?: (value: string) => void;
}) {
  return (
    <Select name={name} value={value} onValueChange={onValueChange}>
      <SelectTrigger className="w-[280px]">
        <SelectValue placeholder="Sélectionner une action" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>Réception</SelectLabel>
          <SelectItem value="RECEPTIONNER_MOUT">
            Réceptionner du moût
          </SelectItem>
        </SelectGroup>
        <SelectGroup>
          <SelectLabel>Fermentation</SelectLabel>
          <SelectItem value="FERMENTATION_ALCOOLIQUE">
            Fermentation alcoolique
          </SelectItem>
          <SelectItem value="FERMENTATION_MALO_LACTIQUE">
            Fermentation malo-lactique
          </SelectItem>
        </SelectGroup>
        <SelectGroup>
          <SelectLabel>Élevage</SelectLabel>
          <SelectItem value="CLARIFIER">Clarifier</SelectItem>
          <SelectItem value="STABILISER">Stabiliser</SelectItem>
          <SelectItem value="AJUSTER">Ajuster</SelectItem>
        </SelectGroup>
        <SelectGroup>
          <SelectLabel>Conditionnement</SelectLabel>
          <SelectItem value="FILTRER">Filtrer</SelectItem>
          <SelectItem value="METTRE_EN_BOUTEILLE">
            Mettre en bouteille
          </SelectItem>
          <SelectItem value="METTRE_EN_BIB">Mettre en BIB</SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
