import { ButtonHTMLAttributes } from "react";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: "primario" | "secundario" | "perigo" | "whatsapp" | "ghost";
  tamanho?: "sm" | "md" | "lg";
  fullWidth?: boolean;
}

const estilos = {
  primario: "bg-[#ee4d2d] text-white active:bg-[#d73211]",
  secundario: "bg-gray-100 text-gray-800 active:bg-gray-200",
  perigo: "bg-red-600 text-white active:bg-red-700",
  whatsapp: "bg-[#25d366] text-white active:bg-[#1da851]",
  ghost: "bg-transparent text-gray-600 active:bg-gray-100",
};

const tamanhos = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2.5 text-sm",
  lg: "px-5 py-3 text-base",
};

export default function Btn({
  variante = "primario",
  tamanho = "md",
  fullWidth,
  className = "",
  children,
  ...props
}: Props) {
  return (
    <button
      {...props}
      className={`
        ${estilos[variante]} ${tamanhos[tamanho]}
        ${fullWidth ? "w-full" : ""}
        font-semibold rounded-xl transition-colors
        disabled:opacity-50 disabled:pointer-events-none
        flex items-center justify-center gap-2
        ${className}
      `}
    >
      {children}
    </button>
  );
}
