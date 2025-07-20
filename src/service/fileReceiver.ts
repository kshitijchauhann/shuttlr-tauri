// fileReceiver.ts


let receivedChunks: ArrayBuffer[] = [];
let currentFileName: string = '';
let currentFileSize: number = 0;
let receivedBytes: number = 0;

/**
 * Handles incoming messages on a DataChannel, distinguishing between file chunks and control messages.
 *
 * @param event The MessageEvent received from the DataChannel.
 * @param onProgress Callback function to report receiving progress (0-100).
 * @param onComplete Callback function to call when a file is completely received.
 */
export function handleIncomingFileChunk(
  event: MessageEvent,
  onProgress: (fileName: string, progress: number) => void,
  onComplete: (blob: Blob, name: string, type: string) => void
) {
  if (typeof event.data === "string") {
    try {
      const message = JSON.parse(event.data);
      if (message.isFirstChunk) {
        // Reset for a new file transfer
        receivedChunks = [];
        receivedBytes = 0;
        currentFileName = message.fileName;
        currentFileSize = message.fileSize;
        console.log(`Receiving new file: ${currentFileName} (${currentFileSize} bytes)`);
        onProgress(currentFileName, 0); // Initialize progress for new file
      } else if (message.done) {
        // File transfer complete
        const blob = new Blob(receivedChunks, { type: message.fileType });
        console.log(`File "${message.fileName}" received completely. Size: ${blob.size} bytes.`);
        onComplete(blob, message.fileName, message.fileType);
        // Reset for next transfer
        receivedChunks = [];
        receivedBytes = 0;
        currentFileName = '';
        currentFileSize = 0;
      }
    } catch (e) {
      console.warn("Could not parse incoming string message as JSON, treating as text:", event.data);
      // Handle non-JSON string messages if necessary (e.g., chat messages)
    }
  } else if (event.data instanceof ArrayBuffer) {
    // This is a file chunk
    receivedChunks.push(event.data);
    receivedBytes += event.data.byteLength;
    const progress = Math.min(100, Math.round((receivedBytes / currentFileSize) * 100));
    onProgress(currentFileName, progress);
  } else {
    console.log("Received unexpected data type:", typeof event.data, event.data);
  }
}
