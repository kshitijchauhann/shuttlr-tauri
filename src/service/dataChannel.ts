// dataChannel.ts
const CHUNK_SIZE = 16 * 1024; // 16KB chunks
const MAX_BUFFER_THRESHOLD = 64 * 1024; // Reduced to 64KB for better responsiveness
const CHUNK_DELAY = 1; // 1ms delay between chunks to prevent overwhelming

/**
 * Generates a unique transfer ID
 */
function generateTransferId(): string {
  return `transfer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Sends a file in chunks over a given RTCDataChannel with proper backpressure control.
 * Each transfer gets a unique ID to prevent conflicts.
 *
 * @param file The File object to send.
 * @param channel The RTCDataChannel to send the file over.
 * @param onProgress Callback function to report sending progress (0-100).
 * @param onDone Callback function to call when the file is completely sent.
 * @param onError Callback function to call if an error occurs during sending.
 * @returns A function to cancel the transfer
 */
export function sendFileInChunks(
  file: File,
  channel: RTCDataChannel,
  onProgress: (progress: number) => void,
  onDone: () => void,
  onError: (error: Error) => void
): () => void {
  const transferId = generateTransferId();
  let offset = 0;
  let isFirstChunk = true;
  let isCancelled = false;
  let chunkIndex = 0;

  console.log(`[DataChannel] Starting transfer ${transferId} for file: ${file.name}`);

  const sendChunk = async () => {
    // Check if cancelled or channel is not open
    if (isCancelled) {
      console.log(`[DataChannel] Transfer ${transferId} cancelled`);
      return;
    }

    if (channel.readyState !== 'open') {
      console.error(`[DataChannel] Channel not open for transfer ${transferId}. State: ${channel.readyState}`);
      onError(new Error(`Data channel not open. State: ${channel.readyState}`));
      return;
    }

    try {
      // Wait for buffer space before processing
      await waitForBufferSpace(channel, MAX_BUFFER_THRESHOLD);
      
      if (isCancelled) return;

      // Send metadata with the first chunk
      if (isFirstChunk) {
        const metadata = {
          transferId,
          fileName: file.name,
          fileType: file.type || 'application/octet-stream',
          fileSize: file.size,
          isFirstChunk: true,
          timestamp: Date.now()
        };
        
        console.log(`[DataChannel] Sending metadata for ${transferId}:`, metadata);
        channel.send(JSON.stringify(metadata));
        isFirstChunk = false;
        
        // Small delay after metadata
        await new Promise(resolve => setTimeout(resolve, CHUNK_DELAY));
        if (isCancelled) return;
      }

      // Read and send the next chunk
      const slice = file.slice(offset, offset + CHUNK_SIZE);
      const chunkData = await readFileSlice(slice);
      
      // Wait for buffer space before sending chunk
      await waitForBufferSpace(channel, MAX_BUFFER_THRESHOLD);
      if (isCancelled) return;

      // Create chunk metadata and send it first
      const chunkMetadata = {
        transferId,
        chunkIndex,
        isChunk: true,
        chunkSize: chunkData.byteLength
      };
      
      channel.send(JSON.stringify(chunkMetadata));
      
      // Small delay then send the actual chunk data
      await new Promise(resolve => setTimeout(resolve, 1));
      if (isCancelled) return;
      
      channel.send(chunkData);
      
      offset += chunkData.byteLength;
      chunkIndex++;
      
      const progress = Math.min(100, Math.round((offset / file.size) * 100));
      onProgress(progress);

      console.log(`[DataChannel] Sent chunk ${chunkIndex} for ${transferId}: ${offset}/${file.size} bytes (${progress}%)`);

      if (offset < file.size) {
        // Schedule next chunk with a small delay
        setTimeout(sendChunk, CHUNK_DELAY);
      } else {
        // All chunks sent, send completion signal
        await waitForBufferSpace(channel, MAX_BUFFER_THRESHOLD);
        if (!isCancelled) {
          const completionMessage = {
            transferId,
            done: true,
            fileName: file.name,
            fileType: file.type || 'application/octet-stream',
            fileSize: file.size,
            totalChunks: chunkIndex,
            timestamp: Date.now()
          };
          
          console.log(`[DataChannel] Sending completion for ${transferId}:`, completionMessage);
          channel.send(JSON.stringify(completionMessage));
          onDone();
        }
      }
    } catch (error) {
      console.error(`[DataChannel] Error in transfer ${transferId}:`, error);
      onError(error instanceof Error ? error : new Error('Unknown error during chunk sending.'));
    }
  };

  // Start the transfer
  sendChunk();

  // Return cancellation function
  return () => {
    console.log(`[DataChannel] Cancelling transfer ${transferId}`);
    isCancelled = true;
  };
}

/**
 * Waits for the data channel buffer to have enough space with timeout
 */
function waitForBufferSpace(channel: RTCDataChannel, maxBuffer: number, timeout: number = 10000): Promise<void> {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    
    const checkBuffer = () => {
      const elapsed = Date.now() - startTime;
      
      if (elapsed > timeout) {
        reject(new Error(`Buffer wait timeout after ${timeout}ms`));
        return;
      }
      
      if (channel.readyState !== 'open') {
        reject(new Error('Channel closed while waiting for buffer space'));
        return;
      }
      
      if (channel.bufferedAmount <= maxBuffer) {
        resolve();
      } else {
        // Log buffer status occasionally for debugging
        if (elapsed % 1000 < 50) { // Log roughly every second
          console.log(`[DataChannel] Buffer: ${channel.bufferedAmount}/${maxBuffer} bytes, waiting... (${elapsed}ms)`);
        }
        setTimeout(checkBuffer, 50); // Check every 50ms
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
    
    const timeout = setTimeout(() => {
      reader.abort();
      reject(new Error('File reading timeout'));
    }, 5000); // 5 second timeout
    
    reader.onload = () => {
      clearTimeout(timeout);
      resolve(reader.result as ArrayBuffer);
    };
    
    reader.onerror = () => {
      clearTimeout(timeout);
      reject(new Error(`Error reading file chunk: ${reader.error?.message}`));
    };
    
    reader.onabort = () => {
      clearTimeout(timeout);
      reject(new Error('File reading aborted'));
    };
    
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
): () => void {
  let retryCount = 0;
  let currentCancel: (() => void) | null = null;
  
  const attemptSend = () => {
    currentCancel = sendFileInChunks(
      file,
      channel,
      onProgress,
      onDone,
      (error) => {
        if (retryCount < maxRetries && channel.readyState === 'open') {
          retryCount++;
          const delay = Math.min(1000 * Math.pow(2, retryCount - 1), 5000); // Exponential backoff, max 5s
          console.log(`[DataChannel] Transfer failed, retrying in ${delay}ms... (${retryCount}/${maxRetries})`);
          setTimeout(attemptSend, delay);
        } else {
          onError(new Error(`Transfer failed after ${maxRetries} retries: ${error.message}`));
        }
      }
    );
  };
  
  attemptSend();
  
  // Return a function that can cancel the current attempt
  return () => {
    if (currentCancel) {
      currentCancel();
    }
  };
}
