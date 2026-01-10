(function () {
    const { useState, useEffect, useRef, useCallback } = React;

    // ----------------------------------------------------------------------
    // 5. Main Application Component
    // ----------------------------------------------------------------------

    function App() {
        // -- State: Input --
        const [step, setStep] = useState('input');
        const [textInput, setTextInput] = useState('');
        const [metadata, setMetadata] = useState({ title: '', author: '', producer: '' });

        // -- State: Style & Theme --
        const [activeTheme, setActiveTheme] = useState('white');
        const [activeFont, setActiveFont] = useState('noto');

        // Safety: Reset font if invalid (e.g. removed from map)
        useEffect(() => {
            if (!window.FONT_MAP[activeFont]) {
                setActiveFont('noto');
            }
        }, [activeFont]);

        const [pageSize, setPageSize] = useState('A6');

        // -- State: UI/UX --
        const [activeTab, setActiveTab] = useState(null);
        const [renderedTab, setRenderedTab] = useState(null);
        const [isLayer2Visible, setIsLayer2Visible] = useState(false);
        const [toolMode, setToolMode] = useState(null);
        const [tipsShown, setTipsShown] = useState({ highlight: false, text: false });
        const [startTipVisible, setStartTipVisible] = useState(false);

        // -- State: Toasts & Alerts --
        const [toastVisible, setToastVisible] = useState(false);
        const [saveToast, setSaveToast] = useState(false);
        const [inputToast, setInputToast] = useState('');
        const [exitToast, setExitToast] = useState(false);
        const [memoAlert, setMemoAlert] = useState(null);
        const [showUndo, setShowUndo] = useState(false);
        const [undoData, setUndoData] = useState(null);

        // -- State: Data --
        const [pages, setPages] = useState([]);
        const [currentPageIdx, setCurrentPageIdx] = useState(0);
        const [pageHighlights, setPageHighlights] = useState({});
        const [estimatedPages, setEstimatedPages] = useState(0);

        // -- State: Mockup & Flyleaf --
        const [mockupSpreadIdx, setMockupSpreadIdx] = useState(0);
        const [frontFlyleafText, setFrontFlyleafText] = useState('');
        const [backFlyleafText, setBackFlyleafText] = useState('');
        const [focusedFlyleaf, setFocusedFlyleaf] = useState(null);

        // -- State: Loading --
        const [isGenerating, setIsGenerating] = useState(false);
        const [loadingMessage, setLoadingMessage] = useState('');
        const [loadingProgress, setLoadingProgress] = useState(0);

        // -- Refs --
        const measureContainerRef = useRef(null);
        const mobileContentRef = useRef(null);
        const desktopContentRef = useRef(null);
        const textAreaRef = useRef(null);

        // -- Helpers --
        const debouncedText = window.useDebounce(textInput, 500);

        // -- Safety: Ensure loading overlay is cleared on mount --
        useEffect(() => {
            setLoadingMessage('');
            setIsGenerating(false);
        }, []);

        // -- Logic: Auto-Save & Load --
        useEffect(() => {
            const savedData = localStorage.getItem(window.STORAGE_KEY);
            window.history.replaceState({ step: 'input' }, '');

            if (savedData) {
                setTimeout(() => {
                    window.history.pushState({ popup: 'draft' }, '');

                    setMemoAlert({
                        isDraft: true,
                        message: '작성 중인 내용이 있습니다.\n불러오시겠습니까?',
                        onConfirm: () => loadDraft(),
                        onCancel: () => { window.history.back(); },
                        position: 'center',
                        timestamp: Date.now()
                    });
                }, 200);
            }
        }, []);

        const loadDraft = () => {
            try {
                const savedData = JSON.parse(localStorage.getItem(window.STORAGE_KEY));
                if (savedData) {
                    setTextInput(savedData.textInput || '');
                    setMetadata(savedData.metadata || { title: '', author: '', producer: '' });
                    if (savedData.activeTheme) setActiveTheme(savedData.activeTheme);

                    // Validate Font (Fallback to noto if removed)
                    if (savedData.activeFont && window.FONT_MAP[savedData.activeFont]) {
                        setActiveFont(savedData.activeFont);
                    } else {
                        setActiveFont('noto');
                    }

                    if (savedData.pageSize) setPageSize(savedData.pageSize);
                    window.haptic.success();
                }
            } catch (e) {
                console.error("Failed to load draft", e);
            }
        };

        const clearDraft = () => {
            localStorage.removeItem(window.STORAGE_KEY);
            window.haptic.tap();
        };

        const handleDelete = () => {
            window.haptic.tap();
            const backup = { textInput, metadata, activeTheme, activeFont, pageSize };
            setUndoData(backup);
            localStorage.removeItem(window.STORAGE_KEY);
            setTextInput('');
            setMetadata({ title: '', author: '', producer: '' });
            setShowUndo(true);
            setTimeout(() => setShowUndo(false), 3000);
        };

        const handleUndo = () => {
            window.haptic.success();
            if (undoData) {
                setTextInput(undoData.textInput || '');
                setMetadata(undoData.metadata || { title: '', author: '', producer: '' });
                if (undoData.activeTheme) setActiveTheme(undoData.activeTheme);
                if (undoData.activeFont) setActiveFont(undoData.activeFont);
                if (undoData.pageSize) setPageSize(undoData.pageSize);
                setShowUndo(false);
            }
        };

        useEffect(() => {
            if (textInput || metadata.title || metadata.author || metadata.producer) {
                const dataToSave = { textInput, metadata, activeTheme, activeFont, pageSize, timestamp: Date.now() };
                localStorage.setItem(window.STORAGE_KEY, JSON.stringify(dataToSave));
            }
        }, [textInput, metadata, activeTheme, activeFont, pageSize]);

        useEffect(() => {
            let timer;
            if (saveToast) timer = setTimeout(() => setSaveToast(false), 3000);
            return () => clearTimeout(timer);
        }, [saveToast]);

        // -- Logic: Page Calculation --
        useEffect(() => {
            if (step === 'input' && debouncedText) {
                const p = window.calculatePages(debouncedText, activeFont, measureContainerRef.current, metadata, pageSize);
                setEstimatedPages(p.length);
            } else {
                setEstimatedPages(0);
            }
        }, [debouncedText, step, activeFont, metadata.title, pageSize]);

        // -- Logic: Back Button Handling --
        useEffect(() => {
            const handlePopState = (event) => {
                if (memoAlert && memoAlert.isDraft) {
                    setMemoAlert(null);
                    clearDraft();
                    return;
                }
                if (memoAlert && !memoAlert.isDraft) {
                    setMemoAlert(null);
                    return;
                }
                if (step === 'result') {
                    if (activeTab) {
                        window.history.pushState({ step: 'result' }, '');
                        toggleTab(activeTab, null);
                        return;
                    } else {
                        const container = mobileContentRef.current || desktopContentRef.current;
                        const hasDecorations = Object.values(pageHighlights).some(html => html.includes('data-group-id')) ||
                            (container && container.innerHTML.includes('data-group-id'));

                        if (hasDecorations) {
                            window.history.pushState({ step: 'result' }, '');
                            setMemoAlert({
                                message: '형광펜과 글자색이\n지워집니다.\n그래도 나가시겠어요?',
                                onConfirm: () => executeBackToEdit(),
                                onCancel: () => { },
                                position: 'mobile-bottom',
                                timestamp: Date.now()
                            });
                        } else {
                            executeBackToEdit();
                        }
                    }
                }
            };
            window.addEventListener('popstate', handlePopState);
            return () => window.removeEventListener('popstate', handlePopState);
        }, [step, activeTab, exitToast, memoAlert, pageHighlights]);

        // Helper to calculate spreads (Moved up for Effect usage)
        const getSpreads = useCallback(() => {
            const spreadList = [];
            spreadList.push({ left: { type: 'flyleaf-front' }, right: { type: 'page', index: 0 } });
            let i = 1;
            while (i < pages.length) {
                const left = { type: 'page', index: i };
                const right = (i + 1 < pages.length) ? { type: 'page', index: i + 1 } : null;
                if (!right) { spreadList.push({ left, right: { type: 'flyleaf-back' } }); }
                else { spreadList.push({ left, right }); }
                i += 2;
            }
            return spreadList;
        }, [pages.length]);

        const spreads = getSpreads();

        // Keyboard Navigation
        useEffect(() => {
            const handleKeyDown = (e) => {
                if (step !== 'result') return;

                // Allow normal keyboard usage if typing in an input (activeElement check is more robust)
                const tag = document.activeElement.tagName;
                if (tag === 'INPUT' || tag === 'TEXTAREA') return;

                if (e.key === 'ArrowLeft') {
                    if (activeTab === 'mockup') {
                        setMockupSpreadIdx(prev => Math.max(0, prev - 1));
                    } else {
                        setCurrentPageIdx(prev => Math.max(0, prev - 1));
                    }
                } else if (e.key === 'ArrowRight') {
                    if (activeTab === 'mockup') {
                        setMockupSpreadIdx(prev => Math.min(spreads.length - 1, prev + 1));
                    } else {
                        setCurrentPageIdx(prev => Math.min(pages.length - 1, prev + 1));
                    }
                }
            };

            window.addEventListener('keydown', handleKeyDown);
            return () => window.removeEventListener('keydown', handleKeyDown);
        }, [step, activeTab, spreads.length, pages.length]);

        // -- Effect: Load Active Font --
        useEffect(() => {
            const fontInfo = window.FONT_MAP[activeFont];
            if (fontInfo && fontInfo.url) {
                const existingId = `font-link-${activeFont}`;
                if (!document.getElementById(existingId)) {
                    const link = document.createElement('link');
                    link.id = existingId;
                    link.rel = 'stylesheet';
                    link.href = fontInfo.url;
                    document.head.appendChild(link);
                }
            }
        }, [activeFont]);

        // -- Logic: Navigation Actions --
        const startGeneration = async (targetFont = null) => {
            window.haptic.tap();
            const fontToUse = targetFont || activeFont;
            const txt = textInput;
            if (!txt.trim()) {
                if (!targetFont) {
                    window.haptic.error();
                    setInputToast('본문을 입력해주세요');
                    setTimeout(() => setInputToast(''), 2000);
                }
                return;
            }
            if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
            setIsGenerating(true);

            if (!targetFont) window.history.pushState({ step: 'result' }, '');

            setTimeout(() => {
                const resultPages = window.calculatePages(txt, fontToUse, measureContainerRef.current, metadata, pageSize);
                setPages(resultPages);

                if (targetFont) {
                    setCurrentPageIdx(prev => Math.min(prev, resultPages.length - 1));
                } else {
                    setCurrentPageIdx(0);
                    setPageHighlights({});
                }

                if (!targetFont) {
                    setStep('result');
                    if (window.isMobile() || window.innerWidth < 768) {
                        setActiveTab('theme');
                        setRenderedTab('theme');
                        setStartTipVisible(true);
                        setTimeout(() => setStartTipVisible(false), 4000);
                    } else {
                        setActiveTab('style');
                    }
                    setTimeout(() => setIsLayer2Visible(true), 100);
                }
                setIsGenerating(false);
                if (!targetFont) setTimeout(() => window.scrollTo(0, 0), 100);
            }, 400);
        };

        const toggleTab = (tab, mode) => {
            window.haptic.tap();
            if (activeTab === tab) {
                setIsLayer2Visible(false);
                setTimeout(() => {
                    setActiveTab(null);
                    setToolMode(null);
                }, 300);
            } else {
                setActiveTab(tab);
                setToolMode(mode);
                setRenderedTab(tab);
                requestAnimationFrame(() => setIsLayer2Visible(true));
            }
        };

        useEffect(() => {
            if (activeTab) setRenderedTab(activeTab);
        }, [activeTab]);

        const handleFontChangeRequest = (newFont) => {
            window.haptic.tap();
            if (activeFont === newFont) return;
            const container = mobileContentRef.current || desktopContentRef.current;
            const hasDecorations = Object.values(pageHighlights).some(html => html.includes('data-group-id')) ||
                (container && container.innerHTML.includes('data-group-id'));

            if (hasDecorations) {
                setMemoAlert({
                    message: '형광펜과 글자색이\n지워집니다.\n그래도 바꾸시겠어요?',
                    onConfirm: () => {
                        setActiveFont(newFont);
                        setPageHighlights({});
                        startGeneration(newFont);
                    },
                    onCancel: () => { },
                    position: window.isMobile() ? 'mobile-bottom' : 'center-up',
                    timestamp: Date.now()
                });
            } else {
                setActiveFont(newFont);
                setPageHighlights({});
                startGeneration(newFont);
            }
        };

        const handleThemeChange = (newTheme) => {
            setActiveTheme(newTheme);
        };

        const saveCurrentPageState = (containerOverride) => {
            const container = containerOverride || mobileContentRef.current || desktopContentRef.current;
            if (container) {
                setPageHighlights(prev => ({ ...prev, [currentPageIdx]: container.innerHTML }));
            }
        };

        const handleContentClick = (e) => {
            // Fix: Allow if either activeTab IS set OR toolMode IS set (Desktop)
            if (!activeTab && !toolMode) return;
            const target = e.target;
            let container = null;
            if (mobileContentRef.current && mobileContentRef.current.contains(target)) container = mobileContentRef.current;
            else if (desktopContentRef.current && desktopContentRef.current.contains(target)) container = desktopContentRef.current;

            if (!container) return;
            let shouldRemove = false;

            // Fix: Check toolMode directly alongside activeTab
            // Desktop sets toolMode='highlight'/'text', regardless of activeTab
            const isHighlightMode = activeTab === 'highlight' || toolMode === 'highlight';
            const isTextMode = activeTab === 'text' || toolMode === 'text';

            if (isHighlightMode && target.classList.contains('highlight')) shouldRemove = true;
            else if (isTextMode && target.classList.contains('colored-text')) shouldRemove = true;

            if (shouldRemove) {
                window.haptic.tap();
                const groupId = target.getAttribute('data-group-id');
                if (groupId) {
                    const allSpans = container.querySelectorAll(`span[data-group-id="${groupId}"]`);
                    allSpans.forEach(span => {
                        const text = span.textContent;
                        const textNode = document.createTextNode(text);
                        span.parentNode.replaceChild(textNode, span);
                    });
                    saveCurrentPageState(container);
                }
            }
        };

        // -- State: Colors --
        const [highlightColor, setHighlightColor] = useState('highlight-yellow');
        const [textColor, setTextColor] = useState('text-crimson');

        // ... (existing helper) ...

        const handleHighlightSelection = () => {
            // Logic reused from original app.js but kept inside App as it interacts with state/refs
            // Check activeTab OR toolMode to allow desktop sidebar usage
            const isHighlightMode = activeTab === 'highlight' || toolMode === 'highlight';
            const isTextMode = activeTab === 'text' || toolMode === 'text';

            if (!isHighlightMode && !isTextMode) return;

            const selection = window.getSelection();
            if (!selection || selection.rangeCount === 0 || selection.toString().trim() === '') return;

            window.haptic.tap();
            const range = selection.getRangeAt(0);
            let container = null;
            if (mobileContentRef.current && mobileContentRef.current.contains(range.commonAncestorContainer)) container = mobileContentRef.current;
            else if (desktopContentRef.current && desktopContentRef.current.contains(range.commonAncestorContainer)) container = desktopContentRef.current;

            if (!container) return;

            const highlightId = 'hl-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);

            try {
                const treeWalker = document.createTreeWalker(range.commonAncestorContainer, NodeFilter.SHOW_TEXT, {
                    acceptNode: function (node) { if (!range.intersectsNode(node)) return NodeFilter.FILTER_REJECT; return NodeFilter.FILTER_ACCEPT; }
                });
                const nodesToHighlight = [];
                if (range.commonAncestorContainer.nodeType === Node.TEXT_NODE) {
                    if (range.intersectsNode(range.commonAncestorContainer)) nodesToHighlight.push(range.commonAncestorContainer);
                } else {
                    let currentNode = treeWalker.nextNode();
                    while (currentNode) { nodesToHighlight.push(currentNode); currentNode = treeWalker.nextNode(); }
                }
                nodesToHighlight.forEach(node => {
                    const nodeRange = document.createRange(); nodeRange.selectNodeContents(node);
                    if (node === range.startContainer) nodeRange.setStart(node, range.startOffset);
                    if (node === range.endContainer) nodeRange.setEnd(node, range.endOffset);
                    const text = nodeRange.toString();
                    if (text.trim().length > 0) {
                        const span = document.createElement('span');
                        if (isHighlightMode) span.className = `highlight ${highlightColor}`;
                        else if (isTextMode) span.className = `colored-text ${textColor}`;
                        span.setAttribute('data-group-id', highlightId);
                        nodeRange.surroundContents(span);
                    }
                });
                selection.removeAllRanges();
                saveCurrentPageState(container);
            } catch (e) { console.log("Highlight error", e); }
        };

        const onTouchStart = (e) => {
            /* Swipe logic */
            // Simplified for now or extracted if needed. 
            // Keeping event handlers clean.
        };

        const executeBackToEdit = () => {
            window.haptic.tap();
            setStep('input'); setPages([]); setPageHighlights({}); setCurrentPageIdx(0); setActiveTab('theme'); window.scrollTo(0, 0);
            window.history.pushState({ step: 'input' }, '');
        };

        const getFormattedDate = () => {
            const now = new Date();
            const yy = String(now.getFullYear()).slice(2);
            const mm = String(now.getMonth() + 1).padStart(2, '0');
            const dd = String(now.getDate()).padStart(2, '0');
            const hh = String(now.getHours()).padStart(2, '0');
            const min = String(now.getMinutes()).padStart(2, '0');
            return `${yy}${mm}${dd}_${hh}${min}`;
        };

        const downloadAllSequential = async () => {
            // Confirmation for Save All
            if (!confirm('전체 페이지를 저장하시겠습니까?\n(페이지 수에 따라 시간이 걸릴 수 있습니다.)')) return;

            window.haptic.tap();
            const originalPageIdx = currentPageIdx;
            const originalSpreadIdx = mockupSpreadIdx; // also save mockup index

            try {
                setLoadingMessage('전체 이미지 저장 중...');
                await window.ensureFontsLoaded();
                const fontCss = await window.prepareFontEmbedCSS(activeFont);
                // Date Format: 260110_1637
                const dateStr = getFormattedDate();

                // Mockup or Normal
                const isMockup = activeTab === 'mockup';
                const total = isMockup ? spreads.length : pages.length;

                for (let i = 0; i < total; i++) {
                    setLoadingMessage(`${i + 1} / ${total} 저장 중...`);
                    // Update state to render the target page
                    if (isMockup) setMockupSpreadIdx(i);
                    else setCurrentPageIdx(i);

                    // Wait for render (essential)
                    await new Promise(r => setTimeout(r, 600));

                    let target;
                    if (isMockup) target = document.getElementById('mockupCaptureHidden');
                    else target = document.getElementById('captureTarget');

                    if (target) {
                        // Naming: 260110_1637_page1
                        const fileName = `${dateStr}_page${i + 1}.png`;
                        await window.captureNode(target, fileName, target.offsetWidth, target.offsetHeight, fontCss);
                    }
                }
                window.haptic.success();
                setTimeout(() => setSaveToast(true), 500);
                window.haptic.success();
                // Success (No toast as requested)
            } catch (e) {
                window.haptic.error();
                console.error("Save Error:", e);
                let msg = "알 수 없는 오류";
                if (e instanceof Error) msg = e.message;
                else if (e && e.type === 'error') msg = "리소스 로딩 실패 (폰트/이미지)";
                else if (typeof e === 'string') msg = e;
                else msg = JSON.stringify(e);

                alert("오류: " + msg);
            } finally {
                setLoadingMessage('');
                setCurrentPageIdx(originalPageIdx);
                setMockupSpreadIdx(originalSpreadIdx);
            }
        };

        const downloadCurrent = async () => {
            window.haptic.tap();
            const isMockup = activeTab === 'mockup';
            setLoadingMessage('이미지 저장 중...');

            try {
                await window.ensureFontsLoaded();
                const fontCss = await window.prepareFontEmbedCSS(activeFont);
                const dateStr = getFormattedDate();

                if (isMockup) {
                    const target = document.getElementById('mockupCaptureHidden');
                    if (target) await window.captureNode(target, `${dateStr}_mockup_${mockupSpreadIdx + 1}.png`, target.offsetWidth, target.offsetHeight, fontCss);
                } else {
                    const target = document.getElementById('captureTarget');
                    if (target) {
                        // Naming: 260110_1637_page1
                        const fileName = `${dateStr}_page${currentPageIdx + 1}.png`;
                        await window.captureNode(target, fileName, target.offsetWidth, target.offsetHeight, fontCss);
                    }
                }
                window.haptic.success();
                setTimeout(() => setSaveToast(true), 500);
                window.haptic.success();
                // Success (No toast as requested)
            } catch (e) {
                window.haptic.error();
                console.error("Save Error:", e);
                let msg = "알 수 없는 오류";
                if (e instanceof Error) msg = e.message;
                else if (e && e.type === 'error') msg = "리소스 로딩 실패 (폰트/이미지)";
                else if (typeof e === 'string') msg = e;
                else msg = JSON.stringify(e);

                alert("저장 실패: " + msg);
            } finally { setLoadingMessage(''); }
        };



        // -- Render --
        return (
            <div className="min-h-screen font-serif">
                {/* Measurement Container Removed (Safe Clean-up) */}
                {/* <div ref={measureContainerRef} className="hidden-measure"></div> */}

                {/* Hidden Mockup Capture Target */}
                {step === 'result' && (
                    <div style={{ position: 'fixed', top: '-10000px', left: '-10000px' }}>
                        <div id="mockupCaptureHidden" style={{ width: '840px', height: '600px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'transparent' }}>
                            <window.MockupBookRenderer
                                spreadIdx={mockupSpreadIdx} spreads={spreads} isCaptureMode={true} activeTheme={activeTheme} activeFont={activeFont}
                                frontFlyleafText={frontFlyleafText} setFrontFlyleafText={setFrontFlyleafText}
                                backFlyleafText={backFlyleafText} setBackFlyleafText={setBackFlyleafText}
                                pageHighlights={pageHighlights} pages={pages} metadata={metadata}
                            />
                        </div>
                    </div>
                )}

                {/* Global Components */}
                <window.MemoAlert key={memoAlert ? memoAlert.timestamp : 'empty'} config={memoAlert} onClose={() => setMemoAlert(null)} />

                {loadingMessage && (
                    <div className="fixed inset-0 bg-black/70 text-white flex flex-col items-center justify-center z-[9999]">
                        <div className="text-xl mb-4 font-light">{loadingMessage}</div>
                        {loadingProgress > 0 && <div className="text-sm opacity-80">잠시만 기다려주세요 ({loadingProgress}%)</div>}
                    </div>
                )}

                {saveToast && (
                    <div className="toast-overlay"><div className="toast-box animate-bounce-slight">갤러리에 이미지가 저장되었습니다</div></div>
                )}

                {exitToast && (
                    <div className="toast-exit">한 번 더 누르면 종료됩니다</div>
                )}

                {/* View Switching */}
                {step === 'input' ? (
                    <window.InputView
                        showUndo={showUndo}
                        onUndo={handleUndo}
                        inputToast={inputToast}
                        onDelete={handleDelete}
                        textInput={textInput}
                        setTextInput={setTextInput}
                        metadata={metadata}
                        setMetadata={setMetadata}
                        activeTheme={activeTheme}
                        setActiveTheme={setActiveTheme}
                        activeFont={activeFont}
                        setActiveFont={setActiveFont}
                        pageSize={pageSize}
                        setPageSize={setPageSize}
                        onStartGeneration={() => startGeneration()}
                        textAreaRef={textAreaRef}
                    />
                ) : (
                    <window.ResultView
                        activeTab={activeTab}
                        renderedTab={renderedTab}
                        onToggleTab={toggleTab}
                        isLayer2Visible={isLayer2Visible}
                        toolMode={toolMode}
                        setToolMode={setToolMode} // Added missing setter
                        tipsShown={tipsShown}
                        startTipVisible={startTipVisible}
                        metadata={metadata}
                        pages={pages}
                        currentPageIdx={currentPageIdx}
                        setCurrentPageIdx={setCurrentPageIdx} // Pass setter
                        activeFont={activeFont}
                        activeTheme={activeTheme}
                        pageSize={pageSize}
                        pageHighlights={pageHighlights}
                        mockupSpreadIdx={mockupSpreadIdx}
                        setMockupSpreadIdx={setMockupSpreadIdx}
                        spreads={spreads}
                        frontFlyleafText={frontFlyleafText} setFrontFlyleafText={setFrontFlyleafText}
                        backFlyleafText={backFlyleafText} setBackFlyleafText={setBackFlyleafText}
                        focusedFlyleaf={focusedFlyleaf} setFocusedFlyleaf={setFocusedFlyleaf}

                        // Colors
                        highlightColor={highlightColor} setHighlightColor={setHighlightColor}
                        textColor={textColor} setTextColor={setTextColor}

                        onEditFlyleaf={(type) => { window.haptic.tap(); setFocusedFlyleaf(type); }}
                        onFontChange={handleFontChangeRequest}
                        onThemeChange={handleThemeChange}
                        onDownloadAll={downloadAllSequential}
                        onDownloadCurrent={downloadCurrent}
                        onBack={() => {
                            // Back logic
                            const container = mobileContentRef.current || desktopContentRef.current;
                            const hasDecorations = Object.values(pageHighlights).some(html => html.includes('data-group-id')) ||
                                (container && container.innerHTML.includes('data-group-id'));

                            if (hasDecorations) {
                                setMemoAlert({
                                    message: '형광펜과 글자색이\n지워집니다.\n그래도 나가시겠어요?',
                                    onConfirm: () => executeBackToEdit(),
                                    onCancel: () => { },
                                    position: window.isMobile() ? 'mobile-top-left' : 'top-left',
                                    timestamp: Date.now()
                                });
                            } else {
                                executeBackToEdit();
                            }
                        }}

                        mobileContentRef={mobileContentRef}
                        desktopContentRef={desktopContentRef}
                        onContentClick={handleContentClick}
                        onMouseUp={handleHighlightSelection}
                    />
                )}
                {/* 3. Measurement Box (Restored for Core Logic) */}
                <div ref={measureContainerRef} className="hidden-measure" aria-hidden="true" />
            </div>
        );
    }

    const root = ReactDOM.createRoot(document.getElementById('root'));
    root.render(<App />);
})();
