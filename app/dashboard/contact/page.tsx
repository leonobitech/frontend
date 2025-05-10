export default function ContactPage() {
  return (
    <section className="space-y-6">
      <h1 className="text-2xl font-bold">contact</h1>
      <p>Esta es la pantalla de Contact.</p>

      <div className="grid gap-3">
        {[...Array(10)].map((_, i) => (
          <div key={i} className="rounded-md border p-4 bg-card shadow-sm">
            🔍 Resultado #{i + 1}
          </div>
        ))}
      </div>
    </section>
  );
}
