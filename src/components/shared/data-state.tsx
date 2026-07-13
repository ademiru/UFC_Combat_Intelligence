import { AlertTriangle, Database, LoaderCircle } from "lucide-react";

import { Button } from "@/components/ui/button";

interface DataStateProps {
  loading: boolean;
  error: string | null;
  onRetry: () => void;
}

export function DataState({ loading, error, onRetry }: DataStateProps) {
  if (loading) {
    return (
      <div className="grid min-h-[calc(100vh-12rem)] place-items-center rounded-2xl border border-white/[0.07] bg-[#0d0f12]">
        <div className="text-center">
          <span className="mx-auto grid size-14 place-items-center rounded-2xl border border-red-500/15 bg-red-500/[0.06] text-red-500">
            <LoaderCircle className="size-6 animate-spin" />
          </span>
          <p className="mt-5 text-sm font-semibold text-zinc-200">
            Yerel veritabanı hazırlanıyor
          </p>
          <p className="mt-1.5 text-xs text-zinc-600">
            İlk açılışta başlangıç verileri yüklenir.
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="grid min-h-[calc(100vh-12rem)] place-items-center rounded-2xl border border-red-500/15 bg-[#0d0f12]">
        <div className="max-w-md text-center">
          <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-red-500/10 text-red-500">
            <AlertTriangle className="size-6" />
          </span>
          <p className="mt-5 text-sm font-semibold text-zinc-100">
            Yerel veriler açılamadı
          </p>
          <p className="mt-2 text-xs leading-5 text-zinc-500">{error}</p>
          <Button className="mt-5" size="sm" onClick={onRetry}>
            <Database />
            Tekrar dene
          </Button>
        </div>
      </div>
    );
  }

  return null;
}

