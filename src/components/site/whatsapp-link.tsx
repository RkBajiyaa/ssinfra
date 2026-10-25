import { site, whatsappUrl } from "@/config/site";
import { buttonClass } from "@/components/ui/button";
import { WhatsAppIcon } from "@/components/ui/icons";

type Props = {
  variant?: "primary" | "dark" | "outline" | "outline-light" | "light";
  size?: "md" | "lg";
  label?: string;
  message?: string;
  className?: string;
  iconOnly?: boolean;
};

/**
 * Renders nothing until the business number is confirmed on WhatsApp
 * (NEXT_PUBLIC_WHATSAPP_ENABLED=true), so visitors never hit a dead link.
 */
export function WhatsAppLink({
  variant = "outline",
  size = "md",
  label = "WhatsApp",
  message,
  className = "",
  iconOnly = false,
}: Props) {
  if (!site.whatsapp.enabled) return null;
  return (
    <a
      href={whatsappUrl(message)}
      target="_blank"
      rel="noopener noreferrer"
      className={iconOnly ? className : buttonClass(variant, size, className)}
      aria-label={iconOnly ? `Chat with ${site.name} on WhatsApp` : undefined}
    >
      <WhatsAppIcon className="size-5" />
      {!iconOnly && <span>{label}</span>}
    </a>
  );
}
