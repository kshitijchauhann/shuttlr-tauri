// fileReceiver.ts

// Use a Map to handle multiple concurrent file transfers with proper transfer IDs
const activeTransfers = new Map<string, {
  chunks: ArrayBuffer[];
  fileName: string;
  fileSize: number;
  receivedBytes: number;
  fileType: string;
  expectedChunkIndex: number;
  startTime: number;
}>();

/**
 * Handles incoming messages on a DataChannel, distinguishing between file chunks and control messages.
 * Now properly handles transfer IDs to prevent conflicts between concurrent transfers.
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
        const transferId = message.transferId;
        
        if (!transferId) {
          console.error("Received first chunk without transfer ID");
          return;
        }
        
        // Initialize new transfer
        activeTransfers.set(transferId, {
          chunks: [],
          fileName: message.fileName,
          fileSize: message.fileSize,
          receivedBytes: 0,
          fileType: message.fileType || 'application/octet-stream',
          expectedChunkIndex: 0,
          startTime: Date.now()
        });
        
        console.log(`[FileReceiver] Starting transfer ${transferId}: ${message.fileName} (${message.fileSize} bytes)`);
        onProgress(message.fileName, 0);
        
      } else if (message.isChunk) {
        // This is chunk metadata - just log it for now
        const transferId = message.transferId;
        const transfer = activeTransfers.get(transferId);
        
        if (transfer) {
          console.log(`[FileReceiver] Expecting chunk ${message.chunkIndex} for ${transferId} (${message.chunkSize} bytes)`);
        } else {
          console.warn(`[FileReceiver] Received chunk metadata for unknown transfer: ${transferId}`);
        }
        
      } else if (message.done) {
        const transferId = message.transferId;
        const transfer = activeTransfers.get(transferId);
        
        if (transfer) {
          // File transfer complete
          const blob = new Blob(transfer.chunks, { type: message.fileType || transfer.fileType });
          const duration = Date.now() - transfer.startTime;
          
          console.log(`[FileReceiver] Transfer ${transferId} completed: "${message.fileName}" (${blob.size} bytes) in ${duration}ms`);
          
          // Verify file size matches
          if (blob.size !== message.fileSize) {
            console.warn(`[FileReceiver] File size mismatch for ${transferId}: expected ${message.fileSize}, got ${blob.size}`);
          }
          
          // Clean up transfer
          activeTransfers.delete(transferId);
          
          onComplete(blob, message.fileName, message.fileType || transfer.fileType);
        } else {
          console.error(`[FileReceiver] No active transfer found for completion: ${transferId}`);
        }
      }
    } catch (e) {
      console.warn("[FileReceiver] Could not parse incoming string message as JSON:", e, event.data);
    }
  } else if (event.data instanceof ArrayBuffer) {
    // This is a file chunk - find the most recent transfer that's expecting chunks
    const transfers = Array.from(activeTransfers.entries());
    const mostRecentTransfer = transfers[transfers.length - 1];
    
    if (mostRecentTransfer) {
      const [transferId, transfer] = mostRecentTransfer;
      
      transfer.chunks.push(event.data);
      transfer.receivedBytes += event.data.byteLength;
      transfer.expectedChunkIndex++;
      
      const progress = Math.min(100, Math.round((transfer.receivedBytes / transfer.fileSize) * 100));
      onProgress(transfer.fileName, progress);
      
      console.log(`[FileReceiver] Chunk ${transfer.expectedChunkIndex} for ${transferId}: ${transfer.receivedBytes}/${transfer.fileSize} bytes (${progress}%)`);
    } else {
      console.error("[FileReceiver] Received file chunk but no active transfer found");
    }
  } else {
    console.log("[FileReceiver] Received unexpected data type:", typeof event.data);
  }
}

// Export function to clear all active transfers (useful for cleanup)
export function clearAllTransfers() {
  activeTransfers.clear();
  console.log("All active file transfers cleared");
}
