import { createReadStream } from 'node:fs';
import { mediaFileDetails } from '../services/media-storage.service.js';

export function mediaController(service, mediaDir) {
  return {
    download: async (req, res) => {
      const story = await service.get(req.params.id);
      if (!story) return res.status(404).json({ error: 'Story not found.' });
      const { filePath, size } = await mediaFileDetails(mediaDir, story.filename);
      res.set({ 'Content-Type': story.mimeType, 'Accept-Ranges': 'bytes', 'Cache-Control': 'no-store' });
      const range = req.get('range');
      let start = 0;
      let end = size - 1;
      if (range) {
        const match = /^bytes=(\d*)-(\d*)$/.exec(range);
        if (!match) return res.status(416).set('Content-Range', 'bytes */' + size).end();
        const from = match[1] ? Number(match[1]) : null;
        const to = match[2] ? Number(match[2]) : null;
        if (from === null && to === null) return res.status(416).end();
        if (from === null) start = Math.max(0, size - to);
        else {
          start = from;
          if (to !== null) end = to;
        }
        if (start < 0 || start >= size || end < start || end >= size) {
          return res.status(416).set('Content-Range', 'bytes */' + size).end();
        }
        res.status(206).set('Content-Range', 'bytes ' + start + '-' + end + '/' + size);
      }
      res.set('Content-Length', String(end - start + 1));
      const stream = createReadStream(filePath, { start, end });
      stream.on('error', (error) => {
        if (!res.headersSent) res.status(500).json({ error: 'Could not read audio.' });
        else res.destroy(error);
      });
      stream.pipe(res);
    },
  };
}
