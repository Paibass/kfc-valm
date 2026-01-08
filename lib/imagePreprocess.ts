export async function preprocessToBlob(file: File): Promise<Blob> {
    const imgUrl = URL.createObjectURL(file);
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const el = new Image();
        el.onload = () => resolve(el);
        el.onerror = reject;
        el.src = imgUrl;
    });

    const maxW = 1400;
    const scale = Math.min(1, maxW / img.width);
    const w = Math.round(img.width * scale);
    const h = Math.round(img.height * scale);

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("No canvas context");

    ctx.drawImage(img, 0, 0, w, h);

    const im = ctx.getImageData(0, 0, w, h);
    const d = im.data;

    const contrast = 1.35;
    const intercept = 128 * (1 - contrast);

    for (let i = 0; i < d.length; i += 4) {
        const r = d[i], g = d[i + 1], b = d[i + 2];
        let y = 0.2126 * r + 0.7152 * g + 0.0722 * b;
        y = y * contrast + intercept;
        const v = y > 160 ? 255 : 0;
        d[i] = v; d[i + 1] = v; d[i + 2] = v;
    }

    ctx.putImageData(im, 0, 0);
    URL.revokeObjectURL(imgUrl);

    return await new Promise<Blob>((resolve) => {
        canvas.toBlob((b) => resolve(b!), "image/png", 1.0);
    });
}
