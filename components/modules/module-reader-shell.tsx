import type { ReactNode } from "react";

type ModuleReaderShellProps = {
  outline: ReactNode;
  content: ReactNode;
  rail: ReactNode;
};

export function ModuleReaderShell({
  outline,
  content,
  rail,
}: ModuleReaderShellProps) {
  return (
    <div className="mx-auto w-full max-w-[1500px]">
      <div className="grid min-w-0 gap-6 xl:grid-cols-[17rem_minmax(0,1fr)_20rem] xl:items-start">
        <div className="min-w-0 xl:order-2">{content}</div>
        <div className="min-w-0 xl:order-1 xl:sticky xl:top-20">{outline}</div>
        <div className="min-w-0 xl:order-3 xl:sticky xl:top-20">{rail}</div>
      </div>
    </div>
  );
}
