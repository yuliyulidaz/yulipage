// React hooks are now global via utils.js

// ----------------------------------------------------------------------
// 2. Extracted Components (For Mockup & Preview)
// ----------------------------------------------------------------------

window.PageContent = ({ pageIdx, pages, pageHighlights, metadata, activeFont, onMouseUp, onClick, contentRef, pageSize = 'A6' }) => {
    const page = pages[pageIdx];
    if (!page) return null;

    const fontFamily = window.FONT_MAP[activeFont] ? window.FONT_MAP[activeFont].family : 'serif';

    // STRICT TYPOGRAPHY ENFORCEMENT (Must match core.js calculator)
    const isA6 = pageSize === 'A6';
    const isA5 = pageSize === 'A5';

    let typography;
    if (isA6) {
        typography = {
            fontSize: '12px',
            lineHeight: '22px',
            letterSpacing: '-0.03em',
            textIndent: '12px'
        };
    } else if (isA5) {
        typography = {
            fontSize: '14px',
            lineHeight: '25px',
            letterSpacing: '-0.02em',
            textIndent: '14px'
        };
    } else if (pageSize === 'SHIN') {
        typography = {
            fontSize: '13px',
            lineHeight: '23px',
            letterSpacing: '-0.03em',
            textIndent: '13px'
        };
    } else {
        typography = {
            fontSize: '11.5px', // Default/Other
            lineHeight: '1.8',
            letterSpacing: '-0.02em',
            textIndent: '1em'
        };
    }

    if (pageHighlights && pageHighlights[pageIdx]) {
        return (
            <div
                ref={contentRef}
                className="page-content"
                onMouseUp={onMouseUp}
                onTouchEnd={onMouseUp}
                onClick={onClick}
                style={{ fontFamily, ...typography }}
                dangerouslySetInnerHTML={{ __html: pageHighlights[pageIdx] }}
            />
        );
    }

    // Title Size Logic: Maintain hierarchy with body text
    // A6 (12px body) -> 16px title (~1.33x)
    // A5/SHIN (13-14px body) -> 19px title (~1.35x)
    const titleFontSize = (pageSize === 'A5' || pageSize === 'SHIN') ? '19px' : '16px';

    return (
        <div ref={contentRef} className="page-content" onMouseUp={onMouseUp} onTouchEnd={onMouseUp} onClick={onClick} style={{ fontFamily, ...typography }}>
            {pageIdx === 0 && metadata.title && metadata.title.trim().length > 0 && (
                <div style={{ height: `${window.LAYOUT_CONFIG.TITLE_PLACEHOLDER_HEIGHT}px`, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', marginBottom: `${window.LAYOUT_CONFIG.TITLE_PADDING_BOTTOM}px` }}>
                    <h1 className="font-normal text-center px-4" style={{ fontFamily, fontSize: titleFontSize, letterSpacing: '0.1em', lineHeight: 1.8, maxHeight: '70px', overflow: 'hidden', opacity: 0.8, textIndent: '0' }}>
                        {metadata.title}
                    </h1>
                    <div className="w-8 h-[1px] bg-current opacity-30 mx-auto mt-14"></div>
                </div>
            )}
            {page.paragraphs.map((p, i) => (
                <p key={i}
                    className={p.isContinued ? 'continued' : ''}
                    style={{
                        fontFamily,
                        lineHeight: typography.lineHeight, // Enforce strict line height on P
                        marginBottom: 0,
                        textAlign: p.isSceneBreak ? 'center' : undefined,
                        textIndent: p.isSceneBreak ? '0' : (p.isContinued ? 0 : typography.textIndent)
                    }}>
                    {p.text}
                </p>
            ))}
        </div>
    );
};

window.PageFooter = ({ pageIdx, isRight, metadata, activeFont, pageSize }) => {
    const isOdd = (pageIdx + 1) % 2 !== 0;
    const alignRight = isRight !== undefined ? isRight : isOdd;
    const fontFamily = window.FONT_MAP[activeFont] ? window.FONT_MAP[activeFont].family : 'inherit';

    // A5: 11px font size, 50px offset from bottom (absolute positioning handled via style props or flex logic)
    // Actually, A5 footer needs specific styles. If A6 uses absolute, A5 should too for precision.
    // However, the user request says "Inside bottom margin (50px)". 
    // If we use absolute positioning here, we can enforce it.

    const isA5 = pageSize === 'A5';
    const isShin = pageSize === 'SHIN';

    let footerStyle;

    if (isA5) {
        footerStyle = {
            fontSize: '11px',
            letterSpacing: '0.05em',
            opacity: 0.5,
            fontFamily,
            position: 'absolute',
            bottom: '60px',
            left: '70px',
            right: '70px',
            display: 'flex',
            alignItems: 'flex-end',
            height: 'auto',
            padding: '0',
            margin: '0'
        };
    } else if (isShin) {
        footerStyle = {
            fontSize: '10px',
            letterSpacing: '0.05em',
            opacity: 0.5,
            fontFamily,
            position: 'absolute',
            bottom: '45px',
            left: '65px',
            right: '65px',
            display: 'flex',
            alignItems: 'flex-end',
            height: 'auto',
            padding: '0',
            margin: '0'
        };
    } else {
        // Default (A6)
        footerStyle = { fontSize: '9.5px', letterSpacing: '0.05em', opacity: 0.5, fontFamily };
    }

    return (
        <div className={`page-footer-area ${alignRight ? 'justify-end' : 'justify-start'}`} style={footerStyle}>
            <div className={`flex items-center gap-2 ${alignRight ? 'flex-row' : 'flex-row-reverse'}`}>
                {(metadata.producer || metadata.author) && (
                    <span>{[metadata.author, metadata.producer].filter(Boolean).join(' · ')}</span>
                )}
                <span className="font-normal opacity-70">{pageIdx + 1}</span>
            </div>
        </div>
    );
};

window.Flyleaf = ({ isFront, isHidden, text, setText, onEdit }) => {
    const hasContent = text && text.trim().length > 0;
    const mobile = window.isMobile();

    if (isHidden && !hasContent) {
        return <div className={`flyleaf ${isFront ? 'front' : 'back'}`}></div>;
    }

    const handleChange = (e) => {
        const val = e.target.value;
        const lines = val.split('\n');
        if (lines.length > 6) {
            setText(lines.slice(0, 6).join('\n'));
        } else {
            setText(val);
        }
    };

    return (
        <div
            className={`flyleaf ${isFront ? 'front' : 'back'}`}
            onClick={!isHidden && mobile ? onEdit : undefined}
        >
            <div className="w-1/2 relative z-10 flex flex-col" style={{ maxWidth: '50%' }}>
                <div className={`w-[30px] h-px bg-white/50 mb-4 ${!isFront ? 'ml-auto' : ''}`}></div>
                {!isHidden && !hasContent && (
                    <div className={`flyleaf-hint ${isFront ? 'text-left' : 'text-right'}`}>
                        클릭하여 문구 입력
                    </div>
                )}
                {(!isHidden || hasContent) && (
                    <textarea
                        value={text}
                        onChange={!isHidden && !mobile ? handleChange : undefined}
                        readOnly={isHidden || mobile}
                        className={`w-full bg-transparent border-none text-white/70 text-[10px] p-0 focus:outline-none placeholder:text-transparent resize-none overflow-hidden ${isFront ? 'text-left' : 'text-right'} ${mobile && !isHidden ? 'cursor-pointer' : ''}`}
                        rows={6}
                        spellCheck={false}
                        disabled={isHidden}
                        style={{ lineHeight: '1.6', maxHeight: '96px', pointerEvents: isHidden ? 'none' : 'auto' }}
                    />
                )}
            </div>
        </div>
    );
};

window.MockupBookRenderer = ({ spreadIdx, spreads, isCaptureMode = false, activeTheme, activeFont, frontFlyleafText, setFrontFlyleafText, backFlyleafText, setBackFlyleafText, pageHighlights, pages, metadata, onEditFlyleaf, pageSize = 'A6' }) => {
    const spread = spreads[spreadIdx];
    if (!spread) return null;

    const sizeConfig = window.PAPER_SIZES[pageSize] || window.PAPER_SIZES['A6'];
    const flyleafStyle = {
        width: sizeConfig.width,
        height: sizeConfig.height
    };

    const renderSide = (sideData, isRight) => {
        if (!sideData) return <div className="mockup-page bg-transparent" style={flyleafStyle}></div>;

        if (sideData.type === 'flyleaf-front') {
            return (
                <div className="mockup-page" style={flyleafStyle}>
                    <window.Flyleaf
                        isFront={true}
                        isHidden={isCaptureMode}
                        text={frontFlyleafText}
                        setText={setFrontFlyleafText}
                        onEdit={() => onEditFlyleaf && onEditFlyleaf('front')}
                    />
                    <div className="effect-gutter-left"></div>
                </div>
            );
        }
        if (sideData.type === 'flyleaf-back') {
            return (
                <div className="mockup-page" style={flyleafStyle}>
                    <window.Flyleaf
                        isFront={false}
                        isHidden={isCaptureMode}
                        text={backFlyleafText}
                        setText={setBackFlyleafText}
                        onEdit={() => onEditFlyleaf && onEditFlyleaf('back')}
                    />
                    <div className="effect-gutter-right"></div>
                </div>
            );
        }
        if (sideData.type === 'page') {
            // 2. Strict Layout Logic (Rewrite)

            // Apply dimensions explicitly (Single Source of Truth)
            const pageStyle = {
                fontFamily: window.FONT_MAP[activeFont].family,
                width: sizeConfig.width,
                height: sizeConfig.height,
                paddingTop: sizeConfig.paddingTop,
                paddingBottom: sizeConfig.paddingBottom,
                paddingLeft: sizeConfig.paddingLeft,
                paddingRight: sizeConfig.paddingRight,
                boxSizing: 'border-box'
            };

            return (
                <div className={`mockup-page page-container theme-${activeTheme} ${sizeConfig.className}`} style={pageStyle}>
                    <window.PageContent pageIdx={sideData.index} pages={pages} pageHighlights={pageHighlights} metadata={metadata} activeFont={activeFont} pageSize={pageSize} />
                    <window.PageFooter pageIdx={sideData.index} isRight={isRight} metadata={metadata} activeFont={activeFont} pageSize={pageSize} />
                    {isRight ? <div className="effect-gutter-right"></div> : <div className="effect-gutter-left"></div>}
                </div>
            );
        }
        return null;
    };

    return (
        <div className="mockup-book-wrapper">
            {renderSide(spread.left, false)}
            {renderSide(spread.right, true)}
        </div>
    );
};

// ----------------------------------------------------------------------
// 3. New UI Components: MemoAlert (Vertical Post-it Style) & UndoSnackbar
// ----------------------------------------------------------------------

window.MemoAlert = ({ config, onClose }) => {
    const [status, setStatus] = useState('enter-start');

    useEffect(() => {
        if (config) {
            setStatus('enter-start');
            requestAnimationFrame(() => {
                setStatus('idle');
            });
        }
    }, []);

    const handleAction = (callback) => {
        setStatus('exiting');
        setTimeout(() => {
            callback();
            onClose();
        }, 300);
    };

    if (!config) return null;

    const position = config.position || 'center';
    let posClass = '';
    if (position === 'center') posClass = 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2';
    else if (position === 'top-left') posClass = 'top-[60px] left-1/2 -translate-x-[300px]';
    else if (position === 'bottom-right') posClass = 'bottom-[80px] right-[20px]';
    else if (position === 'center-up') posClass = 'top-[35%] left-1/2 -translate-x-1/2 -translate-y-1/2';
    else if (position === 'mobile-bottom') posClass = 'bottom-[110px] left-1/2 -translate-x-1/2';
    else if (position === 'mobile-top-left') posClass = 'top-[70px] left-[20px]';

    const isIdle = status === 'idle';
    const baseClass = "transform transition-all duration-300 ease-out";
    const stateClass = isIdle
        ? "opacity-100 scale-100 translate-y-0"
        : "opacity-0 scale-95 translate-y-2";

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none">
            {/* Backdrop */}
            <div className={`absolute inset-0 bg-white/50 backdrop-blur-sm transition-opacity duration-300 pointer-events-auto ${isIdle ? 'opacity-100' : 'opacity-0'}`} onClick={() => handleAction(() => { if (config.onCancel) config.onCancel(); })}></div>

            {/* Mono Chic Popup Card */}
            <div className={`relative bg-white w-[280px] p-6 rounded-xl shadow-2xl border border-[#1C1C1C] pointer-events-auto flex flex-col items-center gap-6 ${baseClass} ${stateClass}`}>
                <p className="text-center text-sm font-bold text-[#1C1C1C] leading-relaxed whitespace-pre-line selection:bg-gray-200">
                    {config.message}
                </p>
                <div className="flex gap-3 w-full justify-center">
                    <button
                        onClick={(e) => { e.stopPropagation(); handleAction(() => config.onConfirm()); }}
                        className="flex-1 py-2.5 bg-[#1C1C1C] hover:bg-black text-white text-xs font-bold rounded-lg transition-all active:scale-95 shadow-sm"
                    >
                        확인
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); handleAction(() => { if (config.onCancel) config.onCancel(); }); }}
                        className="flex-1 py-2.5 bg-white hover:bg-gray-50 text-[#1C1C1C] border border-[#1C1C1C] text-xs font-bold rounded-lg transition-all active:scale-95"
                    >
                        취소
                    </button>
                </div>
            </div>
        </div>
    );
};

