
// Mobile Flyleaf Edit Modal
// Dark theme modal for editing front/back flyleaf text
// Constraints: Max 6 lines, Max 16 chars per line

window.MobileFlyleafModal = ({ isOpen, type, initialText, onSave, onClose }) => {
    if (!isOpen) return null;

    const [text, setText] = React.useState(initialText || '');
    const maxLines = 6;
    const maxCharsPerLine = 15;

    React.useEffect(() => {
        setText(initialText || '');
    }, [initialText, isOpen]);

    // Helper: Logic to wrap text
    const formatText = (val) => {
        const lines = val.split('\n');
        let newLines = [];
        for (let i = 0; i < lines.length; i++) {
            let line = lines[i];
            while (line.length > maxCharsPerLine) {
                newLines.push(line.slice(0, maxCharsPerLine));
                line = line.slice(maxCharsPerLine);
            }
            newLines.push(line);
        }
        return newLines;
    };

    const handleChange = (e) => {
        const val = e.target.value;

        // If IME is composing, just update state without formatting to prevent duplication
        if (e.nativeEvent.isComposing) {
            setText(val);
            return;
        }

        const newLines = formatText(val);

        // Constraint: Max Lines
        if (newLines.length > maxLines) return;

        setText(newLines.join('\n'));
    };

    const handleCompositionEnd = (e) => {
        const val = e.currentTarget.value;
        const newLines = formatText(val);

        if (newLines.length > maxLines) {
            setText(newLines.slice(0, maxLines).join('\n'));
        } else {
            setText(newLines.join('\n'));
        }
    };

    const handleSave = () => {
        onSave(text);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-auto">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={onClose}></div>

            {/* Modal Card */}
            <div className="relative bg-[#1C1C1C] w-[90%] max-w-sm rounded-[20px] shadow-2xl overflow-hidden animate-scale-in">
                <div className="px-6 py-6 pb-4">
                    <p className="text-center text-slate-400 text-xs mb-4">
                        {type === 'front' ? '앞표지 속지 문구 입력' : '뒤표지 속지 문구 입력'} (최대 {maxLines}줄)
                    </p>

                    {/* Separator Line */}
                    <div className="w-8 h-[1px] bg-slate-600 mx-auto mb-6"></div>

                    <textarea
                        value={text}
                        onChange={handleChange}
                        onCompositionEnd={handleCompositionEnd}
                        placeholder="문구를 입력하세요..."
                        className="w-full bg-transparent border-none text-white/90 text-sm text-left resize-none focus:outline-none placeholder:text-slate-600 font-serif leading-relaxed"
                        rows={6}
                        spellCheck={false}
                    />
                </div>

                {/* Complete Button */}
                <div className="px-4 pb-4">
                    <button
                        onClick={handleSave}
                        className="w-full py-3.5 bg-[#333333] hover:bg-[#444444] text-white/90 text-sm font-bold rounded-xl transition-colors active:scale-95"
                    >
                        완료
                    </button>
                </div>
            </div>
        </div>
    );
};
