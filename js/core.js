(function () {
    /**
     * Calculates pages based on text, font, and measurement container.
     * @param {string} text - The input text.
     * @param {string} fontKey - The key of the active font.
     * @param {HTMLElement} measureBox - The hidden DOM element used for measurement.
     * @param {object} metadata - Metadata containing title, etc.
     * @param {string} pageSize - The selected paper size key (e.g., 'A6', 'A5').
     * @returns {Array} Array of page objects.
     */
    window.calculatePages = function (text, fontKey, measureBox, metadata, pageSize = 'A6') {
        if (!measureBox) return [];

        // 1. Get Configuration (Single Source of Truth)
        const sizeConfig = window.PAPER_SIZES[pageSize] || window.PAPER_SIZES['A6'];
        const layoutConfig = window.LAYOUT_CONFIG;

        // 2. Reset & Apply Explicit Geometry (No CSS Classes)
        measureBox.className = ''; // Remove external styles
        measureBox.removeAttribute('class');

        // Critical: Apply strict inline styles
        measureBox.style.cssText = `
            position: absolute;
            top: -9999px;
            left: -9999px;
            visibility: hidden;
            z-index: -9999;
            pointer-events: none;
            box-sizing: border-box;
            width: ${sizeConfig.width};
            height: auto; 
            min-height: 0;
            padding-top: ${sizeConfig.paddingTop};
            padding-bottom: ${sizeConfig.paddingBottom};
            padding-left: ${sizeConfig.paddingLeft};
            padding-right: ${sizeConfig.paddingRight};
            white-space: pre-wrap;
            word-break: normal;
        `;

        // 3. Apply Typography
        const fontConfig = window.FONT_MAP[fontKey] || window.FONT_MAP['noto'] || { family: 'serif' };
        measureBox.style.fontFamily = fontConfig.family;

        // Font Size Logic: A6 uses 12px, others use 11.5px
        measureBox.style.fontSize = (pageSize === 'A6') ? '12px' : '11.5px';

        measureBox.style.fontWeight = '300';

        // Typography Logic: Determine correct line height for P tags
        let targetLineHeight = '1.8';
        let targetTextIndent = '1em';
        let targetLetterSpacing = '-0.02em';
        let targetFontSize = '11.5px';

        if (pageSize === 'A6') {
            targetFontSize = '12px';
            targetLineHeight = '22px';
            targetTextIndent = '12px';
            targetLetterSpacing = '-0.03em';
        } else if (pageSize === 'A5') {
            targetFontSize = '14px';
            targetLineHeight = '25px';
            targetTextIndent = '14px';
            targetLetterSpacing = '-0.02em';
        } else if (pageSize === 'SHIN') {
            targetFontSize = '13px';
            targetLineHeight = '23px';
            targetTextIndent = '13px';
            targetLetterSpacing = '-0.03em';
        }

        measureBox.style.fontSize = targetFontSize;
        measureBox.style.lineHeight = targetLineHeight;
        measureBox.style.letterSpacing = targetLetterSpacing;
        measureBox.style.textIndent = targetTextIndent;

        if (pageSize === 'A6') {
            measureBox.style.textAlign = 'justify';
            measureBox.style.textJustify = 'inter-character';
        } else {
            // For A5 and others, use standard justify if needed, or default
            // measureBox.style.textAlign = 'justify'; 
        }

        measureBox.style.wordBreak = 'break-all'; // Maximize density
        measureBox.style.overflowWrap = 'break-word';

        // 4. Calculate Target Limits (Ruler Method)
        // We need to know the target TOTAL height in pixels to compare against scrollHeight.
        const ruler = document.createElement('div');
        ruler.style.height = sizeConfig.height;
        ruler.style.position = 'absolute';
        ruler.style.visibility = 'hidden';
        document.body.appendChild(ruler);
        const targetTotalHeightPx = ruler.offsetHeight;
        document.body.removeChild(ruler);

        // Get precise padding values (browser converts 'mm' to 'px' for us)
        const computedStyle = window.getComputedStyle(measureBox);
        const paddingTopPx = parseFloat(computedStyle.paddingTop);
        const paddingBottomPx = parseFloat(computedStyle.paddingBottom);

        // Actual space for text content (Internal use)
        const contentHeightLimit = targetTotalHeightPx - paddingTopPx - paddingBottomPx - layoutConfig.FOOTER_HEIGHT - layoutConfig.SAFETY_MARGIN;

        const rawParagraphs = text.split('\n');
        let currentParagraphs = [];
        let pageNum = 1;
        let resultPages = [];

        let queue = rawParagraphs.map(text => {
            const trimmed = text.trim();
            if (trimmed === '***') return { text: '*\u00A0\u00A0\u00A0\u00A0\u00A0*\u00A0\u00A0\u00A0\u00A0\u00A0*', isContinued: false, isSceneBreak: true };
            return { text: text, isContinued: false, isSceneBreak: false };
        });

        measureBox.innerHTML = '';

        // 5. Page 1 Title Logic (Physical Spacer)
        // Check if title has actual content (ignore whitespace)
        if (metadata.title && metadata.title.trim().length > 0 && pageNum === 1) {
            const titlePlaceholder = document.createElement('div');
            titlePlaceholder.style.height = `${layoutConfig.TITLE_PLACEHOLDER_HEIGHT}px`;
            titlePlaceholder.style.width = "100%";
            titlePlaceholder.style.marginBottom = `${layoutConfig.TITLE_PADDING_BOTTOM}px`;
            titlePlaceholder.style.backgroundColor = 'transparent';
            measureBox.appendChild(titlePlaceholder);
        }

        const findSplitIndex = (text, availableHeight, isContinued) => {
            const tempP = document.createElement('p');
            tempP.style.lineHeight = targetLineHeight; // Use synced value
            tempP.style.marginBottom = "0";
            tempP.style.marginTop = "0"; // Explicit reset
            tempP.style.letterSpacing = targetLetterSpacing; // Synced spacing
            tempP.style.fontFamily = fontConfig.family;

            if (isContinued) tempP.classList.add('continued');
            else tempP.style.textIndent = targetTextIndent; // Use synced value

            measureBox.appendChild(tempP);

            let low = 0;
            let high = text.length;
            let bestIdx = 0;

            while (low <= high) {
                const mid = Math.floor((low + high) / 2);
                const subText = text.substring(0, mid);
                tempP.textContent = subText;

                // Check if this subText fits in availableHeight
                // But availableHeight is for the WHOLE page remaining?
                // No, findSplitIndex is called when we have `availableHeight` left.
                // We barely fit the PARAGRAPH.
                // Wait, tempP.offsetHeight must be <= availableHeight.

                if (tempP.offsetHeight <= availableHeight) {
                    bestIdx = mid;
                    low = mid + 1;
                } else {
                    high = mid - 1;
                }
            }
            measureBox.removeChild(tempP);
            return bestIdx;
        };

        let safetyCounter = 0;
        const MAX_ITERATIONS = 5000;

        while (queue.length > 0) {
            safetyCounter++;
            if (safetyCounter > MAX_ITERATIONS) {
                console.warn("Infinite loop detected in calculatePages");
                if (currentParagraphs.length > 0) resultPages.push({ paragraphs: currentParagraphs });
                break;
            }

            const item = queue.shift();
            const p = document.createElement('p');
            p.style.lineHeight = targetLineHeight; // Use synced value
            p.style.marginBottom = "0";
            p.style.marginTop = "0"; // Explicit reset
            p.style.letterSpacing = targetLetterSpacing; // Synced spacing
            p.style.fontFamily = fontConfig.family;

            if (!item.isContinued) p.style.textIndent = targetTextIndent; // Synced indent

            const effectiveText = item.text === '' ? '\u00A0' : item.text;
            p.textContent = effectiveText;

            if (item.isSceneBreak) {
                p.style.textAlign = 'center';
                p.style.textIndent = '0';
            } else if (item.isContinued) {
                p.classList.add('continued');
            } else {
                // Indent logic handled above
            }

            measureBox.appendChild(p);

            // Check Overflow
            // Since we are forcing box-sizing: border-box and explicit height,
            // scrollHeight > clientHeight means overflow.
            // But we have safety margin.
            // So logic: `scrollHeight > clientHeight - SAFETY`?
            // scrollHeight usually equals clientHeight until overflow.
            // When overflow happens, scrollHeight > clientHeight.
            // So `scrollHeight > totalHeightPx - SAFETY` is invalid logic 
            // because scrollHeight won't grow gradually beyond clientHeight, it jumps?
            // No, scrollHeight grows with content.
            // If height is fixed (148mm), scrollHeight starts small.
            // As we add Ps, scrollHeight increases.
            // Eventually scrollHeight > clientHeight (overflow).
            // We want to stop BEFORE scrollHeight > clientHeight - SAFETY.

            // However, scrollHeight includes PADDING.
            // clientHeight includes PADDING.
            // So comparing them directly works.

            const currentTotalHeight = measureBox.scrollHeight;
            // Critical comparison: Use targetTotalHeightPx as the ceiling
            // We subtract footer height to protect that area
            const limitTotalHeight = targetTotalHeightPx - layoutConfig.FOOTER_HEIGHT - layoutConfig.SAFETY_MARGIN;

            if (currentTotalHeight <= limitTotalHeight) {
                currentParagraphs.push({ text: effectiveText, isContinued: item.isContinued, isSceneBreak: item.isSceneBreak });
            } else {
                // Overflowed
                measureBox.removeChild(p);

                // Calculate Available Space for Split
                // We can't rely on scrollHeight effectively here because we just removed the P.
                // We need to know how much space is LEFT.
                // available = limitTotalHeight - (currentTotalHeight BEFORE adding P).
                // Let's get current height of children.
                let usedHeight = paddingTopPx; // Start with top padding
                for (let child of measureBox.children) {
                    usedHeight += child.offsetHeight; // This includes margin if any? P has 0 margin.
                }

                // Correct logic:
                // Content limit is `contentHeightLimit`.
                // Used Content height is (Sum of children offsetHeight).
                // Remaining Content Height = contentHeightLimit - UsedContent.

                let usedContentHeight = 0;
                for (let child of measureBox.children) {
                    usedContentHeight += child.offsetHeight;
                }

                const availableContentHeight = contentHeightLimit - usedContentHeight;

                if (availableContentHeight < 18) {
                    // Too small to fit anything meaningful
                    queue.unshift(item);
                    resultPages.push({ paragraphs: currentParagraphs });
                    currentParagraphs = [];
                    pageNum++;
                    measureBox.innerHTML = '';
                    continue;
                }

                // Split
                const splitIdx = findSplitIndex(effectiveText, availableContentHeight, item.isContinued);

                if (splitIdx > 0) {
                    const FirstPart = effectiveText.substring(0, splitIdx);
                    // Check logic: findSplitIndex returns length that FITS.

                    const SecondPart = effectiveText.substring(splitIdx).trim(); // Space optimize

                    // Don't leave empty chunk
                    if (FirstPart.trim().length > 0 || FirstPart === '\u00A0') {
                        currentParagraphs.push({ text: FirstPart, isContinued: item.isContinued, isSceneBreak: item.isSceneBreak });
                    }
                    resultPages.push({ paragraphs: currentParagraphs });

                    // Setup Next Page
                    currentParagraphs = [];
                    pageNum++;
                    measureBox.innerHTML = '';

                    if (SecondPart.length > 0) {
                        queue.unshift({ text: SecondPart, isContinued: true, isSceneBreak: false }); // Continued is true for second part? Usually Yes.
                    }
                } else {
                    // Can't fit char
                    queue.unshift(item);
                    resultPages.push({ paragraphs: currentParagraphs });
                    currentParagraphs = [];
                    pageNum++;
                    measureBox.innerHTML = '';
                }
            }
        }

        // Push last page
        if (currentParagraphs.length > 0) {
            resultPages.push({ paragraphs: currentParagraphs });
        }

        return resultPages;
    };

    window.renderPageContent = function (page, fontKey) {
        if (!page || !page.paragraphs) return '';
        const fontFamily = window.FONT_MAP[fontKey] ? window.FONT_MAP[fontKey].family : 'serif';

        return page.paragraphs.map(p => {
            let style = `line-height: 1.8 !important; margin-bottom: 0px; font-family: ${fontFamily};`;
            let className = '';

            if (p.isSceneBreak) {
                style += 'text-align: center; text-indent: 0;';
            } else if (p.isContinued) {
                className = 'continued';
            } else {
                style += 'text-indent: 1em;';
            }

            // Build P tag
            // Note: We include styling inline to ensure it persists in html-to-image or downloads if external css fails,
            // but classes are also used for interactive styling logic (like highlighting).
            if (className) {
                return `<p class="${className}" style="${style}">${p.text}</p>`;
            } else {
                return `<p style="${style}">${p.text}</p>`;
            }
        }).join('');
    };
})();
