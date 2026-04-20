export default function TeamLoading() {
    return (
        <section className="max-w-[1180px] animate-pulse">
            <div className="mb-7 flex items-center justify-between gap-4">
                <div className="space-y-3">
                    <div className="h-8 w-28 rounded bg-[#e8e2d8]" />
                    <div className="h-4 w-72 rounded bg-[#efe8de]" />
                </div>
                <div className="h-12 w-36 rounded-md bg-[#ecd8b8]" />
            </div>

            <div className="overflow-hidden rounded-[28px] border border-[#e4ddd3] bg-[#f9f7f3]">
                <div className="h-[64px] border-b border-[#ebe5db] bg-[#f1eee8]" />
                <div className="space-y-0">
                    {Array.from({ length: 4 }).map((_, index) => (
                        <div
                            key={`team-row-skeleton-${index}`}
                            className="grid grid-cols-[16%_36%_16%_18%_14%] border-b border-[#ebe5db] px-8 py-8"
                        >
                            <div className="h-4 w-20 rounded bg-[#e7dfd3]" />
                            <div className="space-y-2">
                                <div className="h-4 w-44 rounded bg-[#e9e2d7]" />
                                <div className="h-3 w-56 rounded bg-[#efe8de]" />
                            </div>
                            <div className="h-6 w-24 rounded-full bg-[#e8e2d7]" />
                            <div className="h-4 w-36 rounded bg-[#ebe4d9]" />
                            <div className="h-4 w-16 rounded bg-[#e7dfd3]" />
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
