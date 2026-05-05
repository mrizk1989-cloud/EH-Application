const FileHandler = {

    // ================= PREVIEW =================
    preview(file) {
        const url = file.url;
        const type = file.mimeType || "";
        const ext = file.extension || "";

        console.log("Preview:", { url, type, ext });

        if (!url) return;

        // ================= IMAGES =================
        if (
            type.startsWith("image/") ||
            ext.match(/\.(jpg|jpeg|png|webp|gif)$/i)
        ) {
            console.log("Opening image:", url);
            const optimized = url.replace("/upload/", "/upload/f_auto,q_auto/");
            window.open(optimized, "_blank");
            return;
        }

        // ================= PDF =================
        if (
            type === "application/pdf" ||
            ext === ".pdf"
        ) {
            console.log("Opening PDF:", url);
            // const pdfUrl = url.replace("/upload/", "/upload/fl_inline/");
            // window.open(pdfUrl, "_blank");

            const viewer = `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(url)}`;
            window.open(viewer, "_blank");

            window.open(pdfUrl, "_blank");
            return;
        }

        // ================= OFFICE FILES =================
        function openOfficeFile(url, fileName) {

            let cleanUrl = url.split("?")[0];

            // ================= EXTENSION =================
            let ext = "";

            const extMatch = fileName?.match(/\.(xls|xlsx|doc|docx|ppt|pptx)$/i);
            if (extMatch) ext = extMatch[0];

            if (ext && !cleanUrl.toLowerCase().endsWith(ext.toLowerCase())) {
                cleanUrl += ext;
            }

            // ================= VIEW =================
            const googleViewer = `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(cleanUrl)}`;
            const win = window.open(googleViewer, "_blank");

            // ================= FALLBACK =================
            setTimeout(() => {

                if (!win || win.closed) {

                    console.warn("Viewer failed → fixing filename download");

                    const baseName = fileName
                        ? fileName.replace(/\.[^/.]+$/, "")
                        : "file";

                    const finalName = baseName + (ext || "");

                    // 🔥 IMPORTANT: regex replace (not simple replace)
                    const downloadUrl = cleanUrl.replace(
                        /\/upload\/(?!.*\/upload\/)/,
                        `/upload/fl_attachment:${encodeURIComponent(finalName)}/`
                    );

                    console.log("DOWNLOAD URL:", downloadUrl); // DEBUG

                    const a = document.createElement("a");
                    a.href = downloadUrl;
                    a.target = "_blank";

                    document.body.appendChild(a);
                    a.click();
                    a.remove();
                }

            }, 2000);
        }
        // ================= DEFAULT =================
        console.log("Fallback open:", url);
        window.open(url, "_blank");
    },



    // ================= DOWNLOAD =================
    download(file) {
        if (!file?.url) return;

        const a = document.createElement("a");

        a.href = file.url.replace(
            "/upload/",
            `/upload/fl_attachment:${encodeURIComponent(file.originalName)}/`
        );
        a.target = "_blank";

        document.body.appendChild(a);
        a.click();
        a.remove();
    },

    // ================= FILE TYPE LABEL =================
    getTypeLabel(file) {
        if (!file?.originalName) return "File";

        const name = file.originalName.toLowerCase();

        if (name.endsWith(".pdf")) return "PDF";
        if (name.match(/\.(jpg|jpeg|png|webp)$/)) return "Image";
        if (name.match(/\.(doc|docx)$/)) return "Word";
        if (name.match(/\.(xls|xlsx)$/)) return "Excel";
        if (name.match(/\.(ppt|pptx)$/)) return "PowerPoint";

        return "File";
    },

    // ================= RENDER =================
    render(file) {
        return `
            <div class="file-item" data-file='${JSON.stringify(file)}'>
                <span>${file.originalName}</span>
                <button class="file-preview">👁</button>
                <button class="file-download">⬇</button>
            </div>
        `;

    },

    // ================= INIT GLOBAL LISTENER =================
    init() {
        console.log("FileHandler initialized"); // ✅ should print ONCE

        document.addEventListener("click", (e) => {
            console.log("Click detected:", e.target); // ✅ should spam on clicks

            const container = e.target.closest(".file-item");
            if (!container) return;

            console.log("File item clicked"); // ✅ MUST appear

            const file = JSON.parse(container.dataset.file);

            if (e.target.classList.contains("file-preview")) {
                console.log("Preview button clicked"); // ✅ MUST appear
                FileHandler.preview(file);
            }

            if (e.target.classList.contains("file-download")) {
                console.log("Download button clicked");
                FileHandler.download(file);
            }
        });
    }

};

export default FileHandler;