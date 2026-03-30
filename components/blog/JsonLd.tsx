// JSON-LD structured data component for SEO
// Only receives static hardcoded data objects — safe to render as script content
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  const jsonString = JSON.stringify(data);
  return (
    <script type="application/ld+json" suppressHydrationWarning>
      {jsonString}
    </script>
  );
}
