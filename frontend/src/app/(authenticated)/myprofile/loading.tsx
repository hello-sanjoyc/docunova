export default function MyProfileLoading() {
    return (
        <section className="max-w-[1180px] space-y-8 pb-8 animate-pulse">
            <div className="space-y-3">
                <div className="h-14 w-[420px] max-w-full rounded bg-[#e9e3d9]" />
                <div className="h-5 w-[380px] max-w-full rounded bg-[#eee8de]" />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                <div className="xl:col-span-8 rounded-2xl border border-[#e9e3db] bg-[#f8f6f2] p-8">
                    <div className="h-10 w-72 rounded bg-[#e8e2d8] mb-7" />
                    <div className="grid grid-cols-1 md:grid-cols-[180px_1fr] gap-7">
                        <div>
                            <div className="w-[160px] h-[160px] rounded-3xl bg-[#e8e1d7]" />
                            <div className="h-4 w-[120px] rounded bg-[#ece5db] mt-4" />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-y-8 gap-x-12">
                            {Array.from({ length: 4 }).map((_, index) => (
                                <div key={`personal-${index}`} className="space-y-2">
                                    <div className="h-3 w-24 rounded bg-[#ebe5da]" />
                                    <div className="h-4 w-36 rounded bg-[#e5ddd1]" />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="xl:col-span-4 rounded-2xl border border-[#e3ddd4] bg-[#f2eee7] p-8">
                    <div className="h-10 w-44 rounded bg-[#e8e2d7] mb-8" />
                    <div className="space-y-7">
                        {Array.from({ length: 3 }).map((_, index) => (
                            <div key={`notify-${index}`} className="h-12 rounded bg-[#eae3d8]" />
                        ))}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                <div className="xl:col-span-4 rounded-2xl border border-[#e3ddd4] bg-[#f2eee7] p-8">
                    <div className="h-10 w-36 rounded bg-[#e8e2d7] mb-8" />
                    <div className="space-y-4">
                        {Array.from({ length: 3 }).map((_, index) => (
                            <div key={`security-${index}`} className="h-16 rounded-xl bg-[#ebe5da]" />
                        ))}
                    </div>
                </div>
                <div className="xl:col-span-8 rounded-2xl border border-[#e9e3db] bg-[#f8f6f2] p-8">
                    <div className="h-10 w-52 rounded bg-[#e8e2d7] mb-8" />
                    <div className="space-y-4">
                        {Array.from({ length: 3 }).map((_, index) => (
                            <div key={`session-${index}`} className="h-16 rounded bg-[#ede7dd]" />
                        ))}
                    </div>
                </div>
            </div>

            <div className="rounded-2xl border border-[#efc8c2] bg-[#fbf1ef] px-8 py-7">
                <div className="h-10 w-80 rounded bg-[#f2dbd7]" />
                <div className="h-4 w-[460px] max-w-full rounded bg-[#f5e1de] mt-4" />
            </div>
        </section>
    );
}
