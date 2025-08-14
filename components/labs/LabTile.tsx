"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { LabItem } from "@/data/labs";
import { ICONS, DefaultIcon } from "@/components/ui/icons";

function StatusBadge({ status }: { status: LabItem["status"] }) {
  const map = {
    ready: { label: "Listo", className: "bg-emerald-600 text-white" },
    wip: { label: "En progreso", className: "bg-amber-500 text-white" },
    soon: { label: "Próximamente", className: "bg-slate-400 text-white" },
  } as const;

  const { label, className } = map[status];
  return (
    <span className={`px-2 py-0.5 rounded text-xs ${className}`}>{label}</span>
  );
}

function isExternalUrl(url: string) {
  return /^https?:\/\//i.test(url);
}

export default function LabTile({ lab }: { lab: LabItem }) {
  const Icon = lab.icon ? ICONS[lab.icon] : DefaultIcon;
  const disabled = lab.status === "soon";
  const external = isExternalUrl(lab.path);

  const CardBody = (
    <Card
      className={`h-full transition hover:shadow-lg ${
        disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer"
      }`}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Icon className="h-5 w-5" />
          {lab.title}
          {external && !disabled ? <span aria-hidden>↗</span> : null}
        </CardTitle>
        <StatusBadge status={lab.status} />
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{lab.description}</p>
        {lab.badges?.length ? (
          <div className="flex flex-wrap gap-2 mt-3">
            {lab.badges.map((b) => (
              <Badge key={b} variant="secondary" className="text-xs">
                {b}
              </Badge>
            ))}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );

  if (disabled) {
    return <div aria-disabled="true">{CardBody}</div>;
  }

  return external ? (
    <a href={lab.path} target="_blank" rel="noreferrer">
      {CardBody}
    </a>
  ) : (
    <Link href={lab.path} prefetch>
      {CardBody}
    </Link>
  );
}
