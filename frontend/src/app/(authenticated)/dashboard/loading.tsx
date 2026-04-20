export default function DashboardLoading() {
    return (
        <section className="max-w-[1180px] animate-pulse">
            <header className="mb-7 space-y-3">
                <div className="h-14 w-[520px] max-w-full rounded bg-[#e9e3d9]" />
                <div className="h-5 w-[280px] max-w-full rounded bg-[#eee8de]" />
            </header>

            <div className="grid grid-cols-12 gap-4 mb-5">
                <div className="col-span-12 xl:col-span-4 rounded-xl border border-[#ece8e2] bg-[#f4f1eb] p-5 min-h-[250px]">
                    <div className="h-5 w-20 rounded bg-[#e4ddd2]" />
                    <div className="h-10 w-40 rounded bg-[#e8e1d7] mt-8" />
                    <div className="h-4 w-52 rounded bg-[#ece5da] mt-4" />
                    <div className="h-2 w-full rounded bg-[#e7e1d6] mt-14" />
                </div>

                <div className="col-span-12 xl:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Array.from({ length: 4 }).map((_, index) => (
                        <div
                            key={`quick-card-${index}`}
                            className="rounded-xl border border-[#ece8e2] bg-[#f4f1eb] p-5 min-h-[120px]"
                        >
                            <div className="h-5 w-5 rounded bg-[#e3dbcf]" />
                            <div className="h-9 w-40 rounded bg-[#e8e2d8] mt-5" />
                            <div className="h-4 w-32 rounded bg-[#ece5da] mt-3" />
                        </div>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-12 gap-4">
                <div className="col-span-12 xl:col-span-8 rounded-xl border border-[#ece8e2] bg-[#f9f7f3] p-5">
                    <div className="flex items-end justify-between mb-5">
                        <div className="space-y-2">
                            <div className="h-10 w-64 rounded bg-[#e8e2d7]" />
                            <div className="h-4 w-44 rounded bg-[#ece5da]" />
                        </div>
                        <div className="h-4 w-16 rounded bg-[#e8e1d6]" />
                    </div>
                    <div className="space-y-3">
                        {Array.from({ length: 4 }).map((_, index) => (
                            <div
                                key={`recent-doc-${index}`}
                                className="h-14 rounded-lg bg-[#f1ece4]"
                            />
                        ))}
                    </div>
                </div>

                <div className="col-span-12 xl:col-span-4 rounded-xl border border-[#ece8e2] bg-[#f6f4f0] p-5">
                    <div className="h-10 w-52 rounded bg-[#e8e2d7]" />
                    <div className="space-y-4 mt-6">
                        {Array.from({ length: 4 }).map((_, index) => (
                            <div
                                key={`activity-${index}`}
                                className="h-10 rounded bg-[#eee8df]"
                            />
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
