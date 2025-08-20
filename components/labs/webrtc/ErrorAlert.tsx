"use client";
import React from "react";

type Props = { error: string | null };

export default function ErrorAlert({ error }: Props) {
  if (!error) return null;
  return (
    <pre
      className="bg-red-950 text-red-100 p-3 rounded whitespace-pre-wrap"
      role="alert"
    >
      {error}
    </pre>
  );
}
