(function () {
    const { useState, useEffect, useRef } = React;

    // ----------------------------------------------------------------------
    // Constants & Shared Data
    // ----------------------------------------------------------------------
    const THEME_OPTIONS = [
        { key: 'white', bg: 'bg-white', label: 'White' },
        { key: 'cream', bg: 'bg-[#fdfbf7]', label: 'Cream' },
        { key: 'kraft', bg: 'bg-[#e6dac3]', label: 'Kraft' },
        { key: 'dark', bg: 'bg-[#1a1a1a]', label: 'Dark' }
    ];

    const FONT_OPTIONS = [
        { key: 'noto', label: '본문 명조', sub: 'Noto Serif KR' },
        { key: 'nanum', label: '나눔 명조', sub: 'Nanum Myeongjo' },
        { key: 'hahmlet', label: '함렛', sub: 'Hahmlet' },
        { key: 'gowun', label: '고운 바탕', sub: 'Gowun Batang' },
        { key: 'maru', label: '마루 부리', sub: 'MaruBuri' },
        { key: 'ridi', label: '리디바탕', sub: 'Ridibatang' },
        { key: 'kyobo', label: '교보 손글씨', sub: 'Kyobo Handwriting' }
    ];

    const HIGHLIGHT_COLORS = [
        { key: 'highlight-yellow', bg: 'bg-[#fff59d]', label: 'Yellow' },
        { key: 'highlight-pink', bg: 'bg-[#ffccbc]', label: 'Pink' },
        { key: 'highlight-mint', bg: 'bg-[#b2dfdb]', label: 'Mint' },
        { key: 'highlight-blue', bg: 'bg-[#bbdefb]', label: 'Blue' },
    ];

    const TEXT_COLORS = [
        { key: 'text-crimson', bg: 'bg-rose-700', label: 'Crimson' },
        { key: 'text-navy', bg: 'bg-slate-800', label: 'Navy' },
        { key: 'text-forest', bg: 'bg-emerald-700', label: 'Forest' },
        { key: 'text-purple', bg: 'bg-purple-700', label: 'Purple' },
        { key: 'text-brown', bg: 'bg-amber-800', label: 'Brown' },
        { key: 'text-teal', bg: 'bg-teal-700', label: 'Teal' },
        { key: 'text-gray', bg: 'bg-slate-500', label: 'Gray' },
    ];

    // ----------------------------------------------------------------------
    // Helper Components
    // ----------------------------------------------------------------------
    const ThemeSelector = ({ activeTheme, onThemeChange }) => (
        <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar px-1">
            {THEME_OPTIONS.map(opt => (
                <button
                    key={opt.key}
                    onClick={() => onThemeChange(opt.key)}
                    className={`flex-shrink-0 w-12 h-12 rounded-full border-2 transition-all ${opt.bg} ${activeTheme === opt.key ? 'border-indigo-500 scale-110 shadow-md ring-2 ring-indigo-200' : 'border-slate-100 hover:scale-105'}`}
                    title={opt.label} aria-label={opt.label}
                />
            ))}
        </div>
    );

    const FontSelector = ({ activeFont, onFontChange, isMobile }) => (
        <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-1'} gap-2 overflow-y-auto max-h-[300px] md:max-h-none no-scrollbar pr-1`}>
            {FONT_OPTIONS.map(font => (
                <button
                    key={font.key}
                    onClick={() => onFontChange(font.key)}
                    className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all group ${activeFont === font.key ? 'bg-indigo-50 border-indigo-200 shadow-sm' : 'bg-white border-slate-100 hover:border-indigo-100 hover:bg-slate-50'}`}
                >
                    <div>
                        <span className={`block text-sm font-medium ${activeFont === font.key ? 'text-indigo-900' : 'text-slate-700'}`}>{font.label}</span>
                        <span className="block text-xs text-slate-400 mt-0.5">{font.sub}</span>
                    </div>
                    {activeFont === font.key && (<div className="w-2 h-2 rounded-full bg-indigo-500 shadow-sm"></div>)}
                </button>
            ))}
        </div>
    );

    const ToolSelector = ({ mode, activeColor, onColorChange }) => {
        const colors = mode === 'highlight' ? HIGHLIGHT_COLORS : TEXT_COLORS;
        return (
            <div className="flex flex-col gap-3">
                <p className="text-xs text-slate-400 font-medium text-center mb-1">
                    {mode === 'highlight' ? '텍스트를 드래그하여 형광펜 칠하기' : '텍스트를 드래그하여 글자색 변경하기'}
                </p>
                <div className="flex flex-wrap gap-2 justify-center">
                    {colors.map(c => (
                        <button
                            key={c.key}
                            onClick={() => onColorChange(c.key)}
                            className={`relative w-10 h-10 rounded-full border-2 transition-all flex items-center justify-center ${activeColor === c.key ? 'border-indigo-500 scale-110 shadow-md' : 'border-slate-100 hover:scale-105'} ${mode === 'text' ? c.bg : ''}`}
                            title={c.label}
                        >
                            {mode === 'highlight' && (
                                <div className={`w-full h-full rounded-full ${c.bg}`}></div>
                            )}
                            {activeColor === c.key && (
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="w-2 h-2 bg-white rounded-full shadow-sm" style={mode === 'highlight' ? { backgroundColor: 'rgba(0,0,0,0.2)' } : {}}></div>
                                </div>
                            )}
                        </button>
                    ))}
                </div>
            </div>
        );
    };

    const EditorPanel = ({
        activeTheme, onThemeChange,
        activeFont, onFontChange,
        toolMode, setToolMode,
        highlightColor, setHighlightColor,
        textColor, setTextColor,
        onDownloadAll, onDownloadCurrent,
        isMobile
    }) => {
        // Desktop Sidebar Style vs Mobile Sheet Style
        const containerClass = isMobile
            ? "flex flex-col gap-6 pb-8"
            : "h-full flex flex-col gap-6 text-slate-200"; // Dark mode for desktop sidebar

        const labelClass = isMobile
            ? "text-xs font-bold text-slate-400 uppercase tracking-wider mb-2"
            : "text-xs font-bold text-slate-500 uppercase tracking-wider mb-2";

        return (
            <div className={containerClass}>
                {!isMobile && (
                    <div className="grid grid-cols-2 gap-3 mb-2">
                        <button onClick={onDownloadAll} className="flex items-center justify-center gap-2 py-3 bg-[#A47764] hover:bg-[#8D6655] text-white rounded-lg shadow-lg active:scale-95 transition-all text-sm font-medium">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                            전체 저장
                        </button>
                        <button onClick={onDownloadCurrent} className="flex items-center justify-center gap-2 py-3 bg-slate-700 hover:bg-slate-600 text-slate-200 border border-slate-600 rounded-lg shadow-sm active:scale-95 transition-all text-sm font-medium">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>
                            현재 페이지
                        </button>
                    </div>
                )}

                {/* Theme Section */}
                <div>
                    <div className={labelClass}>테마</div>
                    <ThemeSelector activeTheme={activeTheme} onThemeChange={onThemeChange} />
                </div>

                {/* Font Section */}
                <div className="flex-1 flex flex-col min-h-0">
                    <div className={labelClass}>글꼴</div>
                    <FontSelector activeFont={activeFont} onFontChange={onFontChange} isMobile={isMobile} />
                </div>

                {/* Tools Section (Desktop Only) */}
                {!isMobile && (
                    <div className="pt-4 border-t border-slate-700 mt-auto">
                        <div className={labelClass}>도구</div>
                        <div className="flex bg-slate-800 p-1 rounded-lg mb-4 border border-slate-700">
                            <button
                                onClick={() => setToolMode(null)}
                                className={`flex-1 py-1.5 text-xs font-medium rounded transition-all ${!toolMode ? 'bg-[#A47764] text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
                            >
                                커서
                            </button>
                            <button
                                onClick={() => setToolMode('highlight')}
                                className={`flex-1 py-1.5 text-xs font-medium rounded transition-all ${toolMode === 'highlight' ? 'bg-[#A47764] text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
                            >
                                형광펜
                            </button>
                            <button
                                onClick={() => setToolMode('text')}
                                className={`flex-1 py-1.5 text-xs font-medium rounded transition-all ${toolMode === 'text' ? 'bg-[#A47764] text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
                            >
                                글자색
                            </button>
                        </div>

                        {toolMode === 'highlight' && (
                            <ToolSelector mode="highlight" activeColor={highlightColor} onColorChange={setHighlightColor} />
                        )}
                        {toolMode === 'text' && (
                            <ToolSelector mode="text" activeColor={textColor} onColorChange={setTextColor} />
                        )}
                        {!toolMode && (
                            <div className="text-center py-4 text-xs text-slate-500 border border-dashed border-slate-700 rounded-lg">
                                텍스트를 선택하여 도구를 사용해보세요
                            </div>
                        )}
                    </div>
                )}
            </div>
        );
    };

    window.EditorPanel = EditorPanel;

    // ----------------------------------------------------------------------
    // InputView Component
    // ----------------------------------------------------------------------
    window.InputView = ({
        showUndo, onUndo, inputToast, onDelete,
        textInput, setTextInput, metadata, setMetadata,
        activeTheme, setActiveTheme, activeFont, setActiveFont,
        pageSize, setPageSize, onStartGeneration, textAreaRef
    }) => {
        const ghostRef = React.useRef(null); // Ghost for auto-resize
        const [isCurlyQuotes, setIsCurlyQuotes] = React.useState(false);
        const [isSpacedDialogue, setIsSpacedDialogue] = React.useState(false);
        const [estimatedPages, setEstimatedPages] = React.useState(0);

        // History Stack
        const [history, setHistory] = React.useState([textInput]);
        const [historyIndex, setHistoryIndex] = React.useState(0);

        // Update history when text changes
        const addToHistory = (newText) => {
            if (newText === history[historyIndex]) return;
            const newHistory = history.slice(0, historyIndex + 1);
            newHistory.push(newText);
            if (newHistory.length > 50) newHistory.shift();
            setHistory(newHistory);
            setHistoryIndex(newHistory.length - 1);
        };

        // Capture initial state for history
        React.useEffect(() => {
            if (history.length === 1 && history[0] === '' && textInput !== '') {
                setHistory([textInput]);
            }
        }, []);

        // Auto-resize textarea using Ghost Replica
        React.useLayoutEffect(() => {
            if (textAreaRef.current && ghostRef.current) {
                // Sync height from ghost to textarea
                // We do NOT set height='auto' on textarea anymore.
                textAreaRef.current.style.height = ghostRef.current.scrollHeight + 'px';
            }
        }, [textInput]);

        const handleTextChange = (e) => {
            const val = e.target.value;
            setTextInput(val);
            // We should debounce history add here for typing, but for buttons we add immediately
        };

        // Simple manual undo/redo
        const handleUndo = () => {
            if (historyIndex > 0) {
                const newIndex = historyIndex - 1;
                setHistoryIndex(newIndex);
                setTextInput(history[newIndex]);
            }
        };

        const handleRedo = () => {
            if (historyIndex < history.length - 1) {
                const newIndex = historyIndex + 1;
                setHistoryIndex(newIndex);
                setTextInput(history[newIndex]);
            }
        };

        // Helper to insert text at cursor
        const insertText = (text, moveCursorOffset = 0) => {
            if (!textAreaRef.current) return;
            const start = textAreaRef.current.selectionStart;
            const end = textAreaRef.current.selectionEnd;
            const newText = textInput.substring(0, start) + text + textInput.substring(end);

            setTextInput(newText);
            addToHistory(newText);

            // Restore focus and move cursor
            setTimeout(() => {
                textAreaRef.current.focus({ preventScroll: true });
                const newPos = start + text.length + moveCursorOffset;
                textAreaRef.current.setSelectionRange(newPos, newPos);
            }, 0);
        };

        const handlePaste = async () => {
            try {
                if (navigator.clipboard && navigator.clipboard.readText) {
                    const text = await navigator.clipboard.readText();
                    if (text) insertText(text);
                } else {
                    throw new Error('Clipboard API not available');
                }
            } catch (err) {
                // Fallback for secure context issues (common on mobile LAN testing)
                console.warn('Clipboard paste failed:', err);
                alert('보안 문제로 붙여넣기가 차단되었습니다.\n입력창을 길게 눌러 붙여넣기 해주세요.');
                // Focus the textarea to help the user paste manually
                if (textAreaRef.current) textAreaRef.current.focus();
            }
        };

        const handleQuoteToggle = () => {
            const newState = !isCurlyQuotes;
            setIsCurlyQuotes(newState);
            let formatted = textInput;

            if (newState) {
                // To Curly
                formatted = formatted.replace(/(")([^"]+)(")/g, "“$2”");
                formatted = formatted.replace(/(')([^']+)(')/g, "‘$2’");
                formatted = formatted.replace(/(^|[\s\(\[\{])"/g, '$1“');
                formatted = formatted.replace(/'/g, '’');
            } else {
                // To Straight
                formatted = formatted.replace(/[“”]/g, '"');
                formatted = formatted.replace(/[‘’]/g, "'");
            }
            setTextInput(formatted);
            addToHistory(formatted);
        };

        const handleSpacingToggle = () => {
            const newState = !isSpacedDialogue;
            setIsSpacedDialogue(newState);
            let newText = textInput;

            const checkIsDialogue = (str) => str.startsWith('“') || str.startsWith('"') || str.startsWith("'") || str.startsWith('‘');

            if (newState) {
                // Add Spacing: 
                // 1. Narration -> Dialogue = Newline (Blank line)
                // 2. Dialogue -> Narration = Newline (Blank line)
                // 3. Dialogue -> Dialogue = Join (No extra newline)
                const lines = textInput.split('\n');
                const processedLines = [];

                for (let i = 0; i < lines.length; i++) {
                    const line = lines[i];
                    const trimmed = line.trim();
                    const isCurrentDialogue = checkIsDialogue(trimmed);

                    if (i > 0) {
                        const prevLine = lines[i - 1];
                        const prevTrimmed = prevLine.trim();
                        const isPrevDialogue = checkIsDialogue(prevTrimmed);

                        // Case A: Narration -> Dialogue
                        // Case B: Dialogue -> Narration
                        // If type switches, ensure blank line
                        if (trimmed !== '' && prevTrimmed !== '') {
                            if ((!isPrevDialogue && isCurrentDialogue) || (isPrevDialogue && !isCurrentDialogue)) {
                                processedLines.push('');
                            }
                        }
                    }
                    processedLines.push(line);
                }
                newText = processedLines.join('\n');

                // Also handle inline cases: "Narration" "Dialogue" -> "Narration\n"Dialogue"
                newText = newText.replace(/([^\n])([“"‘'])/g, '$1\n$2');
            } else {
                // Remove Spacing (Join logic)
                // Remove empty lines between narration and dialogue, and between consecutive dialogues.
                const lines = textInput.split('\n');
                const compactLines = [];
                for (let i = 0; i < lines.length; i++) {
                    const line = lines[i];
                    const trimmed = line.trim();

                    if (trimmed === '') {
                        // Check neighbors
                        const nextLine = (i < lines.length - 1) ? lines[i + 1].trim() : '';
                        const prevLine = (i > 0) ? lines[i - 1].trim() : '';

                        const isNextDialogue = checkIsDialogue(nextLine);
                        const isPrevDialogue = checkIsDialogue(prevLine);

                        // If empty line is surrounded by any dialogue transition or dialogue-dialogue match, remove it?
                        // User wants to "Reverse" the spacing.
                        // So if we have Narration \n \n Dialogue -> Narration \n Dialogue.
                        // Or Dialogue \n \n Dialogue -> Dialogue \n Dialogue.

                        // Condition to skip (remove) empty line:
                        // 1. Between Narration and Dialogue
                        // 2. Between Dialogue and Narration
                        // 3. Between Dialogue and Dialogue
                        // Basically, if touch dialogue at all?
                        // Or just remove ALL empty lines? No, might want paragraph breaks in narration.

                        const isPrevNarration = !isPrevDialogue && prevLine !== '';
                        const isNextNarration = !isNextDialogue && nextLine !== '';

                        // Remove if:
                        // (Prev=Narration & Next=Dialogue) OR
                        // (Prev=Dialogue & Next=Narration) OR
                        // (Prev=Dialogue & Next=Dialogue)
                        if (
                            (isPrevNarration && isNextDialogue) ||
                            (isPrevDialogue && isNextNarration) ||
                            (isPrevDialogue && isNextDialogue)
                        ) {
                            continue;
                        }
                    }
                    compactLines.push(line);
                }
                newText = compactLines.join('\n');
            }
            setTextInput(newText);
            addToHistory(newText);
        };

        // Estimate pages debounced
        React.useEffect(() => {
            const timer = setTimeout(() => {
                if (!window.calculatePages) return;
                // Create a temp measure box if not exists
                let measureBox = document.getElementById('measure-box');
                if (!measureBox) {
                    measureBox = document.createElement('div');
                    measureBox.id = 'measure-box';
                    measureBox.style.visibility = 'hidden';
                    measureBox.style.position = 'absolute';
                    measureBox.style.top = '-9999px';
                    measureBox.style.left = '-9999px';
                    measureBox.style.zIndex = '-9999';
                    measureBox.style.pointerEvents = 'none';
                    measureBox.style.width = window.PAPER_SIZES[pageSize].width;
                    document.body.appendChild(measureBox);
                }
                const pages = window.calculatePages(textInput, activeFont, measureBox, metadata, pageSize);
                setEstimatedPages(pages.length);
            }, 500);
            return () => clearTimeout(timer);
        }, [textInput, pageSize, activeFont, metadata]);

        // Capture initial state for history
        React.useEffect(() => {
            if (history.length === 1 && history[0] === '' && textInput !== '') {
                setHistory([textInput]);
            }
        }, []);



        return (
            <div className="min-h-screen bg-white" >
                {/* 1. Header (Fixed) */}
                <div className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-slate-100 flex items-center justify-between px-4 z-[60]">
                    <h1 className="text-sm md:text-xl font-serif font-bold text-slate-800 truncate mr-2">소설 내지 이미지 생성기</h1>
                    <div className="flex items-center gap-3 flex-shrink-0">
                        {estimatedPages > 0 && <span className="text-xs font-bold text-slate-400">약 {estimatedPages}페이지 예상</span>}
                        <button
                            onClick={onStartGeneration}
                            className="bg-[#A47764] hover:bg-[#8D6655] text-white px-3 py-1.5 rounded-lg text-sm font-bold transition-all shadow-md active:scale-95 whitespace-nowrap"
                        >
                            만들기
                        </button>
                    </div>
                </div>

                {/* 2. Sticky Toolbar (Responsive: 1 Line Desktop, 2 Lines Mobile) */}
                <div className="fixed top-16 left-0 right-0 bg-white/95 backdrop-blur border-b border-slate-100 flex flex-wrap md:flex-nowrap items-center justify-center md:px-4 z-50 shadow-sm gap-y-2 md:gap-y-0 py-2 md:py-0 md:h-14">

                    {/* Mobile: Row 1 Container (Justify Between) */}
                    <div className="flex w-full justify-between items-center px-4 md:contents">

                        {/* 1. Paste */}
                        <button
                            onClick={handlePaste}
                            className="order-1 md:order-1 flex-shrink-0 flex items-center justify-center text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors"
                            title="붙여넣기"
                        >
                            붙여넣기
                        </button>

                        <div className="hidden md:block md:order-2 w-px h-6 bg-slate-200 mx-3"></div>

                        {/* 2. Paper Size */}
                        <div className="order-2 md:order-3 flex-shrink-0 flex items-center gap-2">
                            <select
                                value={pageSize}
                                onChange={(e) => setPageSize(e.target.value)}
                                className="bg-transparent text-xs font-bold text-slate-500 outline-none cursor-pointer py-1 text-center hover:text-slate-800 transition-colors"
                            >
                                {Object.entries(window.PAPER_SIZES).map(([key, config]) => (
                                    <option key={key} value={key}>{config.label}</option>
                                ))}
                            </select>
                        </div>

                        <div className="hidden md:block md:order-4 w-px h-6 bg-slate-200 mx-3"></div>

                        {/* 5. Undo / Redo */}
                        <div className="order-3 md:order-9 flex-shrink-0 flex items-center gap-1 md:ml-0">
                            <button onClick={handleUndo} disabled={historyIndex <= 0} className={`p-1 rounded-full transition-colors ${historyIndex > 0 ? 'hover:bg-slate-100 text-slate-500 cursor-pointer' : 'text-slate-200 cursor-not-allowed'}`} title="실행 취소">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>
                            </button>
                            <button onClick={handleRedo} disabled={historyIndex >= history.length - 1} className={`p-1 rounded-full transition-colors ${historyIndex < history.length - 1 ? 'hover:bg-slate-100 text-slate-500 cursor-pointer' : 'text-slate-200 cursor-not-allowed'}`} title="다시 실행">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6" /></svg>
                            </button>
                        </div>

                        {/* 6. Delete */}
                        <div className="relative order-4 md:order-10 md:ml-3">
                            <button onClick={onDelete} className="flex-shrink-0 text-xs font-bold text-slate-400 hover:text-red-500 transition-colors" title="초기화">
                                삭제
                            </button>

                            {/* Toasts */}
                            {inputToast && (
                                <div className="absolute top-8 right-0 w-max bg-slate-800 text-white text-xs px-3 py-1.5 rounded shadow-lg z-[100] animate-fade-in-out">
                                    {inputToast}
                                </div>
                            )}
                            {showUndo && (
                                <div className="absolute top-8 right-0 w-max bg-slate-800 text-white px-3 py-1.5 rounded shadow-lg flex items-center gap-2 text-xs z-[100] cursor-pointer animate-fade-in-out" onClick={onUndo}>
                                    <span>취소</span>
                                    <svg className="w-3 h-3 text-white/70" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="basis-full h-0 md:hidden order-5"></div>

                    {/* Combined Row 2 for Mobile (Symbols + Actions) */}
                    <div className="order-6 md:order-5 flex w-full md:w-auto items-center justify-center gap-4 md:gap-0 mt-2 md:mt-0">

                        {/* 3. Symbols */}
                        <div className="flex items-center gap-1 font-serif text-slate-500 md:mx-3">
                            <button onClick={() => insertText('“ ”', -2)} className="w-8 h-8 flex items-center justify-center hover:bg-slate-100 rounded text-lg font-bold transition-colors pb-1" title="큰따옴표">“ ”</button>
                            <button onClick={() => insertText('‘ ’', -2)} className="w-8 h-8 flex items-center justify-259center hover:bg-slate-100 rounded text-lg font-bold transition-colors pb-1" title="작은따옴표">‘ ’</button>
                            <button onClick={() => insertText('……')} className="w-8 h-8 flex items-center justify-center hover:bg-slate-100 rounded text-sm font-bold transition-colors" title="말줄임표">…</button>
                            <button onClick={() => insertText('—')} className="w-8 h-8 flex items-center justify-center hover:bg-slate-100 rounded text-sm font-bold transition-colors" title="대시">—</button>
                            <button onClick={() => insertText('***')} className="w-10 h-8 flex items-center justify-center hover:bg-slate-100 rounded text-sm font-bold transition-colors" title="별표">***</button>
                        </div>

                        {/* Mobile Divider (Now visible) */}
                        <div className="w-px h-6 bg-slate-200 mx-3"></div>

                        {/* 4. Action Buttons */}
                        <div className="flex items-center gap-3 md:mx-3">
                            <button
                                onClick={handleQuoteToggle}
                                className={`flex items-center gap-1.5 text-xs font-bold transition-all whitespace-nowrap ${isCurlyQuotes ? 'text-[#A47764]' : 'text-slate-500 hover:text-slate-800'}`}
                                title={isCurlyQuotes ? '직선따옴표로 변환' : '둥근따옴표로 변환'}
                            >
                                따옴표 변경
                            </button>
                            <button
                                onClick={handleSpacingToggle}
                                className={`flex items-center gap-1.5 text-xs font-bold transition-all whitespace-nowrap ${isSpacedDialogue ? 'text-[#A47764]' : 'text-slate-500 hover:text-slate-800'}`}
                                title={isSpacedDialogue ? '대사 붙이기' : '대사 띄우기'}
                            >
                                {/* Vertical Double Arrow */}
                                <svg className="w-3 h-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" /></svg>
                                대사 간격
                            </button>
                        </div>

                    </div>

                    <div className="hidden md:block md:order-8 w-px h-6 bg-slate-200 mx-3"></div>

                </div >

                {/* 3. Document Area (Ghost Inputs) - Updated onChange to track history */}
                <div className="relative pt-52 md:pt-40 pb-[50vh] max-w-3xl mx-auto px-8 md:px-12 [overflow-anchor:none] flex flex-col items-center">

                    {/* Title */}
                    <input
                        type="text"
                        value={metadata.title}
                        onChange={e => setMetadata({ ...metadata, title: e.target.value })}
                        placeholder="필요 시 소제목을 입력하세요."
                        className="w-full text-2xl md:text-3xl font-bold font-serif text-slate-800 placeholder:text-slate-300 border-none p-0 focus:ring-0 bg-transparent mb-4 tracking-tight outline-none relative z-20 pointer-events-auto"
                        style={{ maxWidth: '100%' }}
                    />

                    {/* Sub Metadata (Author, Producer, Character)  */}
                    <div className="flex flex-col gap-1 mb-4 w-full relative z-20 pointer-events-auto">
                        <input
                            type="text"
                            value={metadata.author}
                            onChange={e => setMetadata({ ...metadata, author: e.target.value })}
                            placeholder="제작자명"
                            className="w-full text-sm text-slate-500 placeholder:text-slate-300 border-none p-0 focus:ring-0 bg-transparent outline-none font-medium"
                        />
                        <div className="flex gap-4">
                            <input
                                type="text"
                                value={metadata.producer}
                                onChange={e => setMetadata({ ...metadata, producer: e.target.value })}
                                placeholder="캐릭터"
                                className="w-auto text-sm text-slate-400 placeholder:text-slate-300 border-none p-0 focus:ring-0 bg-transparent outline-none"
                            />
                        </div>
                    </div>

                    <hr className="border-slate-100 mb-4 w-full" />

                    {/* Main Text Editor */}
                    {/* Main Text Editor - SAFE MODE */}
                    <textarea
                        ref={textAreaRef}
                        value={textInput}
                        onChange={(e) => {
                            handleTextChange(e);
                            // Simple auto-grow fallback
                            e.target.style.height = '1px';
                            e.target.style.height = (e.target.scrollHeight + 20) + 'px';
                        }}
                        onBlur={() => addToHistory(textInput)}
                        placeholder="이곳에 소설 내용을 입력하세요..."
                        className="w-full min-h-[500px] text-base leading-[1.8] text-slate-700 placeholder:text-slate-300 border-none p-0 focus:ring-0 bg-transparent resize-none font-serif outline-none"
                        spellCheck={false}
                        autoComplete="off"
                        autoCorrect="off"
                        autoCapitalize="off"
                    ></textarea>
                </div>

            </div >

        );
    };

    // ----------------------------------------------------------------------
    // ResultView Component
    // ----------------------------------------------------------------------
    window.ResultView = ({
        activeTab, renderedTab, onToggleTab, isLayer2Visible,
        toolMode, setToolMode, // Props for desktop tools
        highlightColor, setHighlightColor, textColor, setTextColor, // Colors
        tipsShown, startTipVisible, metadata, pages, currentPageIdx, setCurrentPageIdx,
        activeFont, onFontChange, activeTheme, onThemeChange,
        pageSize, pageHighlights, mockupSpreadIdx, setMockupSpreadIdx, spreads,
        frontFlyleafText, setFrontFlyleafText, backFlyleafText, setBackFlyleafText,
        focusedFlyleaf, setFocusedFlyleaf, onEditFlyleaf,
        onDownloadAll, onDownloadCurrent, onBack,
        mobileContentRef, desktopContentRef, onContentClick, onMouseUp
    }) => {
        const isMobile = window.innerWidth < 1024; // Simple check for rendering logic

        const navItems = [
            { id: 'theme', icon: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" /></svg>, label: '테마' },
            { id: 'style', icon: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16m-7 6h7" /></svg>, label: '폰트' },
            { id: 'highlight', icon: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>, label: '형광펜' },
            { id: 'text', icon: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" /></svg>, label: '글자색' },
            { id: 'mockup', icon: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>, label: '목업' }
        ];

        return (
            <div className="min-h-screen bg-slate-100 flex flex-col lg:flex-row h-screen overflow-hidden">
                {/* Mobile Bottom Navigation & Layer 2 */}
                <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 flex flex-col">
                    {/* Layer 2 (Options) */}
                    <div className={`bg-white/95 backdrop-blur border-t border-slate-100 transition-all duration-300 overflow-hidden ${isLayer2Visible ? 'h-auto max-h-[350px] opacity-100' : 'max-h-0 opacity-0'}`}>
                        <div className="px-6 py-6 pb-4">
                            {/* Render Specific Mobile Component based on renderedTab */}
                            {renderedTab === 'theme' && (
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Theme</p>
                                    <ThemeSelector activeTheme={activeTheme} onThemeChange={onThemeChange} />
                                </div>
                            )}
                            {renderedTab === 'style' && (
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Typography</p>
                                    <FontSelector activeFont={activeFont} onFontChange={onFontChange} isMobile={true} />
                                </div>
                            )}
                            {renderedTab === 'highlight' && (
                                <ToolSelector mode="highlight" activeColor={highlightColor} onColorChange={setHighlightColor} />
                            )}
                            {renderedTab === 'text' && (
                                <ToolSelector mode="text" activeColor={textColor} onColorChange={setTextColor} />
                            )}
                            {renderedTab === 'mockup' && (
                                <div className="flex gap-2">
                                    <button onClick={onDownloadAll} className="flex-1 py-3 bg-indigo-600 text-white rounded-xl shadow-lg font-medium text-sm">전체 저장</button>
                                    <button onClick={onDownloadCurrent} className="flex-1 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl font-medium text-sm">현재 장면 저장</button>
                                </div>
                            )}

                            {/* Close Handle */}
                            <div className="flex justify-center mt-3" onClick={() => onToggleTab(activeTab, null)}>
                                <div className="w-10 h-1 rounded-full bg-slate-200"></div>
                            </div>
                        </div>
                    </div>

                    {/* Layer 1 (Nav) */}
                    <div className="bg-white border-t border-slate-200 px-6 py-2 pb-safe flex justify-between items-center relative z-50">
                        <button onClick={onBack} className="p-2 -ml-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-50 transition-all">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                        </button>
                        <div className="flex gap-1">
                            {navItems.map(item => (
                                <button
                                    key={item.id}
                                    onClick={() => onToggleTab(item.id, item.id === 'highlight' ? 'highlight' : item.id === 'text' ? 'text' : null)}
                                    className={`flex flex-col items-center justify-center w-14 h-12 rounded-xl transition-all ${activeTab === item.id ? 'text-indigo-600 bg-indigo-50' : 'text-slate-400 hover:text-slate-600'}`}
                                >
                                    {item.icon}
                                    <span className="text-[10px] mt-0.5 font-medium">{item.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Desktop Centered Studio Layout (Minimalist v2) */}
                <div className="hidden lg:flex w-full h-full bg-gray-50 overflow-auto min-h-[800px]">
                    <div className={`flex ${activeTab === 'mockup' ? 'flex-col items-center gap-3' : 'flex-row items-start gap-8'} py-10 m-auto transition-all duration-300`}>

                        {/* 1. Preview Area (Left) */}
                        <div className="relative shadow-2xl transition-all duration-300">
                            {activeTab === 'mockup' ? (
                                <window.MockupBookRenderer
                                    spreadIdx={mockupSpreadIdx} spreads={spreads} isCaptureMode={false} activeTheme={activeTheme} activeFont={activeFont}
                                    frontFlyleafText={frontFlyleafText} setFrontFlyleafText={setFrontFlyleafText}
                                    backFlyleafText={backFlyleafText} setBackFlyleafText={backFlyleafText}
                                    pageHighlights={pageHighlights} pages={pages} metadata={metadata}
                                    focusedFlyleaf={focusedFlyleaf} onEditFlyleaf={onEditFlyleaf}
                                    pageSize={pageSize}
                                />
                            ) : (
                                /* ref={desktopContentRef} moved to PageContent to fix double footer bug */
                                <div id="captureTarget"
                                    className={`page-container theme-${activeTheme} ${window.PAPER_SIZES[pageSize]?.className || ''} transition-all duration-300`}
                                    style={{
                                        width: window.PAPER_SIZES[pageSize] ? window.PAPER_SIZES[pageSize].width : window.PAPER_SIZES['A6'].width,
                                        height: window.PAPER_SIZES[pageSize] ? window.PAPER_SIZES[pageSize].height : window.PAPER_SIZES['A6'].height,
                                        paddingTop: window.PAPER_SIZES[pageSize] ? window.PAPER_SIZES[pageSize].paddingTop : window.PAPER_SIZES['A6'].paddingTop,
                                        paddingBottom: window.PAPER_SIZES[pageSize] ? window.PAPER_SIZES[pageSize].paddingBottom : window.PAPER_SIZES['A6'].paddingBottom,
                                        paddingLeft: window.PAPER_SIZES[pageSize] ? window.PAPER_SIZES[pageSize].paddingLeft : window.PAPER_SIZES['A6'].paddingLeft,
                                        paddingRight: window.PAPER_SIZES[pageSize] ? window.PAPER_SIZES[pageSize].paddingRight : window.PAPER_SIZES['A6'].paddingRight,
                                        boxSizing: 'border-box'
                                    }}
                                    onClick={onContentClick}
                                /* onMouseUp moved to PageContent */
                                >
                                    <window.PageContent
                                        pageIdx={currentPageIdx}
                                        pages={pages}
                                        pageHighlights={pageHighlights}
                                        metadata={metadata}
                                        activeFont={activeFont}
                                        onMouseUp={onMouseUp}
                                        onClick={onContentClick}
                                        contentRef={desktopContentRef}
                                    />
                                    <window.PageFooter pageIdx={currentPageIdx} metadata={metadata} activeFont={activeFont} />
                                </div>
                            )}

                            {/* Page Indicator (Top Center - Outside Paper) */}
                            {activeTab !== 'mockup' ? (
                                <div className="absolute -top-10 left-1/2 -translate-x-1/2 text-slate-400 font-medium text-sm select-none">
                                    {currentPageIdx + 1} / {pages.length}
                                </div>
                            ) : (
                                <div className="absolute -top-10 left-1/2 -translate-x-1/2 text-slate-400 font-medium text-sm select-none">
                                    {mockupSpreadIdx + 1} / {spreads.length}
                                </div>
                            )}

                            {/* Page Navigation (Rounded Square INSIDE Edge) - Shared Logic */}
                            {activeTab !== 'mockup' ? (
                                <>
                                    {currentPageIdx > 0 && (
                                        <button
                                            onClick={() => setCurrentPageIdx(currentPageIdx - 1)}
                                            className="absolute left-0 top-1/2 -translate-y-1/2 w-8 h-16 bg-slate-100/50 hover:bg-slate-200/80 rounded-r-lg flex items-center justify-center text-slate-400 hover:text-slate-600 transition-all backdrop-blur-sm z-10"
                                            title="이전 페이지 (Left Arrow)"
                                        >
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                                        </button>
                                    )}
                                    {currentPageIdx < pages.length - 1 && (
                                        <button
                                            onClick={() => setCurrentPageIdx(currentPageIdx + 1)}
                                            className="absolute right-0 top-1/2 -translate-y-1/2 w-8 h-16 bg-slate-100/50 hover:bg-slate-200/80 rounded-l-lg flex items-center justify-center text-slate-400 hover:text-slate-600 transition-all backdrop-blur-sm z-10"
                                            title="다음 페이지 (Right Arrow)"
                                        >
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                                        </button>
                                    )}
                                </>
                            ) : (
                                <>
                                    {mockupSpreadIdx > 0 && (
                                        <button
                                            onClick={() => setMockupSpreadIdx(mockupSpreadIdx - 1)}
                                            className="absolute left-0 top-1/2 -translate-y-1/2 w-8 h-16 bg-slate-100/50 hover:bg-slate-200/80 rounded-r-lg flex items-center justify-center text-slate-400 hover:text-slate-600 transition-all backdrop-blur-sm z-10"
                                            title="이전 페이지 (Left Arrow)"
                                        >
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                                        </button>
                                    )}
                                    {mockupSpreadIdx < spreads.length - 1 && (
                                        <button
                                            onClick={() => setMockupSpreadIdx(mockupSpreadIdx + 1)}
                                            className="absolute right-0 top-1/2 -translate-y-1/2 w-8 h-16 bg-slate-100/50 hover:bg-slate-200/80 rounded-l-lg flex items-center justify-center text-slate-400 hover:text-slate-600 transition-all backdrop-blur-sm z-10"
                                            title="다음 페이지 (Right Arrow)"
                                        >
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                                        </button>
                                    )}
                                </>
                            )}
                        </div>

                        {/* Mockup Bottom Controls (Centered below book) */}
                        {activeTab === 'mockup' && (
                            <div className="flex gap-2 mt-1">
                                <button
                                    onClick={() => onToggleTab('edit')}
                                    className="bg-slate-200 hover:bg-slate-300 text-slate-600 text-[11px] font-bold px-4 py-2 rounded-sm shadow-sm transition-colors"
                                >
                                    편집 화면으로 복귀
                                </button>
                                <button
                                    onClick={onDownloadCurrent}
                                    className="bg-slate-200 hover:bg-slate-300 text-slate-600 text-[11px] font-bold px-4 py-2 rounded-sm shadow-sm transition-colors"
                                >
                                    이 페이지 저장
                                </button>
                                <button
                                    onClick={onDownloadAll}
                                    className="bg-slate-200 hover:bg-slate-300 text-slate-600 text-[11px] font-bold px-4 py-2 rounded-sm shadow-sm transition-colors"
                                >
                                    전체 저장
                                </button>
                            </div>
                        )}

                        {/* 2. Minimalist Sidebar (Right) */}
                        {activeTab !== 'mockup' && (
                            <div className="w-[260px] flex flex-col gap-4 -mt-12">

                                {/* Actions */}
                                <div className="flex gap-2 w-full">
                                    <button onClick={onBack} className="flex-1 py-2 px-1 border border-slate-200 rounded-md text-[11px] font-bold text-slate-500 hover:bg-slate-50 hover:text-slate-800 transition-colors whitespace-nowrap">
                                        본문 수정
                                    </button>
                                    <button onClick={onDownloadCurrent} className="flex-1 py-2 px-1 border border-slate-200 rounded-md text-[11px] font-bold text-slate-500 hover:bg-slate-50 hover:text-slate-800 transition-colors whitespace-nowrap">
                                        이 페이지 저장
                                    </button>
                                    <button onClick={onDownloadAll} className="flex-1 py-2 px-1 border border-slate-200 rounded-md text-[11px] font-bold text-slate-500 hover:bg-slate-50 hover:text-slate-800 transition-colors whitespace-nowrap">
                                        전체 저장
                                    </button>
                                </div>

                                {/* Group: Tip + Fonts (Gap-2) */}
                                <div className="flex flex-col gap-2">
                                    {/* Tip: Font First */}
                                    <div className="bg-[#EFEBE9] text-[#5D4037] text-[11px] px-2 py-1 rounded-sm font-medium break-keep opacity-90">
                                        💡 Tip : 폰트를 먼저 확정한 후 도구를 사용하세요.
                                    </div>

                                    {/* Fonts */}
                                    <div className="flex flex-col gap-3">
                                        <span className="text-[11px] font-bold text-slate-400 tracking-wider">서체</span>
                                        <div className="grid grid-cols-3 gap-2">
                                            {['noto', 'nanum', 'jeju', 'gowun', 'ridi', 'maru', 'hahmlet', 'diphylleia'].map((key) => {
                                                const font = window.FONT_MAP[key];
                                                if (!font) return null; // Safety check
                                                return (
                                                    <button
                                                        key={key}
                                                        onClick={() => onFontChange(key)}
                                                        className={`py-2 px-1 text-[11px] border rounded-md transition-all truncate ${activeFont === key ? 'bg-indigo-50 border-indigo-200 text-indigo-700 font-bold' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'}`}
                                                        style={{ fontFamily: font.family }}
                                                        title={font.name}
                                                    >
                                                        {font.name}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>

                                {/* Theme */}
                                <div className="flex flex-col gap-3">
                                    <span className="text-[11px] font-bold text-slate-400 tracking-wider">배경</span>
                                    <div className="flex gap-3">
                                        {['white', 'cream', 'kraft', 'dark'].map(theme => (
                                            <button
                                                key={theme}
                                                onClick={() => onThemeChange(theme)}
                                                className={`w-8 h-8 rounded-full border shadow-sm transition-all ${activeTheme === theme ? 'ring-2 ring-indigo-300 ring-offset-2 scale-110' : 'hover:scale-105'} ${theme === 'white' ? 'bg-white border-slate-200' : theme === 'cream' ? 'bg-[#FDFBF7] border-[#E8E6E1]' : theme === 'kraft' ? 'bg-[#E6DAC3] border-[#D4C5A8]' : 'bg-[#2C2C2C] border-[#1A1A1A]'}`}
                                                title={theme}
                                            />
                                        ))}
                                    </div>
                                </div>

                                {/* Tools Split: Highlighter */}
                                <div className="flex flex-col gap-2 mt-2">
                                    <div className="bg-[#EFEBE9] text-[#5D4037] text-[11px] px-2 py-1 rounded-sm font-medium break-keep opacity-90 mt-2">
                                        🖊️도구 : 드래그하여 적용, 터치하여 삭제
                                    </div>
                                    <span className="text-[11px] font-bold text-slate-400 tracking-wider">형광펜</span>
                                    <div className="grid grid-cols-6 gap-2">
                                        {['highlight-yellow', 'highlight-pink', 'highlight-mint', 'highlight-blue', 'highlight-lavender', 'highlight-apricot'].map((color) => {
                                            const colorMap = {
                                                'highlight-yellow': '#fff59d', 'highlight-pink': '#ffcce0', 'highlight-mint': '#b2dfdb',
                                                'highlight-blue': '#bbdefb', 'highlight-lavender': '#e0b0ff', 'highlight-apricot': '#ffcba4'
                                            };
                                            const bg = colorMap[color];
                                            const isActive = toolMode === 'highlight' && highlightColor === color;

                                            return (
                                                <button
                                                    key={color}
                                                    onClick={() => {
                                                        if (isActive) {
                                                            setToolMode(null);
                                                            setHighlightColor(null);
                                                        } else {
                                                            setToolMode('highlight');
                                                            setHighlightColor(color);
                                                        }
                                                    }}
                                                    className={`w-8 h-8 rounded-full border shadow-sm transition-all flex items-center justify-center ${isActive ? 'ring-2 ring-indigo-300 ring-offset-2 scale-110' : 'hover:scale-105 border-slate-200'}`}
                                                    style={{ backgroundColor: bg }}
                                                    title={`${color.replace('highlight-', '')} 형광펜`}
                                                >
                                                    {isActive && <div className="w-1.5 h-1.5 bg-slate-800 rounded-full opacity-50"></div>}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Tools Split: Text Color (12 Colors 6x2) */}
                                <div className="flex flex-col gap-3">
                                    <span className="text-[11px] font-bold text-slate-400 tracking-wider">글씨색</span>
                                    <div className="grid grid-cols-6 gap-2">
                                        {[
                                            // Warm: Crimson, Terracotta, Mustard, Brown, Cocoa, Olive
                                            'text-crimson', 'text-terracotta', 'text-mustard', 'text-brown', 'text-cocoa', 'text-olive',
                                            // Cool: Forest, Teal, Navy, Midnight, Purple, LightGray
                                            'text-forest', 'text-teal', 'text-navy', 'text-midnight', 'text-purple', 'text-lightgray'
                                        ].map((color) => {
                                            const colorMap = {
                                                // Warm
                                                'text-crimson': '#be123c', 'text-terracotta': '#c2410c', 'text-mustard': '#ca8a04',
                                                'text-brown': '#78350f', 'text-cocoa': '#8d6e63', 'text-olive': '#65a30d',
                                                // Cool
                                                'text-forest': '#15803d', 'text-teal': '#0f766e', 'text-navy': '#1e3a8a',
                                                'text-midnight': '#1e1b4b', 'text-purple': '#6b21a8', 'text-lightgray': '#a1a1aa'
                                            };
                                            const bg = colorMap[color];
                                            const isActive = toolMode === 'text' && textColor === color;

                                            return (
                                                <button
                                                    key={color}
                                                    onClick={() => {
                                                        if (isActive) {
                                                            setToolMode(null);
                                                            setTextColor(null);
                                                        } else {
                                                            setToolMode('text');
                                                            setTextColor(color);
                                                        }
                                                    }}
                                                    className={`w-8 h-8 rounded-full border shadow-sm transition-all flex items-center justify-center ${isActive ? 'ring-2 ring-indigo-300 ring-offset-2 scale-110' : 'hover:scale-105 border-slate-200'}`}
                                                    style={{ backgroundColor: bg }}
                                                    title={color.replace('text-', '')}
                                                >
                                                    {isActive && <div className="w-1.5 h-1.5 bg-white rounded-full shadow-sm"></div>}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* View Switcher */}
                                <button
                                    onClick={() => onToggleTab(activeTab === 'mockup' ? 'edit' : 'mockup', null)}
                                    className={`w-full py-2.5 rounded-md text-xs font-bold transition-all shadow-sm ${activeTab === 'mockup' ? 'bg-[#A47764] text-white hover:bg-[#8c6656]' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                                >
                                    {activeTab === 'mockup' ? '편집 화면으로 복귀' : '책 모양 미리보기'}
                                </button>

                            </div>
                        )}

                        {/* Bottom Exit Button (Fixed) Removed as per request */}
                    </div>
                </div>
            </div>
        );
    };
})();
