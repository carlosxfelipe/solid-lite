import { h } from "@solid/index.ts";
import { IconName, Icons } from "@utils/icons.tsx";

export type { IconName };

interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
  class?: string;
}

export function Icon(props: IconProps) {
  const IconComponent = Icons[props.name];

  if (!IconComponent) {
    console.warn(`Ícone "${props.name}" não encontrado.`);
    return null;
  }

  return (
    <span
      class={`inline-flex items-center justify-center ${props.class || ""}`}
      style={{
        width: `${props.size || 24}px`,
        height: `${props.size || 24}px`,
        color: props.color || "currentColor",
        display: "inline-block",
        lineHeight: 0,
      }}
    >
      <IconComponent size={props.size || 24} />
    </span>
  );
}