window.UndoSnackbar = ({ visible, onUndo }) => {
    if (!visible) return null;
    return (
        <div className="absolute top-[80px] left-1/2 -translate-x-1/2 z-[70] bg-white text-[#1C1C1C] border border-[#1C1C1C] px-6 py-3 rounded-full shadow-xl flex items-center gap-4 text-xs font-medium animate-slide-down">
            <span>삭제되었습니다.</span>
            <button onClick={onUndo} className="font-bold text-[#1C1C1C] hover:underline">실행 취소</button>
        </div>
    );
};


// ----------------------------------------------------------------------
// 4. Toolbar Component
// ----------------------------------------------------------------------
window.Toolbar = ({ textInput, setTextInput, textAreaRef }) => {
    const [isCurlyQuotes, setIsCurlyQuotes] = useState(false);
    const [isSpacedDialogue, setIsSpacedDialogue] = useState(false);

    const insertText = (text, cursorOffset = 0) => {
        window.haptic.tap();
        const textarea = textAreaRef.current;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const newText = textInput.substring(0, start) + text + textInput.substring(end);

        setTextInput(newText);

        setTimeout(() => {
            textarea.focus({ preventScroll: true });
            const newCursorPos = start + text.length + cursorOffset;
            textarea.setSelectionRange(newCursorPos, newCursorPos);
        }, 0);
    };

    const insertPair = (open, close) => {
        window.haptic.tap();
        const textarea = textAreaRef.current;
        if (!textarea) return;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const newText = textInput.substring(0, start) + open + close + textInput.substring(end);
        setTextInput(newText);
        setTimeout(() => {
            textarea.focus({ preventScroll: true });
            textarea.setSelectionRange(start + 1, start + 1);
        }, 0);
    };

    const toggleQuotes = (e) => {
        if (e && e.preventDefault) e.preventDefault();
        window.haptic.success();
        if (textAreaRef.current && window.isMobile()) textAreaRef.current.blur();

        const newState = !isCurlyQuotes;
        setIsCurlyQuotes(newState);

        let formatted = textInput;
        if (newState) {
            formatted = formatted.replace(/(")([^"]+)(")/g, "“$2”");
            formatted = formatted.replace(/(')([^']+)(')/g, "‘$2’");
            formatted = formatted.replace(/(^|[\s\(\[\{])"/g, '$1“');
            formatted = formatted.replace(/'/g, '’');
            formatted = formatted.replace(/'/g, '’');
        } else {
            formatted = formatted.replace(/[“”]/g, '"');
            formatted = formatted.replace(/[‘’]/g, "'");
        }
        setTextInput(formatted);
    };

    const toggleSpacing = (e) => {
        if (e && e.preventDefault) e.preventDefault();
        window.haptic.success();
        if (textAreaRef.current && window.isMobile()) textAreaRef.current.blur();

        const newState = !isSpacedDialogue;
        setIsSpacedDialogue(newState);

        const lines = textInput.split('\n');
        let newLines = [];
        let inDialogueBlock = false;

        if (newState) {
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i].trim();
                const isQuote = line.startsWith('“') || line.startsWith('"') || line.startsWith("'") || line.startsWith('‘');
                const isTranslation = line.startsWith('❘') || line.startsWith('|');
                const isDialogueLine = isQuote || isTranslation;

                if (isDialogueLine) {
                    if (!inDialogueBlock) {
                        if (newLines.length > 0 && newLines[newLines.length - 1] !== '') {
                            newLines.push('');
                        }
                        inDialogueBlock = true;
                    }
                    newLines.push(line);
                } else {
                    if (inDialogueBlock) {
                        if (line !== '') newLines.push('');
                        inDialogueBlock = false;
                    }
                    newLines.push(line);
                }
            }
        } else {
            const compactLines = [];
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i];
                const trimmed = line.trim();
                const nextLine = (i < lines.length - 1) ? lines[i + 1].trim() : '';
                const prevLine = (i > 0) ? lines[i - 1].trim() : '';

                const checkIsDialogue = (str) => str.startsWith('“') || str.startsWith('"') || str.startsWith("'") || str.startsWith('‘') || str.startsWith('❘') || str.startsWith('|');

                const isNextDialogue = checkIsDialogue(nextLine);
                const isPrevDialogue = checkIsDialogue(prevLine);

                if (trimmed === '') {
                    if (isNextDialogue || isPrevDialogue) {
                        continue;
                    }
                }
                compactLines.push(line);
            }
            newLines = compactLines;
        }

        setTextInput(newLines.join('\n'));
    };

    return (
        <div className="flex flex-col bg-white border-t border-slate-100">
            <div className="flex justify-center items-center w-full h-11 px-6 gap-12">
                <button onMouseDown={(e) => e.preventDefault()} onClick={() => insertPair('“', '”')} className="text-xl font-serif text-slate-800 hover:text-black active:scale-90 transition-transform">“ ”</button>
                <button onMouseDown={(e) => e.preventDefault()} onClick={() => insertPair('‘', '’')} className="text-xl font-serif text-slate-800 hover:text-black active:scale-90 transition-transform">‘ ’</button>
                <button onMouseDown={(e) => e.preventDefault()} onClick={() => insertText('…')} className="text-xl font-serif text-slate-800 hover:text-black active:scale-90 transition-transform">…</button>
                <button onMouseDown={(e) => e.preventDefault()} onClick={() => insertText('―')} className="text-xl font-serif text-slate-800 hover:text-black active:scale-90 transition-transform">―</button>
                <button onMouseDown={(e) => e.preventDefault()} onClick={() => insertText('***')} className="text-sm font-sans text-slate-800 font-bold hover:text-black active:scale-90 transition-transform tracking-widest">***</button>
            </div>

            <div className="flex gap-2 px-4 pb-3 justify-center">
                <button
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={toggleQuotes}
                    className={`py-2 px-4 rounded-full text-xs font-medium transition-all shadow-sm border ${isCurlyQuotes
                        ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                >
                    {isCurlyQuotes ? '🪄 직선따옴표로 변환' : '🪄 둥근따옴표로 변환'}
                </button>
                <button
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={toggleSpacing}
                    className={`py-2 px-4 rounded-full text-xs font-medium transition-all shadow-sm border ${isSpacedDialogue
                        ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                >
                    {isSpacedDialogue ? '🪄 대사 간격 좁히기' : '🪄 대사 자동 띄우기'}
                </button>
            </div>
        </div>
    );
};
