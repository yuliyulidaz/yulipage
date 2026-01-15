
// Mobile Layer 2 Menus (Font, Theme, Highlight, Color)
// Style: Transparent Glassmorphism Pills

// Shared Glass Container Wrapper
const GlassContainer = ({ children, className = "" }) => (
    <div className={`bg-white/30 backdrop-blur-md border border-white/40 shadow-lg rounded-2xl p-2 min-w-[200px] ${className}`}>
        {children}
    </div>
);

// [REDESIGNED] Font Menu: Floating Rounded Squares, Full List
const FontMenu = ({ activeFont, setActiveFont }) => {
    // Full PC Font List (Updated Sequence & Labels)
    const fonts = [
        { id: 'noto', label: '본문\n명조', family: 'Noto Serif KR' },
        { id: 'nanum', label: '나눔\n명조', family: 'Nanum Myeongjo' },
        { id: 'jeju', label: '제주\n명조', family: 'Jeju Myeongjo' },
        { id: 'gowun', label: '고운\n바탕', family: 'Gowun Batang' },

        { id: 'maru', label: '마루\n부리', family: 'MaruBuri' },
        { id: 'hahmlet', label: '함렛', family: 'Hahmlet' },
        { id: 'diphylleia', label: '산수국', family: 'Diphylleia' }
    ];

    return (
        <div className="flex flex-col items-center gap-1.5 w-full">
            <div className="flex gap-2.5 px-4 py-1 justify-start overflow-x-auto no-scrollbar w-full max-w-sm mx-auto">
                {fonts.map(font => {
                    const isSelected = activeFont === font.id;
                    return (
                        <button
                            key={font.id}
                            onClick={(e) => { e.stopPropagation(); setActiveFont(font.id); }}
                            className={`flex-shrink-0 w-10 h-10 rounded-xl shadow-sm border transition-all flex items-center justify-center p-0.5
                                ${isSelected
                                    ? 'bg-slate-900 border-slate-900 text-white shadow-md scale-105'
                                    : 'bg-white border-white/60 text-slate-700 hover:bg-white/90'
                                }`}
                        >
                            <span
                                className="text-[9px] font-medium leading-tight text-center whitespace-pre-line"
                                style={{ fontFamily: font.family }}
                            >
                                {font.label}
                            </span>
                        </button>
                    );
                })}
            </div>

            {/* Instruction Pill */}
            <div className="px-3 py-1 rounded-full bg-white/80 backdrop-blur-sm shadow-sm border border-white/40 mt-1">
                <span className="text-[10px] text-slate-500 font-medium leading-none block pt-px">폰트를 먼저 고른 후에 형광펜 / 글자색을 사용하세요</span>
            </div>
        </div>
    );
};

// Theme Menu: Floating Circles
const ThemeMenu = ({ activeTheme, setActiveTheme }) => {
    const themes = [
        { id: 'white', bg: '#ffffff', label: 'White' },
        { id: 'cream', bg: '#fdfbf7', label: 'Cream' },
        { id: 'kraft', bg: '#e6dac3', label: 'Kraft' },
        { id: 'dark', bg: '#1a1a1a', label: 'Dark' }
    ];
    return (
        <div className="flex flex-col items-center gap-1.5">
            <div className="flex gap-3 px-2 py-1 justify-center">
                {themes.map(theme => {
                    const isSelected = activeTheme === theme.id;
                    return (
                        <button
                            key={theme.id}
                            onClick={(e) => { e.stopPropagation(); setActiveTheme(theme.id); }}
                            className={`w-8 h-8 rounded-full border border-black/10 shadow-md transition-transform flex items-center justify-center 
                                ${isSelected
                                    ? 'scale-110 ring-2 ring-offset-1 ring-slate-300'
                                    : 'hover:scale-110 active:scale-95'
                                }`}
                            style={{ backgroundColor: theme.bg }}
                            title={theme.label}
                        />
                    )
                })}
            </div>
        </div>
    );
};

const HighlightMenu = ({ onHighlight, activeHighlight }) => {
    const highlights = [
        { id: 'highlight-yellow', color: '#ffecb3' },
        { id: 'highlight-pink', color: '#ffcdd2' },
        { id: 'highlight-mint', color: '#b9f6ca' },
        { id: 'highlight-blue', color: '#b3e5fc' },
        { id: 'highlight-lavender', color: '#e1bee7' },
        { id: 'highlight-apricot', color: '#ffccbc' }
    ];

    return (
        <div className="flex flex-col items-center gap-1.5">

            {/* Floating Color Circles */}
            <div className="flex gap-3 px-2 py-1 justify-center">
                {highlights.map(hl => {
                    const isSelected = activeHighlight === hl.id;
                    return (
                        <button
                            key={hl.id}
                            onClick={(e) => { e.stopPropagation(); onHighlight(hl.id); }}
                            className={`w-8 h-8 rounded-full shadow-md transition-transform flex items-center justify-center 
                                ${isSelected
                                    ? 'scale-110 ring-2 ring-offset-1 ring-slate-300'
                                    : 'hover:scale-110 active:scale-95'
                                }`}
                            style={{ backgroundColor: hl.color }}
                        />
                    );
                })}
            </div>

            {/* Instruction Pill */}
            <div className="px-3 py-1 rounded-full bg-white/80 backdrop-blur-sm shadow-sm border border-white/40">
                <span className="text-[10px] text-slate-500 font-medium leading-none block pt-px">드래그하여 적용, 터치하여 삭제</span>
            </div>
        </div>
    );
};

