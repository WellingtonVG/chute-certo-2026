import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";
import { checkAnswer, type QuizQuestion } from "@/lib/quiz-data";

interface Props {
  question: QuizQuestion;
  selected: string | null;
  showResult: boolean;
  onSelect: (option: string) => void;
}

const QuizOptions = ({ question, selected, showResult, onSelect }: Props) => {
  const isCorrect = selected && selected !== "__timeout__" ? checkAnswer(question, selected) : false;

  const handleTouchEnd = (event: React.TouchEvent<HTMLButtonElement>) => {
    const target = event.target as EventTarget | null;
    if (target instanceof HTMLElement) {
      target.blur();
    }
  };

  return (
    <div className="grid gap-2">
      {question.options.map((option, i) => {
        let variant: "outline" | "default" | "destructive" = "outline";
        let icon = null;
        if (showResult) {
          const isThisCorrect = checkAnswer(question, option);
          if (isThisCorrect) {
            variant = "default";
            icon = <Check className="h-4 w-4" />;
          } else if (option === selected && !isCorrect) {
            variant = "destructive";
            icon = <X className="h-4 w-4" />;
          }
        }

        return (
          <Button
            key={i}
            variant={variant}
            className="h-auto justify-start whitespace-normal px-4 py-3 text-left text-sm tap-highlight-none focus:outline-none active:outline-none hover:bg-background hover:text-foreground focus-visible:ring-0 focus-visible:ring-offset-0"
            style={{ WebkitTapHighlightColor: "transparent" }}
            onClick={() => onSelect(option)}
            onTouchEnd={handleTouchEnd}
            disabled={showResult}
          >
            <span className="mr-2 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-bold">
              {String.fromCharCode(65 + i)}
            </span>
            <span className="flex-1">{option}</span>
            {icon}
          </Button>
        );
      })}
    </div>
  );
};

export default QuizOptions;
