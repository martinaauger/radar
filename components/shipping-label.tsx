export function ShippingLabel() {
  return (
    <article className="label-sheet mx-auto w-full max-w-[170mm] border-2 border-dashed border-neutral-900 bg-white px-8 py-7 text-neutral-900">
      <section className="border-b border-neutral-200 pb-6">
        <p className="text-sm font-medium text-neutral-500">Destinatario</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Pablo Villaamil</h1>
        <p className="mt-2 text-xl tabular-nums">11 3763-1388</p>
        <p className="mt-4 text-lg leading-relaxed">
          Sucursal Villa Urquiza
          <br />
          Av. Congreso 5299
          <br />
          Villa Urquiza, CABA
        </p>
        <p className="mt-3 text-sm font-medium text-neutral-500">Código postal</p>
        <p className="mt-1 text-lg tabular-nums">C1431AAH</p>
        <p className="mt-3 text-lg text-neutral-600">Retiro en sucursal · 11 3925-2570</p>
      </section>

      <section className="pt-6">
        <p className="text-sm font-medium text-neutral-500">Remitente</p>
        <p className="mt-2 text-3xl font-semibold tracking-tight">Yohana Gonzalez</p>
        <p className="mt-2 text-xl tabular-nums">54 9 3516 08-5725</p>
      </section>
    </article>
  );
}
