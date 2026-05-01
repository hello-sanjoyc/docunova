export default function BillingLoading() {
    return (
        <section className="max-w-[1180px] animate-pulse">
            <div className="mb-8 h-20 max-w-xl rounded bg-[#e9e3d9]" />
            <div className="mb-6 h-28 rounded-xl border border-[#e1dbd1] bg-[#f8f5ef]" />
            <div className="grid gap-5 md:grid-cols-3">
                {Array.from({ length: 3 }).map((_, index) => (
                    <div
                        key={`billing-loading-${index}`}
                        className="h-[560px] rounded-lg border border-border bg-cream"
                    />
                ))}
            </div>
        </section>
    );
}
