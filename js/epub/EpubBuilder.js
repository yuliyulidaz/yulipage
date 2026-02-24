
// ======================================================================
// EpubBuilder — Template-based EPUB generator (Ridibooks optimized)
// ======================================================================
// Builds a .epub file from text input + metadata using JSZip.
// The EPUB template is fixed with optimized CSS for Ridibooks reader.
// Only the text content and metadata are swapped per invocation.
// ======================================================================

window.EpubBuilder = (() => {

    // ------------------------------------------------------------------
    // EPUB Template: CSS (Ridibooks Optimized)
    // ------------------------------------------------------------------
    const EPUB_CSS = `
/* Reset */
body, h1, h2, h3, p {
    margin: 0;
    padding: 0;
}

body {
    font-family: serif;
    line-height: 1.8;
    color: #1a1a1a;
    word-break: keep-all;
    overflow-wrap: break-word;
}

/* Title Page */
.title-page {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    min-height: 80vh;
    text-align: center;
    padding: 2em 1.5em;
}

.title-page .title {
    font-size: 1.6em;
    font-weight: bold;
    margin-bottom: 0.8em;
    letter-spacing: 0.02em;
    line-height: 1.4;
}

.title-page .author {
    font-size: 0.95em;
    color: #555;
    margin-bottom: 0.3em;
}

.title-page .character {
    font-size: 0.85em;
    color: #888;
    font-style: italic;
}

.title-page .separator {
    width: 2em;
    height: 1px;
    background: #ccc;
    margin: 1.2em auto;
}

/* Chapter Body */
.chapter-body {
    padding: 1em 0;
}

.chapter-body p {
    text-indent: 1em;
    margin-bottom: 0.5em;
    line-height: 1.8;
    text-align: justify;
}

.chapter-body p.no-indent {
    text-indent: 0;
}

.chapter-body p.empty-line {
    height: 1em;
    margin-bottom: 0;
    text-indent: 0;
}

/* Scene Break */
.scene-break {
    border: none;
    text-align: center;
    margin: 1.5em 0;
    line-height: 1;
}

.scene-break::after {
    content: "***";
    color: #aaa;
    font-size: 0.9em;
    letter-spacing: 0.3em;
}

/* Cover */
.cover-page {
    text-align: center;
    padding: 0;
    margin: 0;
}

.cover-page img {
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
}
`.trim();

    // ------------------------------------------------------------------
    // Helper: Generate UUID
    // ------------------------------------------------------------------
    const generateUUID = () => {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
            const r = Math.random() * 16 | 0;
            return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
        });
    };

    // ------------------------------------------------------------------
    // Helper: Escape XML
    // ------------------------------------------------------------------
    const escapeXml = (str) => {
        if (!str) return '';
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&apos;');
    };

    // ------------------------------------------------------------------
    // Helper: Convert body text to XHTML paragraphs
    // ------------------------------------------------------------------
    const textToHtml = (text) => {
        if (!text) return '<p></p>';

        const lines = text.split('\n');
        const htmlParts = [];

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();

            if (line === '***' || line === '* * *') {
                // Scene break
                htmlParts.push('    <hr class="scene-break" />');
            } else if (line === '') {
                // Empty line — visual spacing
                htmlParts.push('    <p class="empty-line">&#160;</p>');
            } else {
                // Normal paragraph
                htmlParts.push(`    <p>${escapeXml(line)}</p>`);
            }
        }

        return htmlParts.join('\n');
    };

    // ------------------------------------------------------------------
    // Template: mimetype (must be first, uncompressed)
    // ------------------------------------------------------------------
    const MIMETYPE = 'application/epub+zip';

    // ------------------------------------------------------------------
    // Template: container.xml
    // ------------------------------------------------------------------
    const CONTAINER_XML = `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml" />
  </rootfiles>
</container>`;

    // ------------------------------------------------------------------
    // Template: content.opf
    // ------------------------------------------------------------------
    const buildContentOpf = (uuid, title, author, hasCover) => {
        const coverManifest = hasCover ? `
    <item id="cover-image" href="images/cover.jpg" media-type="image/jpeg" properties="cover-image" />
    <item id="cover" href="cover.xhtml" media-type="application/xhtml+xml" />` : '';

        const coverSpine = hasCover ? `
    <itemref idref="cover" linear="no" />` : '';

        return `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" unique-identifier="BookId" version="3.0">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:identifier id="BookId">urn:uuid:${uuid}</dc:identifier>
    <dc:title>${escapeXml(title || '제목 없음')}</dc:title>
    <dc:creator>${escapeXml(author || '작자 미상')}</dc:creator>
    <dc:language>ko</dc:language>
    <meta property="dcterms:modified">${new Date().toISOString().replace(/\.\d+Z$/, 'Z')}</meta>
  </metadata>
  <manifest>
    <item id="style" href="styles/style.css" media-type="text/css" />
    <item id="nav" href="toc.xhtml" media-type="application/xhtml+xml" properties="nav" />
    <item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml" />
    <item id="titlepage" href="title.xhtml" media-type="application/xhtml+xml" />
    <item id="chapter1" href="chapter.xhtml" media-type="application/xhtml+xml" />${coverManifest}
  </manifest>
  <spine toc="ncx">${coverSpine}
    <itemref idref="titlepage" />
    <itemref idref="chapter1" />
  </spine>
</package>`;
    };

    // ------------------------------------------------------------------
    // Template: toc.ncx (EPUB 2 compat)
    // ------------------------------------------------------------------
    const buildTocNcx = (uuid, title) => {
        return `<?xml version="1.0" encoding="UTF-8"?>
<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">
  <head>
    <meta name="dtb:uid" content="urn:uuid:${uuid}" />
  </head>
  <docTitle>
    <text>${escapeXml(title || '제목 없음')}</text>
  </docTitle>
  <navMap>
    <navPoint id="titlepage" playOrder="1">
      <navLabel><text>표지</text></navLabel>
      <content src="title.xhtml" />
    </navPoint>
    <navPoint id="chapter1" playOrder="2">
      <navLabel><text>본문</text></navLabel>
      <content src="chapter.xhtml" />
    </navPoint>
  </navMap>
</ncx>`;
    };

    // ------------------------------------------------------------------
    // Template: toc.xhtml (EPUB 3 nav)
    // ------------------------------------------------------------------
    const buildTocXhtml = (title) => {
        return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" lang="ko">
<head>
  <meta charset="UTF-8" />
  <title>목차</title>
  <link rel="stylesheet" href="styles/style.css" />
</head>
<body>
  <nav epub:type="toc">
    <h1>목차</h1>
    <ol>
      <li><a href="title.xhtml">${escapeXml(title || '표지')}</a></li>
      <li><a href="chapter.xhtml">본문</a></li>
    </ol>
  </nav>
</body>
</html>`;
    };

    // ------------------------------------------------------------------
    // Template: title.xhtml (Title Page)
    // ------------------------------------------------------------------
    const buildTitlePage = (title, author, character) => {
        const authorHtml = author ? `<p class="author">${escapeXml(author)}</p>` : '';
        const separatorHtml = (author || character) ? '<div class="separator"></div>' : '';
        const characterHtml = character ? `<p class="character">${escapeXml(character)}</p>` : '';

        return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" lang="ko">
<head>
  <meta charset="UTF-8" />
  <title>${escapeXml(title || '제목 없음')}</title>
  <link rel="stylesheet" href="styles/style.css" />
</head>
<body>
  <div class="title-page">
    <h1 class="title">${escapeXml(title || '제목 없음')}</h1>
    ${separatorHtml}
    ${authorHtml}
    ${characterHtml}
  </div>
</body>
</html>`;
    };

    // ------------------------------------------------------------------
    // Template: chapter.xhtml (Body)
    // ------------------------------------------------------------------
    const buildChapter = (title, bodyText) => {
        const bodyHtml = textToHtml(bodyText);

        return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" lang="ko">
<head>
  <meta charset="UTF-8" />
  <title>${escapeXml(title || '본문')}</title>
  <link rel="stylesheet" href="styles/style.css" />
</head>
<body>
  <div class="chapter-body">
${bodyHtml}
  </div>
</body>
</html>`;
    };

    // ------------------------------------------------------------------
    // Template: cover.xhtml
    // ------------------------------------------------------------------
    const buildCoverPage = () => {
        return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" lang="ko">
<head>
  <meta charset="UTF-8" />
  <title>표지</title>
  <link rel="stylesheet" href="styles/style.css" />
</head>
<body>
  <div class="cover-page">
    <img src="images/cover.jpg" alt="표지" />
  </div>
</body>
</html>`;
    };

    // ------------------------------------------------------------------
    // Main Build Function
    // ------------------------------------------------------------------
    const build = async ({ title, author, character, bodyText, coverImageData }) => {
        if (!window.JSZip) {
            throw new Error('JSZip 라이브러리가 로드되지 않았습니다.');
        }

        const uuid = generateUUID();
        const hasCover = !!coverImageData;
        const zip = new JSZip();

        // 1. mimetype (MUST be first, stored uncompressed)
        zip.file('mimetype', MIMETYPE, { compression: 'STORE' });

        // 2. META-INF/container.xml
        zip.file('META-INF/container.xml', CONTAINER_XML);

        // 3. OEBPS/content.opf
        zip.file('OEBPS/content.opf', buildContentOpf(uuid, title, author, hasCover));

        // 4. OEBPS/toc.ncx
        zip.file('OEBPS/toc.ncx', buildTocNcx(uuid, title));

        // 5. OEBPS/toc.xhtml
        zip.file('OEBPS/toc.xhtml', buildTocXhtml(title));

        // 6. OEBPS/styles/style.css
        zip.file('OEBPS/styles/style.css', EPUB_CSS);

        // 7. OEBPS/title.xhtml
        zip.file('OEBPS/title.xhtml', buildTitlePage(title, author, character));

        // 8. OEBPS/chapter.xhtml
        zip.file('OEBPS/chapter.xhtml', buildChapter(title, bodyText));

        // 9. Cover (optional)
        if (hasCover) {
            zip.file('OEBPS/cover.xhtml', buildCoverPage());

            // coverImageData is a base64 data URL or ArrayBuffer
            let imageData = coverImageData;
            if (typeof coverImageData === 'string' && coverImageData.startsWith('data:')) {
                // Extract base64 portion
                const base64 = coverImageData.split(',')[1];
                imageData = base64;
                zip.file('OEBPS/images/cover.jpg', imageData, { base64: true });
            } else {
                zip.file('OEBPS/images/cover.jpg', imageData);
            }
        }

        // Generate .epub (ZIP)
        const blob = await zip.generateAsync({
            type: 'blob',
            mimeType: 'application/epub+zip',
            compression: 'DEFLATE',
            compressionOptions: { level: 9 }
        });

        // Trigger download
        const fileName = `${(title || 'untitled').replace(/[^a-zA-Z0-9가-힣ㄱ-ㅎㅏ-ㅣ_\-\s]/g, '').trim()}.epub`;
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        return true;
    };

    return { build };
})();
