import { InputHTMLAttributes } from "react";

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  erro?: string;
}

export default function Input({ label, erro, className = "", ...props }: Props) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="text-sm font-medium text-gray-700">{label}</label>
      )}
      <input
        {...props}
        className={`
          w-full border rounded-xl px-3 py-2.5 text-sm
          focus:outline-none focus:ring-2 focus:ring-[#ee4d2d]/40 focus:border-[#ee4d2d]
          ${erro ? "border-red-400" : "border-gray-300"}
          ${className}
        `}
      />
      {erro && <p className="text-xs text-red-500">{erro}</p>}
    </div>
  );
}
