
// Mobile Layout Component
// Replaces ResultView on Mobile Devices
// Orchestrates Header, Content (Scaled), Menus, and Bottom Nav

window.MobileLayout = (props) => {
    const {
        activeTab,
        onToggleTab,
        // Data
        pages,
        currentPageIdx,
        setCurrentPageIdx,
        spreads,
        mockupSpreadIdx,
        setMockupSpreadIdx,
        // Styles
        activeFont,
        setActiveFont, // Mapped from onFontChange in parent if needed, but direct setter is easier if available.
        // Wait, ResultView receives onFontChange. We might need to wrap it.
        // But App.js passes activeFont and setActiveFont to InputView. ResultView gets onFontChange.
        // Let's assume props passed from views.js are compatible or we use the ones available.
        // We will check props passed in views.js later. For now, destructure common ones.
        activeTheme,
        onThemeChange,
        // Colors
        highlightColor,
        setHighlightColor,
        textColor,
        setTextColor,
        // Handlers
        onBack,
        onDownloadCurrent,
        // Content Refs
        mobileContentRef,
        onContentClick,
        onMouseUp,
        // Metadata & Extras
        metadata,
        pageHighlights,
        pageSize = 'A6'
    } = props;

    // Get Paper Config
    const paperConfig = window.PAPER_SIZES[pageSize] || window.PAPER_SIZES['A6'];

    // Helper: Font change wrapper if setActiveFont not passed directly
    const handleFontChange = (fontId) => {
        if (props.setActiveFont) props.setActiveFont(fontId);
        else if (props.onFontChange) props.onFontChange(fontId);
    };

    const handleThemeChange = (themeId) => {
        if (props.setActiveTheme) props.setActiveTheme(themeId);
        else if (props.onThemeChange) props.onThemeChange(themeId);
    };

    console.log("MobileLayout Render:", { activeTab, pagesLen: pages ? pages.length : 0, currentPageIdx, isMockup: activeTab === 'mockup' });

    // Highlight Handler
    const handleHighlight = (color) => {
        setHighlightColor(color);
        // We also need to trigger tool mode in App possibly?
        // App.js uses toolMode. But Mobile design implies tapping color sets it.
        // If color === 'remove', maybe set toolMode to eraser or just handled by click?
        // In existing app, `setHighlightColor` updates state. The actual highlighting happens on selection.
        if (props.setToolMode) props.setToolMode(color === 'remove' ? 'eraser' : 'highlight');
    };

    const handleTextColor = (color) => {
        setTextColor(color === 'remove' ? 'black' : color); // Default to black if remove? Or remove color class?
        // 'remove' for text usually means resetting to default.
        if (props.setToolMode) props.setToolMode('text');
    };

    // Scale Logic
    const viewerRef = React.useRef(null);
    React.useEffect(() => {
        const handleResize = () => {
            if (viewerRef.current) {
                const screenWidth = window.innerWidth;
                // Base width 420px (from mob.html) + some margin
                // mob.html logic: scale = screenWidth / 460
                const scale = Math.min(1, screenWidth / 440);
                viewerRef.current.style.transform = `scale(${scale})`;
            }
        };
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [activeTab]); // Re-run on tab change (mockup vs normal)

    const isMockup = activeTab === 'mockup';

    return (
        <div className="flex flex-col h-screen bg-[#FDFBF7] overflow-hidden relative">
            {/* 1. Header (Fixed) */}
            <window.MobileHeader
                activeTab={activeTab}
                mockupSpreadIdx={mockupSpreadIdx}
                spreadsLength={spreads ? spreads.length : 0}
                currentPageIdx={currentPageIdx}
                pagesLength={pages.length}
                onBack={onBack}
                onSave={onDownloadCurrent}
            />

            {/* 2. Main Content (Centered & Scaled) */}
            <div className="flex-1 flex items-center justify-center overflow-hidden pb-20 pt-16">
                {isMockup ? (
                    // Mockup View
                    <div className="w-full flex items-center justify-center p-4">
                        {window.MockupBookRenderer && (
                            <window.MockupBookRenderer
                                spreadIdx={mockupSpreadIdx}
                                spreads={spreads}
                                activeTheme={activeTheme}
                                activeFont={activeFont}
                                frontFlyleafText={props.frontFlyleafText}
                                setFrontFlyleafText={props.setFrontFlyleafText}
                                backFlyleafText={props.backFlyleafText}
                                setBackFlyleafText={props.setBackFlyleafText}
                                pageHighlights={pageHighlights}
                                pages={pages}
                                metadata={metadata}
                                onEditFlyleaf={props.onEditFlyleaf}
                            />
                        )}
                    </div>
                ) : (
                    // Page Content View (Scaled)
                    <div id="bookViewerWrapper" ref={viewerRef} className="origin-top transition-transform duration-200">
                        <div

                            id="captureTarget"
                            className={`page-container theme-${activeTheme} ${paperConfig.className || ''} shadow-2xl`}
                            style={{
                                width: paperConfig.width,
                                height: paperConfig.height,
                                paddingTop: paperConfig.paddingTop,
                                paddingBottom: paperConfig.paddingBottom,
                                paddingLeft: paperConfig.paddingLeft,
                                paddingRight: paperConfig.paddingRight,
                                boxSizing: 'border-box',
                                fontFamily: window.FONT_MAP[activeFont] ? window.FONT_MAP[activeFont].family : 'serif'
                            }}
                            onClick={onContentClick}
                            onMouseUp={onMouseUp}
                            onTouchEnd={onMouseUp}
                        >
                            <window.PageContent
                                pageSize={pageSize}
                                pageIdx={currentPageIdx}
                                pages={pages}
                                pageHighlights={pageHighlights}
                                metadata={metadata}
                                activeFont={activeFont}
                                onMouseUp={onMouseUp}
                                onClick={onContentClick}
                                contentRef={mobileContentRef} // Redundant if ref attached to container, but PageContent uses it?
                            // check PageContent definition: it accepts contentRef?
                            />
                            <window.PageFooter pageIdx={currentPageIdx} metadata={metadata} />
                        </div>
                    </div>
                )}
            </div>

            {/* 3. Navigation Arrows (Floating) */}
            {!isMockup && currentPageIdx > 0 && (
                <button onClick={(e) => { e.stopPropagation(); setCurrentPageIdx(currentPageIdx - 1); }} className="fixed top-1/2 left-2 -translate-y-1/2 w-8 h-12 bg-white/20 backdrop-blur-sm border border-white/40 rounded-lg shadow-sm flex items-center justify-center text-slate-400 hover:text-slate-600 z-30">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                </button>
            )}
            {!isMockup && currentPageIdx < pages.length - 1 && (
                <button onClick={(e) => { e.stopPropagation(); setCurrentPageIdx(currentPageIdx + 1); }} className="fixed top-1/2 right-2 -translate-y-1/2 w-8 h-12 bg-white/20 backdrop-blur-sm border border-white/40 rounded-lg shadow-sm flex items-center justify-center text-slate-400 hover:text-slate-600 z-30">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                </button>
            )}
            {/* Mockup Arrows */}
            {isMockup && mockupSpreadIdx > 0 && (
                <button onClick={(e) => { e.stopPropagation(); setMockupSpreadIdx(mockupSpreadIdx - 1); }} className="fixed top-1/2 left-2 -translate-y-1/2 w-8 h-12 bg-white/20 backdrop-blur-sm border border-white/40 rounded-lg shadow-sm flex items-center justify-center text-slate-400 hover:text-slate-600 z-30">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                </button>
            )}
            {isMockup && spreads && mockupSpreadIdx < spreads.length - 1 && (
                <button onClick={(e) => { e.stopPropagation(); setMockupSpreadIdx(mockupSpreadIdx + 1); }} className="fixed top-1/2 right-2 -translate-y-1/2 w-8 h-12 bg-white/20 backdrop-blur-sm border border-white/40 rounded-lg shadow-sm flex items-center justify-center text-slate-400 hover:text-slate-600 z-30">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                </button>
            )}


            {/* 4. Layer Menus (Floating) */}
            <window.MobileMenus
                activeTab={activeTab}
                activeFont={activeFont}
                setActiveFont={handleFontChange}
                activeTheme={activeTheme}
                setActiveTheme={handleThemeChange}
                onHighlight={handleHighlight}
                activeHighlight={highlightColor}
                onColor={handleTextColor}
                activeColor={textColor}
            />

            {/* 5. Bottom Navigation (Fixed) */}
            <window.MobileBottomNav
                activeTab={activeTab}
                onTabChange={(tabId) => onToggleTab(tabId, tabId)} // Sync tab selection
            />
        </div>
    );
};
