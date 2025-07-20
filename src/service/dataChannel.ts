
// dataChannel.ts


const CHUNK_SIZE = 64 * 1024; // 64KB chunks

/**
 * Sends a file in chunks over a given RTCDataChannel.
 * It also sends metadata (name, type, size) with the first chunk
 * and a 'done' signal with the last chunk.
 *
 * @param file The File object to send.
 * @param channel The RTCDataChannel to send the file over.
 * @param onProgress Callback function to report sending progress (0-100).
 * @param onDone Callback function to call when the file is completely sent.
 * @param onError Callback function to call if an error occurs during sending.
 */
export function sendFileInChunks(
  file: File,
  channel: RTCDataChannel,
  onProgress: (progress: number) => void,
  onDone: () => void,
  onError: (error: Error) => void
) {
  let offset = 0;
  let isFirstChunk = true;

  const sendChunk = () => {
    // If the channel is not open, stop sending and report error.
    if (channel.readyState !== 'open') {
      console.error('Data channel not open, stopping file transfer.');
      onError(new Error('Data channel not open.'));
      return;
    }

    const slice = file.slice(offset, offset + CHUNK_SIZE);
    const reader = new FileReader();

    reader.onload = () => {
      try {
        const chunkData = reader.result as ArrayBuffer;

        // Send metadata with the first chunk
        if (isFirstChunk) {
          const metadata = {
            fileName: file.name,
            fileType: file.type,
            fileSize: file.size,
            isFirstChunk: true
          };
          // Send metadata as a JSON string
          channel.send(JSON.stringify(metadata));
          isFirstChunk = false;
        }

        // Send the actual file chunk
        channel.send(chunkData);
        offset += chunkData.byteLength; // Use actual byteLength for accurate offset

        const progress = Math.min(100, Math.round((offset / file.size) * 100));
        onProgress(progress);

        if (offset < file.size) {
          // Send next chunk with a small delay to prevent buffer overflow
          // This is a simple flow control; for very large files, a more sophisticated
          // backpressure mechanism might be needed (e.g., checking channel.bufferedAmount)
          setTimeout(sendChunk, 0);
        } else {
          // All chunks sent, send completion signal
          channel.send(JSON.stringify({ done: true, fileName: file.name, fileType: file.type, fileSize: file.size }));
          console.log(`File "${file.name}" sent completely.`);
          onDone(); // Signal completion
        }
      } catch (e) {
        console.error('Error sending chunk or processing data:', e);
        onError(e instanceof Error ? e : new Error('Unknown error during chunk sending.'));
      }
    };

    reader.onerror = (error) => {
      console.error('Error reading file chunk:', error);
      onError(new Error('Error reading file chunk.'));
    };

    reader.readAsArrayBuffer(slice);
  };

  console.log(`Starting to send file: ${file.name} (${file.size} bytes)`);
  sendChunk();
}
