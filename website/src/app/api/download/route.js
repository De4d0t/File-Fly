import fs from 'fs';
import path from 'path';
import { APP_VERSION } from '../../../config/version';

export async function GET() {
  const version = APP_VERSION;
  
  const possiblePaths = [
    path.resolve(process.cwd(), `../dist-app/FileFly ${version}.exe`),
    path.resolve(process.cwd(), `../dist-app/FileFly-${version}.exe`),
    path.resolve(process.cwd(), '../dist-app/FileFly.exe'),
  ];

  const localExePath = possiblePaths.find(p => fs.existsSync(p));

  if (localExePath) {
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
        'Content-Disposition': `attachment; filename="FileFly-${version}.exe"`,
        'Content-Type': 'application/vnd.microsoft.portable-executable',
        'Content-Length': stats.size.toString(),
      },
    });
  }

  // Fallback to latest GitHub Release direct download asset
  return Response.redirect('https://github.com/De4d0t/File-Fly/releases/latest/download/FileFly.exe', 302);
}
