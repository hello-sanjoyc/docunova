function BillingPlanCardSkeleton({ index }: { index: number }) {
    return (
        <article
            className={`relative flex min-h-[560px] flex-col rounded-2xl border bg-cream p-6 ${
                index === 1 ? "border-amber shadow-sm" : "border-border"
            }`}
        >
            {index === 1 && (
                <div className="absolute -top-3 left-1/2 h-6 w-24 -translate-x-1/2 rounded-full bg-[#ddb36d]" />
            )}

            <div className="h-3 w-24 rounded bg-[#ddd6cb]" />
            <div className="mt-5 h-10 w-36 rounded bg-[#e8e2d8]" />
            <div className="mt-4 space-y-2">
                <div className="h-4 w-full rounded bg-[#eee8de]" />
                <div className="h-4 w-4/5 rounded bg-[#eee8de]" />
            </div>

            <div className="mt-6 space-y-3 rounded-md border border-border bg-parchment p-4">
                <div className="h-4 w-40 rounded bg-[#e5ddd1]" />
                <div className="h-4 w-52 rounded bg-[#eee8de]" />
                <div className="h-4 w-44 rounded bg-[#eee8de]" />
                <div className="h-4 w-48 rounded bg-[#eee8de]" />
            </div>

            <div className="my-6 flex-1 space-y-4">
                {Array.from({ length: 6 }).map((_, featureIndex) => (
                    <div
                        key={`billing-feature-skeleton-${index}-${featureIndex}`}
                        className="flex items-start gap-2.5"
                    >
                        <div className="mt-0.5 h-4 w-4 rounded bg-[#e3dbcf]" />
                        <div className="h-4 w-4/5 rounded bg-[#eee8de]" />
                    </div>
                ))}
            </div>

            <div className="mt-auto h-11 w-full rounded-full bg-[#e0d6c8]" />
        </article>
    );
}

export default function BillingLoading() {
    return (
        <section className="max-w-[1180px] animate-pulse">
            <header className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                <div className="space-y-3">
                    <div className="h-10 w-64 rounded bg-[#e9e3d9]" />
                    <div className="h-5 w-80 max-w-full rounded bg-[#eee8de]" />
                </div>
                <div className="h-10 w-48 rounded-full bg-[#e6dfd5]" />
            </header>

            <div className="mb-6 rounded-xl border border-[#e1dbd1] bg-[#f8f5ef] p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="space-y-3">
                        <div className="h-3 w-28 rounded bg-[#ddd6cb]" />
                        <div className="h-9 w-44 rounded bg-[#e8e2d8]" />
                        <div className="h-4 w-80 max-w-full rounded bg-[#eee8de]" />
                    </div>
                    <div className="h-11 w-40 rounded-md border border-[#ead7d3] bg-[#fff8f6]" />
                </div>
            </div>

            <div className="grid gap-5 md:grid-cols-3">
                {Array.from({ length: 3 }).map((_, index) => (
                    <BillingPlanCardSkeleton
                        key={`billing-loading-${index}`}
                        index={index}
                    />
                ))}
            </div>
        </section>
    );
}
