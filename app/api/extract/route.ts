import { NextResponse } from "next/server";

export const runtime = "nodejs";

const MAX_BYTES = 2 * 1024 * 1024; // 2 MB — clinical notes are short; reject big ZIPs / scans

export async function POST(req: Request) {
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json(
      { error: "Expected multipart/form-data with a 'file' field" },
      { status: 400 },
    );
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }
  if (file.size === 0) {
    return NextResponse.json({ error: "Empty file" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: `File too large — limit is ${Math.round(MAX_BYTES / 1024)} KB` },
      { status: 413 },
    );
  }

  const name = file.name.toLowerCase();
  const mime = file.type;
  const buf = Buffer.from(await file.arrayBuffer());

  try {
    if (mime === "application/pdf" || name.endsWith(".pdf")) {
      const { PDFParse } = await import("pdf-parse");
      const parser = new PDFParse({ data: new Uint8Array(buf) });
      try {
        const result = await parser.getText();
        return NextResponse.json({
          text: result.text,
          kind: "pdf",
          pages: result.total,
          filename: file.name,
        });
      } finally {
        await parser.destroy();
      }
    }

    if (
      mime ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      name.endsWith(".docx")
    ) {
      const mammoth = await import("mammoth");
      const result = await mammoth.extractRawText({ buffer: buf });
      return NextResponse.json({
        text: result.value,
        kind: "docx",
        filename: file.name,
        warnings: result.messages.map((m) => m.message).slice(0, 5),
      });
    }

    if (mime.startsWith("text/") || name.endsWith(".txt") || name.endsWith(".md")) {
      return NextResponse.json({
        text: buf.toString("utf8"),
        kind: "text",
        filename: file.name,
      });
    }

    return NextResponse.json(
      {
        error: `Unsupported file type. Accepted: .txt, .md, .pdf, .docx (got ${mime || name})`,
      },
      { status: 415 },
    );
  } catch (err) {
    return NextResponse.json(
      {
        error: `Extraction failed: ${err instanceof Error ? err.message : String(err)}`,
      },
      { status: 502 },
    );
  }
}
