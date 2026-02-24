
// ======================================================================
// EpubModal — Cover image selection + EPUB generation modal
// ======================================================================
// Dark theme modal matching existing MobileFlyleafModal / InfoModal pattern.
// Props: isOpen, onClose, textInput, metadata
// ======================================================================

window.EpubModal = ({ isOpen, onClose, textInput, metadata }) => {
    if (!isOpen) return null;

    const [coverImage, setCoverImage] = React.useState(null);
    const [coverPreview, setCoverPreview] = React.useState(null);
    const [isBuilding, setIsBuilding] = React.useState(false);
    const [isMobile, setIsMobile] = React.useState(window.innerWidth < 768);
    const fileInputRef = React.useRef(null);

    React.useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Reset state when modal opens
    React.useEffect(() => {
        if (isOpen) {
            setCoverImage(null);
            setCoverPreview(null);
            setIsBuilding(false);
        }
    }, [isOpen]);

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            alert('이미지 파일만 선택할 수 있습니다.');
            return;
        }

        // Read as data URL for preview + embedding
        const reader = new FileReader();
        reader.onload = (event) => {
            setCoverImage(event.target.result);
            setCoverPreview(event.target.result);
        };
        reader.readAsDataURL(file);
    };

    const handleRemoveCover = () => {
        setCoverImage(null);
        setCoverPreview(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleBuild = async () => {
        if (!textInput || !textInput.trim()) {
            alert('본문 텍스트가 없습니다.\n텍스트를 먼저 입력해주세요.');
            return;
        }

        setIsBuilding(true);

        try {
            await window.EpubBuilder.build({
                title: metadata.title || '',
                author: metadata.author || '',
                character: metadata.producer || '',
                bodyText: textInput,
                coverImageData: coverImage || null
            });

            if (window.haptic) window.haptic.success();
            onClose();
        } catch (e) {
            console.error('EPUB build failed:', e);
            alert('EPUB 생성 실패: ' + e.message);
            if (window.haptic) window.haptic.error();
        } finally {
            setIsBuilding(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[9999] flex items-end justify-center md:items-center px-4 md:px-0 pb-4 md:pb-0">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                onClick={!isBuilding ? onClose : undefined}
            ></div>

            {/* Modal Card */}
            <div className={`
                relative bg-[#1C1C1C] flex flex-col overflow-hidden transition-all shadow-2xl
                ${isMobile
                    ? 'w-full rounded-3xl animate-slide-up max-h-[85vh]'
                    : 'w-[420px] rounded-2xl animate-fade-in'
                }
            `}>
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-white/10">
                    <h2 className="text-base font-bold text-white/90">EPUB 내보내기</h2>
                    <button
                        onClick={onClose}
                        disabled={isBuilding}
                        className="p-2 -mr-2 text-white/40 hover:text-white/80 rounded-full hover:bg-white/10 transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Body */}
                <div className="px-6 py-5 overflow-y-auto">

                    {/* Metadata Preview */}
                    <div className="mb-5 p-3 bg-white/5 rounded-xl">
                        <div className="text-white/50 text-xs font-bold uppercase tracking-wider mb-2">메타데이터</div>
                        <div className="space-y-1">
                            <p className="text-white/80 text-sm">
                                <span className="text-white/40 mr-2">소제목</span>
                                {metadata.title || <span className="text-white/20 italic">없음</span>}
                            </p>
                            <p className="text-white/80 text-sm">
                                <span className="text-white/40 mr-2">제작자</span>
                                {metadata.author || <span className="text-white/20 italic">없음</span>}
                            </p>
                            <p className="text-white/80 text-sm">
                                <span className="text-white/40 mr-2">캐릭터</span>
                                {metadata.producer || <span className="text-white/20 italic">없음</span>}
                            </p>
                        </div>
                    </div>

                    {/* Separator */}
                    <div className="w-8 h-[1px] bg-white/10 mx-auto mb-5"></div>

                    {/* Cover Image Section */}
                    <div className="mb-2">
                        <div className="text-white/50 text-xs font-bold uppercase tracking-wider mb-3">
                            표지 이미지
                            <span className="text-white/20 font-normal ml-1">(선택사항)</span>
                        </div>

                        {/* Hidden File Input */}
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleFileSelect}
                            className="hidden"
                        />

                        {coverPreview ? (
                            /* Preview */
                            <div className="relative group">
                                <div className="w-full aspect-[3/4] rounded-xl overflow-hidden bg-black/30 flex items-center justify-center">
                                    <img
                                        src={coverPreview}
                                        alt="표지 미리보기"
                                        className="max-w-full max-h-full object-contain"
                                    />
                                </div>
                                {/* Remove Button */}
                                <button
                                    onClick={handleRemoveCover}
                                    className="absolute top-2 right-2 w-8 h-8 bg-black/60 hover:bg-black/80 text-white/70 hover:text-white rounded-full flex items-center justify-center transition-all backdrop-blur-sm"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        ) : (
                            /* Upload Area */
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="w-full aspect-[3/4] max-h-[200px] border-2 border-dashed border-white/15 hover:border-white/30 rounded-xl flex flex-col items-center justify-center gap-3 transition-all group cursor-pointer"
                            >
                                <svg className="w-8 h-8 text-white/20 group-hover:text-white/40 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <span className="text-white/30 group-hover:text-white/50 text-sm font-medium transition-colors">
                                    탭하여 표지 이미지 선택
                                </span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Build Button */}
                <div className="px-4 pb-4 pt-1">
                    <button
                        onClick={handleBuild}
                        disabled={isBuilding}
                        className={`
                            w-full py-3.5 rounded-xl text-sm font-bold transition-all active:scale-95
                            ${isBuilding
                                ? 'bg-[#333333] text-white/40 cursor-not-allowed'
                                : 'bg-[#333333] hover:bg-[#444444] text-white/90'
                            }
                        `}
                    >
                        {isBuilding ? (
                            <span className="flex items-center justify-center gap-2">
                                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                생성 중...
                            </span>
                        ) : (
                            '이펍 제작'
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};