const ColorMenu = ({ onColor, activeColor }) => {
    // 12 Colors from CSS
    const colors = [
        { id: 'text-crimson', color: '#be123c' },
        { id: 'text-terracotta', color: '#c2410c' },
        { id: 'text-mustard', color: '#ca8a04' },
        { id: 'text-brown', color: '#78350f' },
        { id: 'text-cocoa', color: '#8d6e63' },
        { id: 'text-olive', color: '#65a30d' },
        { id: 'text-forest', color: '#15803d' },
        { id: 'text-teal', color: '#0f766e' },
        { id: 'text-navy', color: '#1e3a8a' },
        { id: 'text-midnight', color: '#1e1b4b' },
        { id: 'text-purple', color: '#6b21a8' },
        { id: 'text-lightgray', color: '#a1a1aa' },
    ];

    return (
        <div className="flex flex-col items-center gap-1.5 w-full">
            {/* Scrollable Floating Colors (Full 12) */}
            <div className="flex gap-3 px-4 py-1 justify-start overflow-x-auto no-scrollbar w-full max-w-sm mx-auto">
                {colors.map(col => {
                    const isSelected = activeColor === col.id;
                    return (
                        <button
                            key={col.id}
                            onClick={(e) => { e.stopPropagation(); onColor(col.id); }}
                            className={`flex-shrink-0 w-8 h-8 rounded-full border border-white/50 shadow-md transition-transform flex items-center justify-center
                                ${isSelected
                                    ? 'scale-110 ring-2 ring-offset-1 ring-slate-300'
                                    : 'hover:scale-105 active:scale-95'
                                }`}
                            style={{ backgroundColor: col.color }}
                        />
                    );
                })}
            </div>

            {/* Instruction Pill */}
            <div className="px-3 py-1 rounded-full bg-white/80 backdrop-blur-sm shadow-sm border border-white/40">
                <span className="text-[10px] text-slate-500 font-medium leading-none block pt-px">드래그하여 적용, 터치하여 삭제</span>
            </div>
        </div>
    );
};

// [NEW] Mockup Menu: Flyleaf Edit Buttons
const MockupMenu = ({ onEditFlyleaf, pagesLength }) => {
    // Show back flyleaf button only if pages are odd (meaning back cover is available)
    const showBackFlyleaf = pagesLength % 2 === 0;

    return (
        <div className="flex gap-3 px-4 py-1 justify-center w-full">
            <button
                onClick={(e) => { e.stopPropagation(); onEditFlyleaf('front'); }}
                className="flex-1 py-3 bg-white hover:bg-white/90 text-slate-700 text-xs font-bold rounded-xl shadow-md border border-white/50 transition-transform active:scale-95"
            >
                앞 표지 문구 작성
            </button>
            {showBackFlyleaf && (
                <button
                    onClick={(e) => { e.stopPropagation(); onEditFlyleaf('back'); }}
                    className="flex-1 py-3 bg-white hover:bg-white/90 text-slate-700 text-xs font-bold rounded-xl shadow-md border border-white/50 transition-transform active:scale-95"
                >
                    뒷 표지 문구 작성
                </button>
            )}
        </div>
    );
};

window.MobileMenus = ({ activeTab, activeFont, setActiveFont, activeTheme, setActiveTheme, onHighlight, activeHighlight, onColor, activeColor, onEditFlyleaf, pagesLength }) => {
    const isMenuVisible = ['style', 'theme', 'highlight', 'text', 'mockup'].includes(activeTab);

    return (
        <div className={`fixed bottom-[4.5rem] left-0 right-0 z-40 px-4 pb-safe pointer-events-none layer2-container ${isMenuVisible ? 'layer2-visible' : 'layer2-hidden'}`}>
            <div className="max-w-lg mx-auto pointer-events-auto flex flex-col items-center">
                {activeTab === 'style' && <FontMenu activeFont={activeFont} setActiveFont={setActiveFont} />}
                {activeTab === 'theme' && <ThemeMenu activeTheme={activeTheme} setActiveTheme={setActiveTheme} />}
                {activeTab === 'highlight' && <HighlightMenu onHighlight={onHighlight} activeHighlight={activeHighlight} />}
                {activeTab === 'text' && <ColorMenu onColor={onColor} activeColor={activeColor} />}
                {activeTab === 'mockup' && <MockupMenu onEditFlyleaf={onEditFlyleaf} pagesLength={pagesLength} />}
            </div>
        </div>
    );
};
