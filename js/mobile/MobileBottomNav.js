
// Mobile Bottom Navigation Component (Layer 1)
// Redesigned: Bottom Sheet Style (Rounded Top, Fixed Bottom), Text Only, Serif Font
window.MobileBottomNav = ({ activeTab, onTabChange }) => {
    // Text-only tabs
    const tabs = [
        { id: 'style', label: '서체' },
        { id: 'theme', label: '배경' },
        { id: 'highlight', label: '형광펜' },
        { id: 'text', label: '글자색' },
        { id: 'mockup', label: '목업' }
    ];

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 pointer-events-none flex justify-center">
            {/* Sheet Container: Fixed Bottom, Rounded Top Corners only */}
            <div className="w-full bg-white/95 backdrop-blur-md shadow-[0_-5px_20px_rgba(0,0,0,0.05)] rounded-t-[28px] pb-safe pointer-events-auto border-t border-white/20">
                <div className="flex items-center justify-around h-[60px] px-2">
                    {tabs.map(tab => {
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => onTabChange(tab.id === activeTab ? null : tab.id)}
                                className={`
                                    relative flex-1 h-full flex items-center justify-center transition-all duration-300
                                    font-serif text-[15px] tracking-tight
                                    ${isActive ? 'text-slate-800 font-medium' : 'text-slate-400 hover:text-slate-600 font-light'}
                                `}
                                style={{
                                    fontFamily: '"Noto Serif KR", serif'
                                }}
                            >
                                <span>{tab.label}</span>
                                {/* Active Indicator (Small dot below text) */}
                                {isActive && (
                                    <div className="absolute inset-x-0 bottom-3 flex justify-center">
                                        <div className="w-1 h-1 bg-slate-800 rounded-full" />
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};
