import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { galleryItems } from "@/data/gallery";
import { resolveGalleryImage } from "@/app/api/gallery/image-service";

type PageProps = {
  params: Promise<{ id: string }>;
};

async function resolveParams(params: PageProps["params"]) {
  return params instanceof Promise ? params : Promise.resolve(params);
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await resolveParams(params);
  const entry = galleryItems.find((item) => item.id === id);
  if (!entry) {
    return {
      title: "Gallery | Leonobitech",
    };
  }
  const coverImage = await resolveGalleryImage(entry);
  return {
    title: `${entry.title} | Leonobitech Gallery`,
    description: entry.summary,
    openGraph: {
      title: entry.title,
      description: entry.summary,
      images: [
        {
          url: coverImage,
          width: 1200,
          height: 630,
        },
      ],
    },
  };
}

export async function generateStaticParams() {
  return galleryItems.map((item) => ({ id: item.id }));
}

export default async function GalleryEntryPage({ params }: PageProps) {
  const { id } = await resolveParams(params);
  const entry = galleryItems.find((item) => item.id === id);

  if (!entry) {
    notFound();
  }
  const coverImage = await resolveGalleryImage(entry);

  return (
    <div className="container mx-auto px-4 py-10 space-y-8">
      <div className="grid gap-8 lg:grid-cols-[2fr,1fr]">
        <div>
          <div className="relative h-80 w-full overflow-hidden rounded-2xl border border-white/10 bg-muted/40">
            <Image
              src={coverImage || "/placeholder.svg"}
              alt={entry.title}
              fill
              sizes="(max-width: 1024px) 100vw, 672px"
              className="object-cover"
              priority
            />
          </div>
          <div className="mt-6 space-y-6">
            <div>
              <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-medium uppercase tracking-wide text-primary">
                {entry.category}
              </span>
              <h1 className="mt-4 text-3xl font-bold tracking-tight">
                {entry.title}
              </h1>
              <p className="mt-3 text-base text-muted-foreground">
                {entry.summary}
              </p>
            </div>
            <div>
              <h2 className="text-lg font-semibold">Highlights</h2>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                {entry.highlights.map((highlight) => (
                  <li key={highlight} className="list-disc list-inside">
                    {highlight}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
        <aside className="space-y-6">
          <div className="rounded-xl border border-border bg-background/60 p-6 shadow-sm backdrop-blur">
            <h2 className="text-lg font-semibold">Quick facts</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">SDK</dt>
                <dd className="font-medium">{entry.sdk}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">Tags</dt>
                <dd className="font-medium">
                  {entry.tags.map((tag) => `#${tag}`).join(" · ")}
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">Likes</dt>
                <dd className="font-medium">{entry.likes.toLocaleString()}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">Comentarios</dt>
                <dd className="font-medium">{entry.comments}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">Publicado</dt>
                <dd className="font-medium">
                  {new Date(entry.publishedAt).toLocaleDateString("es-ES", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </dd>
              </div>
            </dl>
          </div>
          <div className="grid gap-3">
            <Link
              href={entry.link}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center rounded-lg bg-linear-to-r from-indigo-950 to-blue-500 px-4 py-2 text-sm font-semibold text-white shadow-md transition hover:from-blue-600 hover:to-indigo-600"
            >
              Ver en LinkedIn
            </Link>
            {entry.repository && (
              <Link
                href={entry.repository}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center rounded-lg border border-border px-4 py-2 text-sm font-semibold transition hover:border-blue-500 hover:text-blue-500"
              >
                Abrir repositorio
              </Link>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
