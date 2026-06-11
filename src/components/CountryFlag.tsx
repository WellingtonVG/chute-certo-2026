import { cn } from "@/lib/utils";
import { getCountryCode, getFlagUrl, type FlagSize, type FlagStyle } from "@/lib/country-flags";

type CountryFlagProps = {
  teamName: string;
  size?: FlagSize;
  style?: FlagStyle;
  className?: string;
};

export const CountryFlag = ({ teamName, size = 24, style = "flat", className }: CountryFlagProps) => {
  const url = getFlagUrl(teamName, size, style);
  const height = Math.round(size * 0.75);

  if (!url) {
    return (
      <span
        className={cn("inline-block shrink-0 rounded-sm bg-muted", className)}
        style={{ width: size, height }}
        aria-hidden
      />
    );
  }

  return (
    <img
      src={url}
      alt=""
      width={size}
      height={height}
      loading="lazy"
      className={cn("inline-block shrink-0 rounded-sm object-cover shadow-sm", className)}
    />
  );
};

type CountryLabelProps = {
  teamName: string;
  flagPosition?: "start" | "end";
  size?: FlagSize;
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
}: {
  homeTeam: string;
  awayTeam: string;
  size?: FlagSize;
  style?: FlagStyle;
}) => (
  <div className="flex items-center justify-center gap-3 py-1 sm:gap-6">
    <div className="flex min-w-0 flex-1 flex-col items-center gap-2 text-center">
      <CountryFlag teamName={homeTeam} size={size} style={style} className="h-auto w-14 sm:w-16" />
      <span className="text-sm font-semibold leading-tight sm:text-base">{homeTeam}</span>
    </div>
    <span className="shrink-0 text-xs font-medium text-muted-foreground sm:text-sm">vs</span>
    <div className="flex min-w-0 flex-1 flex-col items-center gap-2 text-center">
      <CountryFlag teamName={awayTeam} size={size} style={style} className="h-auto w-14 sm:w-16" />
      <span className="text-sm font-semibold leading-tight sm:text-base">{awayTeam}</span>
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
