export default function PaymentHistoryLoading() {
    return (
        <section className="max-w-[1180px] animate-pulse">
            <header className="mb-8 space-y-3">
                <div className="h-10 w-72 max-w-full rounded bg-[#e9e3d9]" />
                <div className="h-5 w-64 max-w-full rounded bg-[#eee8de]" />
            </header>

            <div className="mb-6 rounded-xl border border-[#e1dbd1] bg-[#f8f5ef] p-4">
                <div className="flex flex-wrap items-end gap-4">
                    <div className="space-y-2">
                        <div className="h-3 w-24 rounded bg-[#ddd6cb]" />
                        <div className="h-9 w-36 rounded-md bg-white" />
                    </div>
                    <div className="space-y-2">
                        <div className="h-3 w-12 rounded bg-[#ddd6cb]" />
                        <div className="h-9 w-36 rounded-md bg-white" />
                    </div>
                    <div className="space-y-2">
                        <div className="h-3 w-10 rounded bg-[#ddd6cb]" />
                        <div className="h-9 w-36 rounded-md bg-white" />
                    </div>
                    <div className="h-9 w-20 rounded-md bg-[#d8d1c7]" />
                </div>
            </div>

            <div className="overflow-hidden rounded-xl border border-[#e1dbd1] bg-white">
                <div className="overflow-x-auto">
                    <div className="min-w-[980px]">
                        <div className="grid grid-cols-[1.05fr_0.9fr_0.75fr_0.8fr_1fr_1fr_0.7fr] gap-5 border-b border-[#e1dbd1] bg-[#f8f5ef] px-5 py-3">
                            {Array.from({ length: 7 }).map((_, index) => (
                                <div
                                    key={`payment-heading-${index}`}
                                    className="h-3 w-20 rounded bg-[#ddd6cb]"
                                />
                            ))}
                        </div>

                        <div className="divide-y divide-[#f0ece6]">
                            {Array.from({ length: 6 }).map((_, index) => (
                                <div
                                    key={`payment-row-${index}`}
                                    className="grid grid-cols-[1.05fr_0.9fr_0.75fr_0.8fr_1fr_1fr_0.7fr] items-center gap-5 px-5 py-4"
                                >
                                    <div className="h-4 w-32 rounded bg-[#eae3d8]" />
                                    <div className="space-y-2">
                                        <div className="h-4 w-28 rounded bg-[#e9e2d7]" />
                                        <div className="h-3 w-16 rounded bg-[#efe8de]" />
                                    </div>
                                    <div className="h-4 w-20 rounded bg-[#eee7dc]" />
                                    <div className="space-y-2">
                                        <div className="h-4 w-16 rounded bg-[#eae3d8]" />
                                        <div className="h-3 w-20 rounded bg-[#efe8de]" />
                                    </div>
                                    <div className="h-4 w-28 rounded bg-[#eee7dc]" />
                                    <div className="h-4 w-28 rounded bg-[#eee7dc]" />
                                    <div className="h-6 w-20 rounded-full bg-[#e8e2d7]" />
                                </div>
                            ))}
                        </div>

                        <div className="flex items-center justify-between border-t border-[#ebe5db] bg-[#f3f0ea] px-8 py-4">
                            <div className="h-4 w-40 rounded bg-[#e1d9cd]" />
                            <div className="flex items-center gap-3">
                                <div className="h-4 w-16 rounded bg-[#e1d9cd]" />
                                <div className="h-9 w-9 rounded bg-[#d0a260]" />
                                <div className="h-4 w-10 rounded bg-[#e1d9cd]" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
