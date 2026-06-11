import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { allTeams } from "@/lib/country-flags";
import { CountryFlag, CountrySelectItem } from "@/components/CountryFlag";

type TeamSelectProps = {
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
};

export const TeamSelect = ({ value, onValueChange, placeholder = "Selecione a seleção" }: TeamSelectProps) => (
  <Select value={value || undefined} onValueChange={onValueChange}>
    <SelectTrigger>
      <SelectValue placeholder={placeholder}>
        {value ? (
          <span className="flex items-center gap-2">
            <CountryFlag teamName={value} size={20} />
            {value}
          </span>
        ) : null}
      </SelectValue>
    </SelectTrigger>
    <SelectContent>
      {allTeams.map((team) => (
        <SelectItem key={team} value={team}>
          <CountrySelectItem teamName={team} />
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
);
