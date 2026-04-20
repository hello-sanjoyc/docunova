export default function RecentActivitiesLoading() {
    return (
        <section className="max-w-[1180px] animate-pulse">
            <header className="mb-10 flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-3">
                    <div className="h-10 w-72 rounded bg-[#e9e3d9]" />
                    <div className="h-5 w-96 max-w-full rounded bg-[#eee8de]" />
                </div>
                <div className="h-12 w-44 rounded-md border border-[#e3ddd3] bg-[#f3efe8]" />
            </header>

            <section className="mb-8 grid grid-cols-1 gap-5 lg:grid-cols-3">
                {Array.from({ length: 2 }).map((_, index) => (
                    <article
                        key={`activity-summary-${index}`}
                        className="min-h-[140px] rounded-[24px] border border-[#e1dbd1] bg-[#f8f5ef] p-5"
                    >
                        <div className="h-8 w-36 rounded bg-[#e8e2d8]" />
                        <div className="mt-8 h-12 w-24 rounded bg-[#ece4d8]" />
                        <div className="mt-4 h-3 w-44 rounded bg-[#eee8de]" />
                    </article>
                ))}
            </section>

            <div className="overflow-hidden rounded-2xl border border-[#e4ddd3] bg-[#f9f7f3]">
                <div className="overflow-x-auto">
                    <div className="min-w-[760px]">
                        <div className="grid grid-cols-[1fr_2fr_1fr_1.2fr_1fr] bg-[#f1eee8] px-8 py-4">
                            {Array.from({ length: 5 }).map((_, index) => (
                                <div
                                    key={`thead-${index}`}
                                    className="h-3 w-20 rounded bg-[#ddd6cb]"
                                />
                            ))}
                        </div>
                        <div className="space-y-3 px-8 py-5">
                            {Array.from({ length: 6 }).map((_, index) => (
                                <div
                                    key={`activity-row-${index}`}
                                    className="grid grid-cols-[1fr_2fr_1fr_1.2fr_1fr] items-center py-3"
                                >
                                    <div className="h-4 w-20 rounded bg-[#e7dfd3]" />
                                    <div className="space-y-2">
                                        <div className="h-4 w-[68%] rounded bg-[#eae3d8]" />
                                        <div className="h-3 w-[52%] rounded bg-[#eee8de]" />
                                    </div>
                                    <div className="h-6 w-20 rounded-full bg-[#ece4d8]" />
                                    <div className="h-4 w-28 rounded bg-[#eee7dc]" />
                                    <div className="h-4 w-16 rounded bg-[#e7dfd3]" />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
