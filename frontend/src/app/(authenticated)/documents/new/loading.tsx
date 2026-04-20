export default function NewDocumentLoading() {
    return (
        <section className="max-w-[1180px] animate-pulse">
            <header className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-3">
                    <div className="h-10 w-64 rounded bg-[#e9e3d9]" />
                    <div className="h-5 w-96 max-w-full rounded bg-[#eee8de]" />
                </div>
                <div className="h-12 w-40 rounded-md border border-[#e3ddd3] bg-[#f3efe8]" />
            </header>

            <section className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_1fr]">
                <div>
                    <div className="min-h-[360px] rounded-3xl border border-dashed border-[#dad2c7] bg-[#f7f4ef] p-10">
                        <div className="mx-auto h-14 w-14 rounded-2xl bg-[#efe4d2]" />
                        <div className="mx-auto mt-6 h-8 w-64 rounded bg-[#e8e2d7]" />
                        <div className="mx-auto mt-3 h-4 w-52 rounded bg-[#efe8de]" />
                        <div className="mx-auto mt-6 h-11 w-36 rounded-full bg-[#ddd7cf]" />
                    </div>
                    <div className="mt-5 flex flex-wrap items-center gap-2">
                        <div className="h-4 w-20 rounded bg-[#eee8de]" />
                        {Array.from({ length: 5 }).map((_, index) => (
                            <div
                                key={`type-${index}`}
                                className="h-7 w-24 rounded-full border border-[#ddd5ca] bg-[#f7f4ef]"
                            />
                        ))}
                    </div>
                </div>

                <article className="min-h-[540px] overflow-hidden rounded-[28px] border border-[#e1dbd1] bg-[#f8f6f2] p-6">
                    <div className="h-6 w-56 rounded bg-[#e8e2d7]" />
                    <div className="mt-3 h-4 w-36 rounded bg-[#efe8de]" />
                    <div className="mt-6 flex gap-3">
                        <div className="h-9 w-28 rounded bg-[#ece4d8]" />
                        <div className="h-9 w-36 rounded bg-[#ece4d8]" />
                    </div>
                    <div className="mt-6 h-56 rounded-xl bg-[#ede7dd]" />
                    <div className="mt-6 space-y-3">
                        {Array.from({ length: 4 }).map((_, index) => (
                            <div
                                key={`summary-line-${index}`}
                                className="h-4 w-full rounded bg-[#eee8de]"
                            />
                        ))}
                    </div>
                </article>
            </section>
        </section>
    );
}
