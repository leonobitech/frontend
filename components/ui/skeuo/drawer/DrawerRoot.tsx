"use client";

type Props = {
  goTo: (view: "level1" | "level2") => void;
};

export function DrawerRoot({ goTo }: Props) {
  return (
    <nav className="skeuo-drawer-content">
      <h2>Menú principal</h2>
      <ul>
        <li onClick={() => goTo("level1")}>Ir a Nivel 1</li>
        <li onClick={() => goTo("level2")}>Ir a Nivel 2</li>
      </ul>
    </nav>
  );
}
