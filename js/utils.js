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
            paddingTop: '50px', paddingBottom: '70px', paddingLeft: '50px', paddingRight: '50px',
            // Render Props
            className: 'size-a6'
        },
        'A5': {
            label: 'A5 (148x210mm)',
            width: '559px', height: '794px', // 148x210mm
            paddingTop: '76px', paddingBottom: '34px', paddingLeft: '76px', paddingRight: '76px', // 20mm=76px, 9mm=34px
            className: 'size-a5'
        },
        'B5': {
            label: 'B5 (182x257mm)',
            width: '688px', height: '971px', // 182x257mm
            paddingTop: '94px', paddingBottom: '76px', paddingLeft: '94px', paddingRight: '94px', // 25mm=94px, 20mm=76px
            className: 'size-b5'
        }
    };

    window.LAYOUT_CONFIG = {
        SAFETY_MARGIN: 10, // Buffer reduced (Logic fixed)
        TITLE_PLACEHOLDER_HEIGHT: 200, // 200px reserved for title
        TITLE_PADDING_BOTTOM: 15, // Extra spacing
        FOOTER_HEIGHT: 15 // Absolute minimum footer
    };

    window.FONT_MAP = {
        'noto': { name: '본문명조', family: "'Noto Serif KR', serif", url: 'https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@200;300;400;500&display=swap' },
        'nanum': { name: '나눔명조', family: "'Nanum Myeongjo', serif", url: 'https://fonts.googleapis.com/css2?family=Nanum+Myeongjo:wght@400;700;800&display=swap' },
        'jeju': { name: '제주명조', family: "'Jeju Myeongjo', serif", url: '//fonts.googleapis.com/earlyaccess/jejumyeongjo.css' },
        'gowun': { name: '고운바탕', family: "'Gowun Batang', serif", url: 'https://fonts.googleapis.com/css2?family=Gowun+Batang:wght@400;700&display=swap' },
        'ridi': { name: '리디바탕', family: "'Ridibatang', serif", url: 'https://webfontworld.github.io/ridibatang/Ridibatang.css' },
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
            try { await htmlToImage.toBlob(node, options); } catch (e) { }
            await new Promise(r => setTimeout(r, 200));
        }

        const blob = await htmlToImage.toBlob(node, options);
        if (!blob) throw new Error('Blob creation failed');

        if (window.isIOS() && navigator.share && navigator.canShare) {
            const file = new File([blob], fileName, { type: 'image/png' });
            if (navigator.canShare({ files: [file] })) {
                await navigator.share({ files: [file], title: fileName });
                return;
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
