// dataChannel.ts
const CHUNK_SIZE = 16 * 1024; // Reduced to 16KB for better flow control
const MAX_BUFFER_THRESHOLD = 1024 * 1024; // 1MB buffer threshold

/**
 * Sends a file in chunks over a given RTCDataChannel with proper backpressure control.
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
  let isCancelled = false;

  const sendChunk = async () => {
    // If cancelled or channel is not open, stop sending
    if (isCancelled || channel.readyState !== 'open') {
      console.error('Data channel not open or transfer cancelled, stopping file transfer.');
      onError(new Error('Data channel not open or transfer cancelled.'));
      return;
    }

    // Check buffered amount and wait if too high
    await waitForBufferSpace(channel, MAX_BUFFER_THRESHOLD);

    if (isCancelled) return; // Check again after waiting

    try {
      const slice = file.slice(offset, offset + CHUNK_SIZE);
      const chunkData = await readFileSlice(slice);
      
      // Send metadata with the first chunk
      if (isFirstChunk) {
        const metadata = {
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
          isFirstChunk: true
        };
        
        // Wait for buffer space before sending metadata
        await waitForBufferSpace(channel, MAX_BUFFER_THRESHOLD);
        if (isCancelled) return;
        
        channel.send(JSON.stringify(metadata));
        console.log(`Started sending file: ${file.name} (${file.size} bytes)`);
        isFirstChunk = false;
      }

      // Wait for buffer space before sending chunk
      await waitForBufferSpace(channel, MAX_BUFFER_THRESHOLD);
      if (isCancelled) return;

      // Send the actual file chunk
      channel.send(chunkData);
      offset += chunkData.byteLength;
      
      const progress = Math.min(100, Math.round((offset / file.size) * 100));
      onProgress(progress);

      if (offset < file.size) {
        // Schedule next chunk
        setTimeout(sendChunk, 0);
      } else {
        // All chunks sent, send completion signal
        await waitForBufferSpace(channel, MAX_BUFFER_THRESHOLD);
        if (!isCancelled) {
          channel.send(JSON.stringify({ 
            done: true, 
            fileName: file.name, 
            fileType: file.type, 
            fileSize: file.size 
          }));
          console.log(`File "${file.name}" sent completely.`);
          onDone();
        }
      }
    } catch (e) {
      console.error('Error sending chunk or processing data:', e);
      onError(e instanceof Error ? e : new Error('Unknown error during chunk sending.'));
    }
  };

  // Start the transfer
  sendChunk();

  // Return a function to cancel the transfer
  return () => {
    isCancelled = true;
  };
}

/**
 * Waits for the data channel buffer to have enough space
 */
function waitForBufferSpace(channel: RTCDataChannel, maxBuffer: number): Promise<void> {
  return new Promise((resolve) => {
    const checkBuffer = () => {
      if (channel.readyState !== 'open') {
        resolve(); // Exit if channel closed
        return;
      }
      
      if (channel.bufferedAmount <= maxBuffer) {
        resolve();
      } else {
        // Log buffer status for debugging
        console.log(`Buffer full (${channel.bufferedAmount} bytes), waiting...`);
        setTimeout(checkBuffer, 10); // Check every 10ms
      }
    };
    checkBuffer();
  });
}

/**
 * Reads a file slice as ArrayBuffer using Promise
 */
function readFileSlice(slice: Blob): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = () => reject(new Error('Error reading file chunk'));
    reader.readAsArrayBuffer(slice);
  });
}

/**
 * Enhanced version with retry logic and better error handling
 */
export function sendFileInChunksWithRetry(
  file: File,
  channel: RTCDataChannel,
  onProgress: (progress: number) => void,
  onDone: () => void,
  onError: (error: Error) => void,
  maxRetries: number = 3
) {
  let retryCount = 0;
  
  const attemptSend = () => {
    const cancel = sendFileInChunks(
      file,
      channel,
      onProgress,
      onDone,
      (error) => {
        if (retryCount < maxRetries) {
          retryCount++;
          console.log(`Transfer failed, retrying... (${retryCount}/${maxRetries})`);
          setTimeout(attemptSend, 1000 * retryCount); // Exponential backoff
        } else {
          onError(new Error(`Transfer failed after ${maxRetries} retries: ${error.message}`));
        }
      }
    );
    
    return cancel;
  };
  
  return attemptSend();
}
