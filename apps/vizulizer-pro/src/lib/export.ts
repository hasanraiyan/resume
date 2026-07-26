import { AudioAnalyser } from './audio';

export async function exportVideo(canvas: HTMLCanvasElement | null, audioElement: HTMLAudioElement, analyser: AudioAnalyser | null, filename: string) {
  if (!canvas || !analyser) return;

  return new Promise<void>((resolve, reject) => {
    try {
      const stream = canvas.captureStream(60); // 60 FPS

      const dest = analyser.context.createMediaStreamDestination();
      analyser.analyser.connect(dest);

      const combinedStream = new MediaStream([
        ...stream.getVideoTracks(),
        ...dest.stream.getAudioTracks()
      ]);

      const options = { mimeType: 'video/webm; codecs=vp9' };
      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        options.mimeType = 'video/webm; codecs=vp8';
      }

      const mediaRecorder = new MediaRecorder(combinedStream, options);
      const chunks: BlobPart[] = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: options.mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        // Clean filename
        const cleanName = filename.replace(/\.[^/.]+$/, "");
        a.download = `${cleanName}_visualized.webm`;
        document.body.appendChild(a);
        a.click();

        setTimeout(() => {
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);
          resolve();
        }, 100);
      };

      mediaRecorder.start();

      // Play audio from start to capture
      audioElement.currentTime = 0;
      audioElement.play();

      audioElement.onended = () => {
        mediaRecorder.stop();
        analyser.analyser.disconnect(dest);
      };

    } catch (error) {
      console.error('Export failed:', error);
      reject(error);
    }
  });
}
