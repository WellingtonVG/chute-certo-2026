import { cn } from "@/lib/utils";
import {
  getCountryCode,
  getFlagUrl,
  normalizeFlagSize,
  type FlagSize,
  type FlagStyle,
} from "@/lib/country-flags";

type CountryFlagProps = {
  teamName: string;
  size?: FlagSize | number;
  style?: FlagStyle;
  className?: string;
};

export const CountryFlag = ({ teamName, size = 24, style = "flat", className }: CountryFlagProps) => {
  const flagSize = normalizeFlagSize(Number(size));
  const url = getFlagUrl(teamName, flagSize, style);
  const height = Math.round(flagSize * 0.75);

  if (!url) {
    return (
      <span
        className={cn("inline-block shrink-0 rounded-sm bg-muted", className)}
        style={{ width: flagSize, height }}
        aria-hidden
      />
    );
  }

  return (
    <img
      src={url}
      alt=""
      width={flagSize}
      height={height}
      loading="lazy"
      className={cn("inline-block shrink-0 rounded-sm object-cover shadow-sm", className)}
    />
  );
};

type CountryLabelProps = {
  teamName: string;
  flagPosition?: "start" | "end";
  size?: FlagSize | number;
  style?: FlagStyle;
  className?: string;
};

export const CountryLabel = ({
  teamName,
  flagPosition = "start",
  size = 24,
  style = "flat",
  className,
}: CountryLabelProps) => (
  <span className={cn("inline-flex items-center gap-1.5", className)}>
    {flagPosition === "start" && <CountryFlag teamName={teamName} size={size} style={style} />}
    <span>{teamName}</span>
    {flagPosition === "end" && <CountryFlag teamName={teamName} size={size} style={style} />}
  </span>
);

export const MatchTeamsDisplay = ({
  homeTeam,
  awayTeam,
  size = 48,
  style = "shiny",
  dateTime,
  dateTimeClassName,
}: {
  homeTeam: string;
  awayTeam: string;
  size?: FlagSize;
  style?: FlagStyle;
  dateTime?: string;
  dateTimeClassName?: string;
}) => (
  <div className="grid grid-cols-3 items-start gap-2 py-1">
    <div className="flex flex-col items-center gap-2 text-center">
      <CountryFlag teamName={homeTeam} size={size} style={style} className="h-auto w-14 sm:w-16" />
      <span className="flex min-h-[2.5rem] items-start justify-center text-sm font-semibold leading-tight sm:text-base">
        {homeTeam}
      </span>
    </div>
    <div className="flex flex-col items-center justify-center gap-1 self-center text-center">
      <span className="text-xs font-medium text-muted-foreground sm:text-sm">vs</span>
      {dateTime && (
        <span className={cn("text-xs leading-tight", dateTimeClassName ?? "text-muted-foreground")}>
          {dateTime}
        </span>
      )}
    </div>
    <div className="flex flex-col items-center gap-2 text-center">
      <CountryFlag teamName={awayTeam} size={size} style={style} className="h-auto w-14 sm:w-16" />
      <span className="flex min-h-[2.5rem] items-start justify-center text-sm font-semibold leading-tight sm:text-base">
        {awayTeam}
      </span>
    </div>
  </div>
);

export const CountrySelectItem = ({ teamName }: { teamName: string }) => (
  <span className="flex items-center gap-2">
    <CountryFlag teamName={teamName} size={20} />
    <span>{teamName}</span>
  </span>
);

export const hasCountryFlag = (teamName: string) => getCountryCode(teamName) !== null;
