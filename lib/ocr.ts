import Tesseract from "tesseract.js";

export type OcrProgress = { status?: string; progress?: number };

export async function runOcrOnBlob(blob: Blob, onProgress?: (p: OcrProgress) => void) {
    const { data } = await Tesseract.recognize(blob, "spa", {
        logger: (m) => {
            onProgress?.({
                status: m.status,
                progress: typeof m.progress === "number" ? m.progress : undefined,
            });
        },
    });
    return data.text ?? "";
}
