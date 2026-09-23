import SidebarShell from "@/components/SidebarShell";
import { getAllLessons } from "@/lib/lessons";

export default function LeccionesLayout({ children }: LayoutProps<"/lecciones">) {
  const lessons = getAllLessons();

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1">
      <SidebarShell lessons={lessons} />
      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
}
