import type { ReactNode } from "react";

type MemberSurfaceProps = {
  children: ReactNode;
};

export default function MemberSurface({ children }: MemberSurfaceProps) {
  return <div className="mx-auto w-full max-w-6xl space-y-6">{children}</div>;
}
