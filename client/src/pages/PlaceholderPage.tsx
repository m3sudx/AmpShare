interface PlaceholderPageProps {
  title: string;
  description: string;
}

export default function PlaceholderPage({
  title,
  description,
}: PlaceholderPageProps) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-[#0F9468]">
        AmpShare
      </p>

      <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
        {title}
      </h1>

      <p className="mt-3 max-w-2xl text-slate-600">
        {description}
      </p>
    </section>
  );
}