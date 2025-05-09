"use client";

type Props = {
  title: string;
  onBack: () => void;
  goTo: (view: "level2") => void;
};

export function DrawerView({ title, onBack, goTo }: Props) {
  return (
    <nav className="skeuo-drawer-content">
      <button onClick={onBack}>← Volver</button>
      <h2>{title}</h2>
      <ul>
        <li onClick={() => goTo("level2")}>Subnivel</li>
      </ul>
    </nav>
  );
}
