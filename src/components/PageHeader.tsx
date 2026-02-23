import { ArrowLeft } from "lucide-react";
import Link from "next/link";

interface Props {
  titulo: string;
  voltar?: string;
  acao?: React.ReactNode;
}

export default function PageHeader({ titulo, voltar, acao }: Props) {
  return (
    <header className="sticky top-0 z-40 bg-[#ee4d2d] text-white px-4 py-3 flex items-center gap-3 shadow-sm">
      {voltar && (
        <Link href={voltar} className="p-1 -ml-1 rounded-full active:bg-white/20">
          <ArrowLeft size={22} />
        </Link>
      )}
      <h1 className="flex-1 text-lg font-bold truncate">{titulo}</h1>
      {acao}
    </header>
  );
}
