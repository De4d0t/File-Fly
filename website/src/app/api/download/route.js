import fs from 'fs';
import path from 'path';

export async function GET() {
  const localExePath = path.resolve(process.cwd(), '../dist-app/FileFly 1.0.0.exe');

  if (fs.existsSync(localExePath)) {
    const stats = fs.statSync(localExePath);
    const nodeStream = fs.createReadStream(localExePath);

    const webStream = new ReadableStream({
      start(controller) {
        nodeStream.on('data', (chunk) => controller.enqueue(chunk));
        nodeStream.on('end', () => controller.close());
        nodeStream.on('error', (err) => controller.error(err));
      },
    });

    return new Response(webStream, {
      headers: {
        'Content-Disposition': 'attachment; filename="FileFly-1.0.0.exe"',
        'Content-Type': 'application/vnd.microsoft.portable-executable',
        'Content-Length': stats.size.toString(),
      },
    });
  }

  // Fallback to latest GitHub Release direct download asset
  return Response.redirect('https://github.com/De4d0t/File-Fly/releases/latest/download/FileFly.exe', 302);
}
