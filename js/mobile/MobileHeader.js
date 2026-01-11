
// Mobile Header Component
// Features: Back button, Page Indicator, Save Button (Single Page)
window.MobileHeader = ({
    activeTab,
    mockupSpreadIdx,
    spreadsLength,
    currentPageIdx,
    pagesLength,
    onBack,
    onSave
}) => {
    return (
        <div className="fixed top-0 left-0 right-0 z-50 px-4 py-4 pt-safe flex items-center justify-between pointer-events-none">
            {/* Left: Back Button */}
            <div className="pointer-events-auto">
                <button onClick={onBack} className="glass-btn">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
                </button>
            </div>

            {/* Center: Page Indicator */}
            <div className="absolute left-1/2 transform -translate-x-1/2 pointer-events-auto pt-safe">
                <div className="glass-pill font-serif tabular-nums text-slate-700">
                    {activeTab === 'mockup'
                        ? `${mockupSpreadIdx + 1} / ${spreadsLength}`
                        : `${currentPageIdx + 1} / ${pagesLength}`
                    }
                </div>
            </div>

            {/* Right: Save Button */}
            <div className="flex gap-3 pointer-events-auto">
                <button onClick={onSave} className="glass-btn" title="현재 페이지 저장">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                </button>
            </div>
        </div>
    );
};
