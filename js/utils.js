// Expose React hooks globally
window.useState = React.useState;
window.useEffect = React.useEffect;
window.useRef = React.useRef;
window.useCallback = React.useCallback;
window.useLayoutEffect = React.useLayoutEffect;

(function () {
    const { useState, useEffect } = React;

    // ----------------------------------------------------------------------
    // 1. Utils & Helpers
    // ----------------------------------------------------------------------

    window.isMobile = function () {
        return /Android|webOS|BlackBerry|IEMobile|Opera Mini|iPad|iPhone|iPod/.test(navigator.userAgent);
    };

    window.isIOS = function () {
        return /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    };

    // Haptic Feedback Helper
    window.haptic = {
        tap: () => {
            if (navigator.vibrate) navigator.vibrate(10);
        },
        success: () => {
            if (navigator.vibrate) navigator.vibrate([30, 50, 30]);
        },
        error: () => {
            if (navigator.vibrate) navigator.vibrate([50, 100, 50]);
        }
    };

    window.ensureFontsLoaded = async function () {
        try { await document.fonts.ready; } catch (e) { console.warn('폰트 API 확인 실패', e); }
    };

    window.fontCache = new Map();
    window.BOTTOM_BUFFER_P1 = 15; // Title area buffer (Legacy value: 15, NOT 220)

    window.PAPER_SIZES = {
        'A6': {
            label: 'A6 (105x148mm)',
            // Geometry (Styles) - Converted to PX (1mm = ~3.78px)
            width: '397px', height: '559px', // 105x148mm
            paddingTop: '50px', paddingBottom: '60px', paddingLeft: '50px', paddingRight: '50px',
            // Render Props
            className: 'size-a6'
        },
        'A5': {
            label: 'A5 (148x210mm)',
            width: '559px', height: '794px', // 148x210mm
            paddingTop: '70px', paddingBottom: '80px', paddingLeft: '70px', paddingRight: '70px',
            className: 'size-a5'
        },
        'SHIN': {
            label: '신국판 (152x225mm)',
            width: '575px', height: '850px', // 152x225mm
            paddingTop: '65px', paddingBottom: '85px', paddingLeft: '65px', paddingRight: '65px',
            className: 'size-shin',
            hidden: true
        }
    };

    window.LAYOUT_CONFIG = {
        SAFETY_MARGIN: 10, // Buffer reduced (Logic fixed)
        TITLE_PLACEHOLDER_HEIGHT: 200, // 200px reserved for title
        TITLE_PADDING_BOTTOM: 0, // Extra spacing removed
        FOOTER_HEIGHT: 15 // Absolute minimum footer
    };

    window.FONT_MAP = {
        'noto': { name: '본문명조', family: "'Noto Serif KR', serif", url: 'https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@200;300;400;500&display=swap' },
        'nanum': { name: '나눔명조', family: "'Nanum Myeongjo', serif", url: 'https://fonts.googleapis.com/css2?family=Nanum+Myeongjo:wght@400;700;800&display=swap' },
        'jeju': { name: '제주명조', family: "'Jeju Myeongjo', serif", url: '//fonts.googleapis.com/earlyaccess/jejumyeongjo.css' },
        'gowun': { name: '고운바탕', family: "'Gowun Batang', serif", url: 'https://fonts.googleapis.com/css2?family=Gowun+Batang:wght@400;700&display=swap' },

        'maru': { name: '마루부리', family: "'MaruBuri', serif", url: 'https://hangeul.pstatic.net/hangeul_static/css/maru-buri.css' },
        'hahmlet': { name: '함렛', family: "'Hahmlet', serif", url: 'https://fonts.googleapis.com/css2?family=Hahmlet:wght@100;200;300;400;500;600&display=swap' },
        'diphylleia': { name: '산수국', family: "'Diphylleia', serif", url: 'https://fonts.googleapis.com/css2?family=Diphylleia&display=swap' }
    };

    window.escapeFontName = function (fontUrl) {
        return fontUrl;
    };

    window.prepareFontEmbedCSS = async function (activeFontKey) {
        if (window.fontCache.has(activeFontKey)) return window.fontCache.get(activeFontKey);
        try {
            const fontInfo = window.FONT_MAP[activeFontKey];
            if (!fontInfo) return null;

            // Try fetch, but catch network errors (CORS, etc.) immediately
            const cssRes = await fetch(fontInfo.url).catch(e => null);
            if (!cssRes || !cssRes.ok) {
                console.warn("Failed to fetch font CSS, skipping embed:", fontInfo.url);
                return null;
            }

            let cssText = await cssRes.text();

            // Basic CSS parsing for font-face url()
            const urlRegex = /url\(([^)]+)\)/g;
            let match;
            const replacements = [];
            while ((match = urlRegex.exec(cssText)) !== null) {
                let fullUrl = match[1].replace(/['"]/g, '');
                replacements.push({ original: match[0], url: fullUrl });
            }

            await Promise.all(replacements.map(async (item) => {
                try {
                    const fontRes = await fetch(item.url).catch(e => null);
                    if (!fontRes || !fontRes.ok) return;

                    const fontBlob = await fontRes.blob();
                    await new Promise((resolve) => {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                            if (reader.result) {
                                cssText = cssText.replace(item.url, reader.result);
                            }
                            resolve();
                        };
                        reader.onerror = resolve; // Resolve even on error
                        reader.readAsDataURL(fontBlob);
                    });
                } catch (e) { console.warn("Font resource load failed:", item.url); }
            }));

            window.fontCache.set(activeFontKey, cssText);
            return cssText;
        } catch (e) {
            console.warn("Font embedding critical error:", e);
            return null; // Always fail gracefully
        }
    };

    window.useDebounce = function (value, delay) {
        const [debouncedValue, setDebouncedValue] = useState(value);
        useEffect(() => {
            const handler = setTimeout(() => { setDebouncedValue(value); }, delay);
            return () => clearTimeout(handler);
        }, [value, delay]);
        return debouncedValue;
    };

    window.captureNode = async function (node, fileName, width, height, fontEmbedCSS = null) {
        await window.ensureFontsLoaded();

        const options = {
            quality: 1.0, pixelRatio: 3, cacheBust: false,
            width: width, height: height,
            style: { transform: 'none', margin: '0' },
            filter: (node) => {
                return !node.classList || !node.classList.contains('no-capture');
            }
        };

        if (fontEmbedCSS) {
            options.fontEmbedCSS = fontEmbedCSS;
        }

        if (window.isMobile()) {
            // Warmup (Reduced delay to prevent gesture expiration on iOS)
            try { await htmlToImage.toBlob(node, options); } catch (e) { }
            await new Promise(r => setTimeout(r, 50));
        }

        const blob = await htmlToImage.toBlob(node, options);
        if (!blob) throw new Error('Blob creation failed');

        // iOS Share Logic (Web Share API Level 2)
        // Force attempt: Some browsers return false for canShare but still work, or we want to know why it fails.
        if (window.isIOS() && navigator.share) {
            const file = new File([blob], fileName, { type: 'image/png' });
            try {
                await navigator.share({ files: [file], title: fileName });
                return; // Success
            } catch (err) {
                if (err.name === 'AbortError') return; // User cancelled
                console.warn('Share failed, falling back to download:', err);
                // Continue to download fallback
            }
        }

        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = fileName;
        link.href = url;
        link.style.display = 'none'; // Ensure hidden
        document.body.appendChild(link);
        link.click();

        // Critical for Android: Delay removal
        setTimeout(() => {
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        }, 1000);
    };

    window.getBlobFromNode = async function (node, width, height, fontEmbedCSS = null) {
        await window.ensureFontsLoaded();

        const options = {
            quality: 1.0, pixelRatio: 3, cacheBust: false,
            width: width, height: height,
            style: { transform: 'none', margin: '0' },
            filter: (node) => {
                return !node.classList || !node.classList.contains('no-capture');
            }
        };

        if (fontEmbedCSS) {
            options.fontEmbedCSS = fontEmbedCSS;
        }

        if (window.isMobile()) {
            // Mobile stabilization
            try { await htmlToImage.toBlob(node, options); } catch (e) { }
            await new Promise(r => setTimeout(r, 200));
        }

        return await htmlToImage.toBlob(node, options);
    };

    // window.PAGE_CONTENT_HEIGHT is now dynamic based on PAPER_SIZES
    window.BOTTOM_BUFFER_P1 = 15;
    window.STORAGE_KEY = 'novel_generator_draft';
})();
