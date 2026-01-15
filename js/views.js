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
        { key: 'kyobo', label: '교보 손글씨', sub: 'Kyobo Handwriting' },
        { key: 'diphylleia', label: 'Diphylleia', sub: 'Diphylleia' }
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
                    className={`flex-shrink-0 w-12 h-12 rounded-full border border-slate-200 transition-all ${opt.bg} ${activeTheme === opt.key ? 'ring-2 ring-slate-800 ring-offset-2 scale-110' : 'hover:scale-105'}`}
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
                    className={`flex items-center justify-between p-3 rounded-lg border text-left transition-all group ${activeFont === font.key ? 'bg-[#1C1C1C] border-[#1C1C1C] text-white shadow-md' : 'bg-white border-[#E5E5E5] text-[#1C1C1C] hover:border-[#1C1C1C]'}`}
                >
                    <div>
                        <span className={`block text-sm font-medium ${activeFont === font.key ? 'text-white' : 'text-[#1C1C1C]'}`}>{font.label}</span>
                        <span className={`block text-xs mt-0.5 ${activeFont === font.key ? 'text-gray-400' : 'text-gray-500'}`}>{font.sub}</span>
                    </div>
                    {activeFont === font.key && (<div className="w-2 h-2 rounded-full bg-white"></div>)}
                </button>
            ))}
        </div>
    );

    const ToolSelector = ({ mode, activeColor, onColorChange }) => {
        const colors = mode === 'highlight' ? HIGHLIGHT_COLORS : TEXT_COLORS;
        return (
            <div className="flex flex-col gap-3">
                <p className="text-xs text-slate-500 font-medium text-center mb-1">
                    {mode === 'highlight' ? '텍스트를 드래그하여 형광펜 칠하기' : '텍스트를 드래그하여 글자색 변경하기'}
                </p>
                <div className="flex flex-wrap gap-2 justify-center">
                    {colors.map(c => (
                        <button
                            key={c.key}
                            onClick={() => onColorChange(c.key)}
                            className={`relative w-10 h-10 rounded-full border border-slate-200 transition-all flex items-center justify-center ${activeColor === c.key ? 'ring-2 ring-slate-800 ring-offset-2 scale-110' : 'hover:scale-105'} ${mode === 'text' ? c.bg : ''}`}
                            title={c.label}
                        >
                            {mode === 'highlight' && (
                                <div className={`w-full h-full rounded-full ${c.bg}`}></div>
                            )}
                            {activeColor === c.key && (
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="w-2 h-2 bg-white rounded-full shadow-sm" style={mode === 'highlight' ? { backgroundColor: 'rgba(0,0,0,0.5)' } : {}}></div>
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
        // Mobile Sheet Style
        const containerClass = "flex flex-col gap-6 pb-8";
        const labelClass = "text-xs font-bold text-slate-400 uppercase tracking-wider mb-2";

        return (
            <div className={containerClass}>
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

                {/* Tools Section (Mobile has specific handling via renderedTab in ResultView) */}
            </div>
        );
    };

    window.EditorPanel = EditorPanel;

    // ----------------------------------------------------------------------
    // InfoModal Component [NEW]
    // ----------------------------------------------------------------------
    const InfoModal = ({ isOpen, onClose }) => {
        const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

        useEffect(() => {
            const handleResize = () => setIsMobile(window.innerWidth < 768);
            window.addEventListener('resize', handleResize);
            return () => window.removeEventListener('resize', handleResize);
        }, []);

        if (!isOpen) return null;

        return (
            <div className="fixed inset-0 z-[9999] flex items-end justify-center md:items-center px-4 md:px-0 pb-4 md:pb-0">
                {/* Backdrop */}
                <div
                    className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
                    onClick={onClose}
                ></div>

                {/* Content Container */}
                <div
                    className={`
                        bg-white relative flex flex-col overflow-hidden transition-all shadow-2xl
                        ${isMobile
                            ? 'w-full rounded-3xl animate-slide-up max-h-[85vh]'
                            : 'w-[420px] rounded-2xl animate-fade-in'
                        }
                    `}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-white sticky top-0 z-10">
                        <h2 className="text-lg font-bold text-slate-800">소설 내지 이미지 생성기 v2.0.0</h2>
                        <button onClick={onClose} className="p-2 -mr-2 text-slate-400 hover:text-slate-800 rounded-full hover:bg-slate-50 transition-colors">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Body */}
                    <div className="p-6 overflow-y-auto text-sm text-slate-600 leading-relaxed custom-scrollbar">

                        {/* 1. Intro */}
                        <div className="mb-3">
                            <p className="pb-1 mb-1">본 사이트는 어떠한 개인정보도 수집하지 않습니다. 모든 작업은 귀하의 브라우저에서만 이루어집니다.</p>
                        </div>

                        {/* 2. Warning */}
                        <div className="mb-4">
                            <p className="font-bold mb-2 flex items-center gap-1.5 text-slate-800">
                                <svg className="w-4 h-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                                이용 시 주의사항
                            </p>
                            <ul className="list-disc list-inside space-y-1.5 ml-1 text-slate-600">
                                <li><span className="font-bold text-slate-700">텍스트 인용</span>: 저작권법상 허용 범위 내에서 사용하고 출처를 명시하세요.</li>
                                <li><span className="font-bold text-slate-700">상업적 이용</span>: 생성된 이미지는 상업적으로 사용할 수 없습니다.</li>
                            </ul>
                        </div>

                        {/* 3. Links */}
                        <div className="flex gap-3">
                            <a href="https://yuliyulidaz.github.io/yulilog/" target="_blank"
                                className="flex items-center justify-between p-3 rounded-md border border-slate-300 hover:border-[#A47764] hover:text-[#A47764] transition-all group flex-1"
                                style={{
                                    backgroundImage: 'radial-gradient(#d1d5db 0.5px, transparent 0.5px)',
                                    backgroundSize: '4px 4px',
                                    backgroundColor: '#fff'
                                }}
                            >
                                <span className="font-bold block text-sm bg-white/80 px-1 rounded backdrop-blur-[2px]">발췌 문구 생성기</span>
                                <svg className="w-4 h-4 text-slate-400 group-hover:text-[#A47764] bg-white rounded-full" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                            </a>
                            <a href="https://yulipomo.vercel.app/" target="_blank"
                                className="flex items-center justify-between p-3 rounded-md border border-slate-300 hover:border-[#A47764] hover:text-[#A47764] transition-all group flex-1"
                                style={{
                                    backgroundImage: 'radial-gradient(#d1d5db 0.5px, transparent 0.5px)',
                                    backgroundSize: '4px 4px',
                                    backgroundColor: '#fff'
                                }}
                            >
                                <span className="font-bold block text-sm bg-white/80 px-1 rounded backdrop-blur-[2px]">최애 뽀모도로</span>
                                <svg className="w-4 h-4 text-slate-400 group-hover:text-[#A47764] bg-white rounded-full" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    // ----------------------------------------------------------------------
    // InputView Component
    // ----------------------------------------------------------------------

    window.InputView = ({
        showUndo, onUndo, inputToast, onDelete,
        textInput, setTextInput, metadata, setMetadata,
        activeTheme, setActiveTheme, activeFont, setActiveFont,
        pageSize, setPageSize, onStartGeneration, textAreaRef
    }) => {
        const ghostRef = React.useRef(null);
        const [isCurlyQuotes, setIsCurlyQuotes] = useState(false);
        const [isSpacedDialogue, setIsSpacedDialogue] = useState(false);
        const [estimatedPages, setEstimatedPages] = useState(0);
        const [showInfoModal, setShowInfoModal] = useState(false);

        // History Stack
        const [history, setHistory] = useState([textInput]);
        const [historyIndex, setHistoryIndex] = useState(0);

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
        useEffect(() => {
            if (history.length === 1 && history[0] === '' && textInput !== '') {
                setHistory([textInput]);
            }
        }, []);

        // Auto-resize textarea using Ghost Replica
        React.useLayoutEffect(() => {
            if (textAreaRef.current && ghostRef.current) {
                textAreaRef.current.style.height = ghostRef.current.scrollHeight + 'px';
            }
        }, [textInput]);

        const handleTextChange = (e) => {
            const val = e.target.value;
            setTextInput(val);
        };

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

        const insertText = (text, moveCursorOffset = 0) => {
            if (!textAreaRef.current) return;
            const start = textAreaRef.current.selectionStart;
            const end = textAreaRef.current.selectionEnd;
            const newText = textInput.substring(0, start) + text + textInput.substring(end);

            setTextInput(newText);
            addToHistory(newText);

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
                console.warn('Clipboard paste failed:', err);
                alert('보안 문제로 붙여넣기가 차단되었습니다.\n입력창을 길게 눌러 붙여넣기 해주세요.');
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

            const checkIsDialogue = (str) => str.startsWith('“') || str.startsWith('"') || str.startsWith('❘') || str.startsWith('|');

            if (newState) {
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
                        if (trimmed !== '' && prevTrimmed !== '') {
                            if ((!isPrevDialogue && isCurrentDialogue) || (isPrevDialogue && !isCurrentDialogue)) {
                                processedLines.push('');
                            }
                        }
                    }
                    processedLines.push(line);
                }
                newText = processedLines.join('\n');
                newText = newText.replace(/([ \t])([“"])/g, '$1\n$2');
            } else {
                const lines = textInput.split('\n');
                const compactLines = [];
                for (let i = 0; i < lines.length; i++) {
                    const line = lines[i];
                    const trimmed = line.trim();
                    if (trimmed === '') {
                        const nextLine = (i < lines.length - 1) ? lines[i + 1].trim() : '';
                        const prevLine = (i > 0) ? lines[i - 1].trim() : '';

                        const isNextDialogue = checkIsDialogue(nextLine);
                        const isPrevDialogue = checkIsDialogue(prevLine);
                        const isPrevNarration = !isPrevDialogue && prevLine !== '';
                        const isNextNarration = !isNextDialogue && nextLine !== '';

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
        useEffect(() => {
            const timer = setTimeout(() => {
                if (!window.calculatePages) return;
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



        // Auto-resize textarea using Ghost Element (Jitter-free)
        React.useLayoutEffect(() => {
            if (textAreaRef.current && ghostRef.current) {
                // 1. Copy value to ghost
                ghostRef.current.value = textInput;

                // 2. Sync width (just in case)
                ghostRef.current.style.width = getComputedStyle(textAreaRef.current).width;

                // 3. Measure ghost height
                const height = ghostRef.current.scrollHeight;

                // 4. Set real textarea height
                textAreaRef.current.style.height = height + 'px';
            }
        }, [textInput, pageSize]); // Add pageSize dependency in case width changes

        return (
            <div className="min-h-screen bg-white" >
                {/* 1. Header (Fixed, Full Width Background, Constrained Content) */}
                <div className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-slate-100 z-[60]">
                    <div className="w-full max-w-3xl mx-auto h-full px-8 md:px-12 flex items-center justify-between">
                        <div className="flex items-center gap-2 truncate mr-2">
                            <h1 className="font-serif font-bold text-slate-800 truncate flex items-center">
                                <span className="md:hidden text-lg">📄</span>
                                <span className="hidden md:inline text-xl">소설 내지 이미지 생성기</span>
                            </h1>
                            <button
                                onClick={() => setShowInfoModal(true)}
                                className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-full hover:bg-slate-100 flex-shrink-0"
                                aria-label="정보"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </button>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0">
                            {estimatedPages > 0 && <span className="text-xs font-bold text-slate-400">약 {estimatedPages}페이지 예상</span>}
                            <button
                                onClick={onStartGeneration}
                                className="bg-[#1C1C1C] hover:bg-black text-white px-3 py-1.5 rounded-lg text-sm font-bold transition-all shadow-md active:scale-95 whitespace-nowrap"
                            >
                                만들기
                            </button>
                        </div>
                    </div>
                </div>

                {/* Info Modal */}
                <InfoModal isOpen={showInfoModal} onClose={() => setShowInfoModal(false)} />

                {/* 2. Toolbar (Fixed, Full Width Background, Constrained Content) */}
                <div className="fixed top-16 left-0 right-0 bg-white/95 backdrop-blur border-b border-slate-100 z-50 shadow-sm py-2 md:py-0 md:h-14">
                    <div className="w-full max-w-3xl mx-auto h-full px-4 md:px-12 flex flex-wrap md:flex-nowrap items-center justify-between gap-y-2 md:gap-y-0">

                        {/* Group 1: Delete, Paste, Undo/Redo, Size */}
                        <div className="flex w-full md:w-auto items-center justify-between md:justify-start gap-2">
                            {/* Delete Button (Coral Icon) */}
                            <div className="relative">
                                <button
                                    onClick={onDelete}
                                    className="flex items-center justify-center w-8 h-8 text-rose-500 hover:text-rose-600 transition-colors rounded-full hover:bg-rose-50"
                                    aria-label="삭제"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                </button>
                                {inputToast && <div className="absolute top-8 left-0 w-max bg-slate-800 text-white text-xs px-3 py-1.5 rounded shadow-lg z-[100] animate-fade-in-out">{inputToast}</div>}
                                {showUndo && <div className="absolute top-8 left-0 w-max bg-slate-800 text-white px-3 py-1.5 rounded shadow-lg flex items-center gap-2 text-xs z-[100] cursor-pointer animate-fade-in-out" onClick={onUndo}><span>취소</span><svg className="w-3 h-3 text-white/70" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></div>}
                            </div>

                            {/* Paste */}
                            <button onClick={handlePaste} className="flex-shrink-0 flex items-center justify-center text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors px-1">붙여넣기</button>

                            {/* Undo / Redo */}
                            <div className="flex items-center gap-1">
                                <button onClick={handleUndo} disabled={historyIndex <= 0} className={`p-1 rounded-full ${historyIndex > 0 ? 'hover:bg-slate-100 text-slate-500' : 'text-slate-200'}`}><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg></button>
                                <button onClick={handleRedo} disabled={historyIndex >= history.length - 1} className={`p-1 rounded-full ${historyIndex < history.length - 1 ? 'hover:bg-slate-100 text-slate-500' : 'text-slate-200'}`}><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6" /></svg></button>
                            </div>

                            <div className="w-px h-4 bg-slate-200 mx-1"></div>

                            {/* Paper Size */}
                            <div className="flex items-center">
                                <select value={pageSize} onChange={(e) => setPageSize(e.target.value)} className="bg-transparent text-xs font-bold text-slate-500 outline-none cursor-pointer py-1 text-center hover:text-slate-800 transition-colors">
                                    {Object.entries(window.PAPER_SIZES)
                                        .filter(([_, config]) => !config.hidden)
                                        .map(([key, config]) => (
                                            <option key={key} value={key}>{config.label}</option>
                                        ))}
                                </select>
                            </div>
                        </div>

                        {/* PC Divider (Hidden on Mobile) */}
                        <div className="hidden md:block w-px h-6 bg-slate-200 mx-1"></div>

                        {/* Group 2: Symbols, Quote Change, Spacing */}
                        <div className="flex w-full md:w-auto items-center justify-start md:justify-end gap-1 md:gap-2 overflow-x-auto md:overflow-visible no-scrollbar px-1 md:px-0">
                            {/* Symbols */}
                            <div className="flex items-center gap-1 font-serif text-slate-500 flex-shrink-0">
                                <button onClick={() => insertText('“ ”', -2)} className="w-8 h-8 flex items-center justify-center hover:bg-slate-100 rounded text-lg font-bold pb-1">“ ”</button>
                                <button onClick={() => insertText('‘ ’', -2)} className="w-8 h-8 flex items-center justify-center hover:bg-slate-100 rounded text-lg font-bold pb-1">‘ ’</button>
                                <button onClick={() => insertText('……')} className="w-8 h-8 flex items-center justify-center hover:bg-slate-100 rounded text-sm font-bold">…</button>
                                <button onClick={() => insertText('—')} className="w-8 h-8 flex items-center justify-center hover:bg-slate-100 rounded text-sm font-bold">—</button>
                                <button onClick={() => insertText('***')} className="w-8 h-8 flex items-center justify-center hover:bg-slate-100 rounded text-sm font-bold">***</button>
                            </div>

                            <div className="w-px h-4 bg-slate-200 flex-shrink-0"></div>

                            {/* Text Actions */}
                            <div className="flex items-center gap-3 flex-shrink-0 pr-4 md:pr-0">
                                <button onClick={handleQuoteToggle} className={`flex items-center gap-1.5 text-xs font-bold transition-all whitespace-nowrap ${isCurlyQuotes ? 'text-[#1C1C1C]' : 'text-slate-500 md:hover:text-slate-800'}`}>따옴표변경</button>
                                <button onClick={handleSpacingToggle} className={`flex items-center gap-1.5 text-xs font-bold transition-all whitespace-nowrap ${isSpacedDialogue ? 'text-[#1C1C1C]' : 'text-slate-500 md:hover:text-slate-800'}`}><svg className="w-3 h-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" /></svg>대사간격</button>
                            </div>
                        </div>

                    </div>
                </div>

                {/* 3. Document Area */}
                <div className="relative pt-52 md:pt-40 pb-[50vh] md:pb-32 max-w-3xl mx-auto px-8 md:px-12 [overflow-anchor:none] flex flex-col items-center">
                    <input type="text" value={metadata.title} onChange={e => setMetadata({ ...metadata, title: e.target.value })} placeholder="필요 시 소제목을 입력하세요." className="w-full text-2xl md:text-3xl font-bold font-serif text-slate-800 placeholder:text-slate-300 border-none p-0 focus:ring-0 bg-transparent mb-4 tracking-tight outline-none relative z-20 pointer-events-auto" style={{ maxWidth: '100%' }} />
                    <div className="flex flex-col gap-1 mb-4 w-full relative z-20 pointer-events-auto">
                        <input type="text" value={metadata.author} onChange={e => setMetadata({ ...metadata, author: e.target.value })} placeholder="제작자명" className="w-full text-sm text-slate-500 placeholder:text-slate-300 border-none p-0 focus:ring-0 bg-transparent outline-none font-medium" />
                        <div className="flex gap-4">
                            <input type="text" value={metadata.producer} onChange={e => setMetadata({ ...metadata, producer: e.target.value })} placeholder="캐릭터" className="w-auto text-sm text-slate-400 placeholder:text-slate-300 border-none p-0 focus:ring-0 bg-transparent outline-none" />
                        </div>
                    </div>
                    <hr className="border-slate-100 mb-4 w-full" />

                    {/* Wrapper for Relative Positioning */}
                    <div className="relative w-full">
                        {/* Rich Placeholder Overlay */}
                        {!textInput && (
                            <div className="absolute top-0 left-0 w-full z-0 pointer-events-none select-none">
                                <div className="text-slate-300 leading-[1.8] font-serif text-base">
                                    <p>여기에 소설 본문을 붙여넣으세요.</p>
                                    <p>엔터로 줄바꿈을 하면 빈 줄이 적용됩니다.</p>
                                    <p>*** 를 입력하면 장면 전환 기호로 (중앙 정렬)이 적용됩니다.</p>
                                </div>
                                <strong className="block mb-2 text-indigo-400 text-base">📢 2026.01.15 업데이트 안내 (v2.0.0)</strong>
                                <div className="text-slate-300 leading-[2.0] font-serif text-base">
                                    <p><strong>· 입력창 전면 개편</strong> 기존 기능이 상단에 모두 고정, 텍스트 편집에 보다 더 집중할 수 있게 되었습니다.</p>
                                    <p><strong>· A5 추가</strong> 조금 더 많은 텍스트를 넣을 수 있습니다.</p>
                                    <p><strong>· 폰트 추가</strong> 제주명조, 산수국이 추가 되었습니다.</p>
                                    <p><strong>· 형광펜, 글자색 추가</strong> 더 다양한 색으로 당신의 문장을 강조하세요.</p>
                                </div>
                            </div>
                        )}

                        {/* Real Textarea */}
                        <textarea
                            ref={textAreaRef}
                            value={textInput}
                            onChange={handleTextChange}
                            onBlur={() => addToHistory(textInput)}
                            className="w-full min-h-[500px] text-base leading-[1.8] text-slate-700 border-none p-0 focus:ring-0 bg-transparent resize-none font-serif outline-none overflow-hidden relative z-10"
                            spellCheck={false}
                            autoComplete="off"
                            autoCorrect="off"
                            autoCapitalize="off"
                        ></textarea>
                    </div>

                    {/* Shadow (Ghost) Textarea for Height Verification */}
                    <textarea
                        ref={ghostRef}
                        aria-hidden="true"
                        readOnly
                        className="fixed top-[-9999px] left-[-9999px] w-full min-h-[500px] text-base leading-[1.8] text-slate-700 font-serif p-0 border-none bg-transparent resize-none overflow-hidden -z-50 opacity-0 pointer-events-none invisible"
                        tabIndex={-1}
                    ></textarea>
                </div>
            </div >
        );
    };

    // ----------------------------------------------------------------------
    // ResultView Component (MONO CHIC THEME)
    // ----------------------------------------------------------------------
    window.ResultView = (props) => {
        const {
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
        } = props;

        const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

        useEffect(() => {
            const handleResize = () => {
                setIsMobile(window.innerWidth < 1024);
            };
            window.addEventListener('resize', handleResize);
            return () => window.removeEventListener('resize', handleResize);
        }, []);

        // ----------------------------------------------------------------------
        // [NEW] Mobile Layout Integration
        // ----------------------------------------------------------------------
        const [pcTab, setPcTab] = useState('font'); // Default to Font

        // Hooks must be unconditional
        // ... (other hooks are fine if they are at top level)

        // ----------------------------------------------------------------------
        // [NEW] Mobile Layout Integration (Render Logic)
        // ----------------------------------------------------------------------
        if (isMobile && window.MobileLayout) {
            return <window.MobileLayout {...props} />;
        }


        const navItems = [
            { id: 'theme', icon: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" /></svg>, label: '테마' },
            { id: 'style', icon: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16m-7 6h7" /></svg>, label: '폰트' },
            { id: 'highlight', icon: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>, label: '형광펜' },
            { id: 'text', icon: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" /></svg>, label: '글자색' },
            { id: 'mockup', icon: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>, label: '목업' }
        ];

        return (
            <div className="min-h-screen bg-[#FAFAFA] flex flex-col text-[#1C1C1C]">
                {/* ----------------- MOBILE LAYOUT (Preserved) ----------------- */}
                <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 flex flex-col">
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
                                    <button onClick={onDownloadAll} className="flex-1 py-3 bg-[#1C1C1C] text-white rounded-xl shadow-lg font-medium text-sm">전체 저장</button>
                                    <button onClick={onDownloadCurrent} className="flex-1 py-3 bg-white border border-[#E5E5E5] text-[#1C1C1C] rounded-xl font-medium text-sm">현재 장면 저장</button>
                                </div>
                            )}
                            <div className="flex justify-center mt-3" onClick={() => onToggleTab(activeTab, null)}>
                                <div className="w-10 h-1 rounded-full bg-slate-200"></div>
                            </div>
                        </div>
                    </div>
                    {/* Mobile Bottom Nav */}
                    <div className="bg-white border-t border-slate-200 px-6 py-2 pb-safe flex justify-between items-center relative z-50">
                        <button onClick={onBack} className="p-2 -ml-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-50 transition-all">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                        </button>
                        <div className="flex gap-1">
                            {navItems.map(item => (
                                <button
                                    key={item.id}
                                    onClick={() => onToggleTab(item.id, item.id === 'highlight' ? 'highlight' : item.id === 'text' ? 'text' : null)}
                                    className={`flex flex-col items-center justify-center w-14 h-12 rounded-xl transition-all ${activeTab === item.id ? 'text-[#1C1C1C] bg-gray-100' : 'text-slate-400 hover:text-slate-600'}`}
                                >
                                    {item.icon}
                                    <span className="text-[10px] mt-0.5 font-medium">{item.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* ----------------- DESKTOP LAYOUT (Mono Chic) ----------------- */}
                {/* Header: White with Thin Black Border */}


                {/* Main Body: Centered Layout */}
                <div className="flex-1 flex flex-col items-center justify-center bg-[#EAE8E3] overflow-y-auto relative min-h-0 py-10">

                    {/* Header: White (No Border) */}
                    {/* Header: Transparent, Minimal Buttons, Centered Page Count */}
                    <header
                        className="hidden lg:flex h-[60px] items-center justify-between px-6 z-20 relative shrink-0 transition-all duration-300 mb-2"
                        style={{
                            width: activeTab !== 'mockup'
                                ? `calc(${(window.PAPER_SIZES[pageSize] ? window.PAPER_SIZES[pageSize].width : window.PAPER_SIZES['A6'].width)} + 300px + 24px)`
                                : `calc(${(window.PAPER_SIZES[pageSize] ? window.PAPER_SIZES[pageSize].width : window.PAPER_SIZES['A6'].width)} * 2)`
                        }}
                    >
                        {/* Left: Back Button Only */}
                        <div className="flex items-center">
                            <button
                                onClick={activeTab === 'mockup' ? () => onToggleTab('style', 'style') : onBack}
                                className="flex items-center gap-2 text-[#888888] hover:text-[#1C1C1C] transition-colors font-bold text-xs"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                                {activeTab === 'mockup' ? '편집화면' : '본문 수정'}
                            </button>
                        </div>

                        {/* Center: Page Count (Absolute Positioned for Paper Centering) */}
                        <span className={`absolute left-1/2 -translate-x-1/2 ${activeTab !== 'mockup' ? '-ml-[158px]' : ''} text-[#1C1C1C] font-bold text-sm select-none`}>
                            {activeTab === 'mockup' ? `${mockupSpreadIdx + 1} / ${spreads.length}` : `${currentPageIdx + 1} / ${pages.length}`}
                        </span>

                        {/* Right: Minimalist Text Actions */}
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => onToggleTab(activeTab === 'mockup' ? 'theme' : 'mockup', false)}
                                className={`text-xs font-bold transition-colors ${activeTab === 'mockup' ? 'text-[#1C1C1C]' : 'text-[#888888] hover:text-[#1C1C1C]'}`}
                            >
                                {activeTab === 'mockup' ? '편집 화면' : '목업'}
                            </button>
                            <div className="w-px h-3 bg-[#E5E5E5]"></div>
                            <button
                                onClick={onDownloadCurrent}
                                className="text-xs font-bold text-[#888888] hover:text-[#1C1C1C] transition-colors"
                            >
                                이 페이지 저장
                            </button>
                            <button
                                onClick={onDownloadAll}
                                className="text-xs font-bold text-[#888888] hover:text-[#1C1C1C] transition-colors"
                            >
                                전체 저장
                            </button>
                        </div>
                    </header>

                    {/* Content Wrapper: Centers Paper + Sidebar */}
                    <div className={`flex items-start transition-all duration-300 ${activeTab !== 'mockup' ? 'gap-4 pl-4 pr-4 py-2' : 'gap-0 justify-center w-full p-6'}`}>

                        {/* Main Canvas Area */}
                        <main className="relative flex-none flex items-center justify-center outline-none">

                            {/* Content */}
                            <div className="relative flex items-center justify-center">
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
                                    <div id="captureTarget"
                                        className={`page-container theme-${activeTheme} ${window.PAPER_SIZES[pageSize]?.className || ''} transition-all duration-300 shadow-sm`}
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
                                            contentRef={desktopContentRef}
                                        />
                                        <window.PageFooter pageIdx={currentPageIdx} metadata={metadata} activeFont={activeFont} pageSize={pageSize} />
                                    </div>
                                )}

                                {/* Navigation Overlay (Inside Paper, Centered, Long Rectangle) */}
                                {activeTab === 'mockup' ? (
                                    <>
                                        {mockupSpreadIdx > 0 && (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setMockupSpreadIdx(mockupSpreadIdx - 1); }}
                                                className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-32 bg-white/30 hover:bg-white/90 border border-black/5 hover:border-black/20 rounded shadow-sm backdrop-blur-sm flex items-center justify-center text-[#1C1C1C]/50 hover:text-[#1C1C1C] transition-all z-50 print:hidden"
                                            >
                                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" /></svg>
                                            </button>
                                        )}
                                        {mockupSpreadIdx < spreads.length - 1 && (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setMockupSpreadIdx(mockupSpreadIdx + 1); }}
                                                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-32 bg-white/30 hover:bg-white/90 border border-black/5 hover:border-black/20 rounded shadow-sm backdrop-blur-sm flex items-center justify-center text-[#1C1C1C]/50 hover:text-[#1C1C1C] transition-all z-50 print:hidden"
                                            >
                                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" /></svg>
                                            </button>
                                        )}
                                    </>
                                ) : (
                                    <>
                                        {currentPageIdx > 0 && (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setCurrentPageIdx(currentPageIdx - 1); }}
                                                className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-32 bg-white/30 hover:bg-white/90 border border-black/5 hover:border-black/20 rounded shadow-sm backdrop-blur-sm flex items-center justify-center text-[#1C1C1C]/50 hover:text-[#1C1C1C] transition-all z-50 print:hidden"
                                            >
                                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" /></svg>
                                            </button>
                                        )}
                                        {currentPageIdx < pages.length - 1 && (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setCurrentPageIdx(currentPageIdx + 1); }}
                                                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-32 bg-white/30 hover:bg-white/90 border border-black/5 hover:border-black/20 rounded shadow-sm backdrop-blur-sm flex items-center justify-center text-[#1C1C1C]/50 hover:text-[#1C1C1C] transition-all z-50 print:hidden"
                                            >
                                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" /></svg>
                                            </button>
                                        )}
                                    </>
                                )}
                            </div>
                        </main>

                        {/* Right Sidebar: Floating Window Style */}
                        {
                            activeTab !== 'mockup' && (
                                <aside
                                    className="hidden lg:flex flex-col w-[300px] bg-white border border-[#1C1C1C] shadow-lg z-30 rounded-lg overflow-hidden shrink-0 transition-all duration-300"
                                    style={{
                                        height: window.PAPER_SIZES[pageSize] ? window.PAPER_SIZES[pageSize].height : window.PAPER_SIZES['A6'].height
                                    }}
                                >
                                    {/* Tabs - Invert Style */}
                                    <div className="flex border-b border-[#1C1C1C] shrink-0">
                                        {['font', 'theme', 'highlight', 'text'].map(tab => (
                                            <button
                                                key={tab}
                                                onClick={() => {
                                                    setPcTab(tab);
                                                    if (tab === 'highlight') setToolMode('highlight');
                                                    else if (tab === 'text') setToolMode('text');
                                                    else setToolMode(null);
                                                }}
                                                className={`flex-1 h-14 flex flex-col items-center justify-end pb-3 text-xs font-bold transition-all uppercase tracking-wider ${pcTab === tab ? 'text-[#1C1C1C]' : 'bg-white text-[#888888] hover:text-[#1C1C1C] hover:bg-gray-50'}`}
                                            >
                                                {pcTab === tab && <div className="w-1 h-1 bg-[#1C1C1C] rounded-full mb-1"></div>}
                                                {{ 'font': '서체', 'theme': '배경', 'highlight': '형광펜', 'text': '글자색' }[tab]}
                                            </button>
                                        ))}
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 overflow-y-auto p-5 scrollbar-thin scrollbar-thumb-gray-300">

                                        {/* 1. Fonts Tab */}
                                        {pcTab === 'font' && (
                                            <div className="flex flex-col gap-4 animate-fade-in">
                                                <div
                                                    className="bg-white text-[#1C1C1C] text-[11px] px-3 py-3 rounded-none font-medium leading-relaxed shadow-sm break-keep text-center"
                                                >
                                                    💡 폰트를 먼저 고른 후에<br />
                                                    형광펜 / 글자색을 사용하세요.
                                                </div>
                                                <div className="grid grid-cols-2 gap-2">
                                                    {['noto', 'nanum', 'jeju', 'gowun', 'maru', 'hahmlet', 'diphylleia'].map((key) => {
                                                        const font = window.FONT_MAP[key];
                                                        if (!font) return null;
                                                        const isActive = activeFont === key;
                                                        return (
                                                            <button
                                                                key={key}
                                                                onClick={() => onFontChange(key)}
                                                                className={`flex items-center justify-center py-3 text-[12px] border transition-all rounded-none ${isActive ? 'border-[#1C1C1C] text-[#1C1C1C] font-bold' : 'bg-white border-[#E5E5E5] text-[#1C1C1C] hover:border-[#1C1C1C]'}`}
                                                                style={{
                                                                    fontFamily: font.family,
                                                                    ...(isActive ? {
                                                                        backgroundColor: '#ffffff',
                                                                        backgroundImage: 'radial-gradient(rgba(28, 28, 28, 0.3) 0.4px, transparent 0.4px)',
                                                                        backgroundSize: '1.5px 1.5px'
                                                                    } : {})
                                                                }}
                                                                title={font.name}
                                                            >
                                                                {font.name}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}

                                        {/* 2. Theme Tab */}
                                        {pcTab === 'theme' && (
                                            <div className="flex flex-col gap-4 animate-fade-in">
                                                <div className="flex justify-between items-center px-2">
                                                    {['white', 'cream', 'kraft', 'dark'].map(theme => (
                                                        <button
                                                            key={theme}
                                                            onClick={() => onThemeChange(theme)}
                                                            className={`w-10 h-10 rounded-full border shadow-sm transition-all ${activeTheme === theme ? 'ring-1 ring-gray-300 ring-offset-2 scale-110' : 'hover:scale-105'} ${theme === 'white' ? 'bg-white border-[#E5E5E5]' : theme === 'cream' ? 'bg-[#FDFBF7] border-[#E8E6E1]' : theme === 'kraft' ? 'bg-[#E6DAC3] border-[#D4C5A8]' : 'bg-[#2C2C2C] border-[#1A1A1A]'}`}
                                                            title={theme}
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* 3. Highlighter Tab */}
                                        {pcTab === 'highlight' && (
                                            <div className="flex flex-col gap-4 animate-fade-in">
                                                <div
                                                    className="bg-white text-[#1C1C1C] text-[11px] px-3 py-3 rounded-none font-medium leading-relaxed shadow-sm break-keep text-center"
                                                >
                                                    🖍️ 드래그하여 적용, 터치하여 삭제
                                                </div>
                                                <div className="grid grid-cols-4 gap-y-4 place-items-center mt-2">
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
                                                                    if (isActive) { setToolMode(null); setHighlightColor(null); }
                                                                    else { setToolMode('highlight'); setHighlightColor(color); }
                                                                }}
                                                                className={`w-9 h-9 rounded-full border shadow-sm transition-all flex items-center justify-center ${isActive ? 'ring-1 ring-gray-300 ring-offset-2 scale-110 border-transparent' : 'hover:scale-105 border-[#E5E5E5]'}`}
                                                                style={{ backgroundColor: bg }}
                                                                title={`${color.replace('highlight-', '')} 형광펜`}
                                                            />
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}

                                        {/* 4. Text Color Tab */}
                                        {pcTab === 'text' && (
                                            <div className="flex flex-col gap-4 animate-fade-in">
                                                <div
                                                    className="bg-white text-[#1C1C1C] text-[11px] px-3 py-3 rounded-none font-medium leading-relaxed shadow-sm break-keep text-center"
                                                >
                                                    🖌️ 드래그하여 적용, 터치하여 삭제
                                                </div>
                                                <div className="grid grid-cols-4 gap-y-4 place-items-center mt-2">
                                                    {[
                                                        'text-crimson', 'text-terracotta', 'text-mustard', 'text-brown', 'text-cocoa', 'text-olive',
                                                        'text-forest', 'text-teal', 'text-navy', 'text-midnight', 'text-purple', 'text-lightgray'
                                                    ].map((color) => {
                                                        const colorMap = {
                                                            'text-crimson': '#be123c', 'text-terracotta': '#c2410c', 'text-mustard': '#ca8a04',
                                                            'text-brown': '#78350f', 'text-cocoa': '#8d6e63', 'text-olive': '#65a30d',
                                                            'text-forest': '#15803d', 'text-teal': '#0f766e', 'text-navy': '#1e3a8a',
                                                            'text-midnight': '#1e1b4b', 'text-purple': '#6b21a8', 'text-lightgray': '#a1a1aa'
                                                        };
                                                        const bg = colorMap[color];
                                                        const isActive = toolMode === 'text' && textColor === color;
                                                        return (
                                                            <button
                                                                key={color}
                                                                onClick={() => {
                                                                    if (isActive) { setToolMode(null); setTextColor(null); }
                                                                    else { setToolMode('text'); setTextColor(color); }
                                                                }}
                                                                className={`w-10 h-10 rounded-full border shadow-sm transition-all flex items-center justify-center ${isActive ? 'ring-1 ring-gray-300 ring-offset-2 scale-110 border-transparent' : 'hover:scale-105 border-[#E5E5E5]'}`}
                                                                style={{ backgroundColor: bg }}
                                                            />
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}

                                    </div>
                                </aside>
                            )
                        }

                    </div >
                </div >
            </div >
        );
    };
})();
