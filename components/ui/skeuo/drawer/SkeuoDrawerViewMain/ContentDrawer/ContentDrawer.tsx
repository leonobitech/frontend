// components/ui/skeuo/drawer/SkeuoDrawerViewPublic/UserContentDrawer/UserContentDrawer.tsx
"use client";

import "./ContentDrawer.css";
import content from "./contentDrawer.json";

export function ContentDrawer() {
  return (
    <div className="drawer-content-view">
      {content.sections.map((section) => (
        <div key={section.id} className="drawer-section">
          <h3 className="section-title">{section.title}</h3>
          <p className="section-description">{section.description}</p>
        </div>
      ))}
    </div>
  );
}
