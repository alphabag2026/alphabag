import { useTranslation } from "react-i18next";
import { LANGUAGES } from "@/lib/i18n";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ChevronDown, Globe } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

export function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const { i18n } = useTranslation();
  const currentLang = LANGUAGES.find((l) => l.code === i18n.language) ?? LANGUAGES[0];

  const handleChange = (code: string) => {
    i18n.changeLanguage(code);
    localStorage.setItem("alphabag-lang", code);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 text-muted-foreground hover:text-foreground px-2"
        >
          {compact ? (
            <Globe className="w-4 h-4" />
          ) : (
            <span className="text-base leading-none">{currentLang.flag}</span>
          )}
          {!compact && (
            <span className="text-xs font-medium hidden sm:inline">{currentLang.nativeName}</span>
          )}
          <ChevronDown className="w-3 h-3 opacity-60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52 p-0">
        <DropdownMenuLabel className="px-3 py-2 text-xs text-muted-foreground uppercase tracking-wider">
          Language / 언어 / 语言
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="my-0" />
        <ScrollArea className="h-72">
          <div className="p-1">
            {LANGUAGES.map((lang) => (
              <DropdownMenuItem
                key={lang.code}
                className={`gap-2.5 cursor-pointer rounded-md px-2 py-1.5 ${
                  lang.code === i18n.language
                    ? "bg-primary/10 text-primary font-semibold"
                    : "text-foreground/80"
                }`}
                onClick={() => handleChange(lang.code)}
              >
                <span className="text-lg leading-none w-6 text-center">{lang.flag}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{lang.nativeName}</p>
                  <p className="text-xs text-muted-foreground truncate">{lang.name}</p>
                </div>
                {lang.code === i18n.language && (
                  <div className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                )}
              </DropdownMenuItem>
            ))}
          </div>
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
