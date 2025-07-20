import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Box,
  Typography,
  Button,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Snackbar,
  Alert as MuiAlert,
  Chip,
  Card,
  CardHeader,
  CardContent,
  CardActions
} from '@mui/material';
import { 
  InsertDriveFile, 
  Clear, 
  CloudUpload, 
  Send, 
  GetApp as DownloadIcon,
  CheckCircle,
  Error as ErrorIcon,
  ArrowBack
} from '@mui/icons-material';
import useWebRTCStore from '../store/webrtcStore';

interface FileWithProgress {
  id: string;
  file: File;
  name: string;
  size: number;
  type: string;
  progress: number;
  status: 'pending' | 'sending' | 'sent' | 'error';
  bytesSent: number;
  formattedSize: string;
}

interface ReceivedFile {
  id: string;
  name: string;
  type: string;
  blob: Blob;
  progress: number; // For received file progress
  status: 'receiving' | 'received';
}

const FileTransferPage = () => {
  const navigate = useNavigate();
  const [filesToSend, setFilesToSend] = useState<FileWithProgress[]>([]);
  const [receivedFiles, setReceivedFiles] = useState<ReceivedFile[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fileQueueRef = useRef<FileWithProgress[]>([]);
  const isProcessingQueueRef = useRef(false);
  const wasConnectedRef = useRef(false);

  const {
    peer,
    isConnected,
    isCaller,
    sendFile,
    setFileSendProgressHandler,
    setFileReceiveProgressHandler,
    setFileCompleteHandler
  } = useWebRTCStore();

  // Format file size to human-readable string
  const formatFileSize = useCallback((bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }, []);

  const handleDownloadFile = useCallback((blob: Blob, fileName: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, []);

  // Set up file transfer handlers
  useEffect(() => {
    // Set up receive progress handler
    const onReceiveProgress = (fileName: string, progress: number) => {
      setReceivedFiles(prev => {
        const existingFile = prev.find(f => f.name === fileName);
        if (existingFile) {
          return prev.map(f => 
            f.name === fileName 
              ? { 
                  ...f, 
                  progress, 
                  status: progress < 100 ? 'receiving' as const : 'received' as const 
                }
              : f
          );
        } else {
          return [
            ...prev,
            {
              id: `${fileName}-${Date.now()}`,
              name: fileName,
              type: 'application/octet-stream',
              blob: new Blob(),
              progress,
              status: 'receiving' as const
            }
          ];
        }
      });
    };

    // Set up file complete handler
    const onComplete = (blob: Blob, fileName: string, fileType: string) => {
      setReceivedFiles(prev => {
        const updatedFiles = prev.map(f => 
          f.name === fileName
            ? { 
                ...f, 
                blob, 
                type: fileType || f.type,
                progress: 100,
                status: 'received' as const 
              } 
            : f
        );
        
        // If this is a new file, add it
        if (!prev.some(f => f.name === fileName)) {
          updatedFiles.push({
            id: `${fileName}-${Date.now()}`,
            name: fileName,
            type: fileType || 'application/octet-stream',
            blob,
            progress: 100,
            status: 'received' as const
          });
        }
        
        return updatedFiles;
      });
      
      // Show download notification
      setInfo(`File "${fileName}" received successfully!`);
      setTimeout(() => setInfo(null), 5000);
    };

    // Set up send progress handler
    const onSendProgress = (fileName: string, progress: number, bytesSent: number, totalBytes: number) => {
      setFilesToSend(prev =>
        prev.map(f =>
          f.name === fileName
            ? {
                ...f,
                progress,
                bytesSent,
                size: totalBytes,
                formattedSize: formatFileSize(totalBytes),
                status: progress < 100 ? 'sending' as const : 'sent' as const
              }
            : f
        )
      );
    };

    // Register handlers
    if (setFileSendProgressHandler) {
      setFileSendProgressHandler(onSendProgress);
    }
    
    if (setFileReceiveProgressHandler) {
      setFileReceiveProgressHandler(onReceiveProgress);
    }
    
    if (setFileCompleteHandler) {
      setFileCompleteHandler(onComplete);
    }
    
    // Clean up handlers on unmount
    return () => {
      if (setFileSendProgressHandler) setFileSendProgressHandler(() => {});
      if (setFileReceiveProgressHandler) setFileReceiveProgressHandler(() => {});
      if (setFileCompleteHandler) setFileCompleteHandler(() => {});
    };
  }, [setFileSendProgressHandler, setFileReceiveProgressHandler, setFileCompleteHandler, formatFileSize]);

  // Update file size formatting when files are added
  useEffect(() => {
    setFilesToSend(prev => 
      prev.map(file => {
        // Only update if formattedSize is not set or if size changed
        if (!file.formattedSize || file.size !== file.file.size) {
          return {
            ...file,
            formattedSize: formatFileSize(file.size)
          };
        }
        return file;
      })
    );
  }, [filesToSend.length, formatFileSize]);

  useEffect(() => {
    if (isConnected) {
      wasConnectedRef.current = true;
    }
  }, [isConnected]);

  const processFileQueue = useCallback(async () => {
    if (fileQueueRef.current.length === 0 || isProcessingQueueRef.current || !isConnected || !sendFile) return;

    isProcessingQueueRef.current = true;
    const nextFile = fileQueueRef.current[0];

    try {
      // Update file status to sending
      setFilesToSend(prev => prev.map(f =>
        f.id === nextFile.id ? { ...f, status: 'sending' as const } : f
      ));

      // Create a promise that resolves when the file is sent
      await new Promise<void>((resolve, reject) => {
        const progressCallback: (fileName: string, progress: number, bytesSent: number, totalBytes: number) => void = (_fileName, progress, bytesSent, totalBytes) => {
          setFilesToSend(prev =>
            prev.map(f =>
              f.id === nextFile.id 
                ? { 
                    ...f, 
                    progress,
                    bytesSent,
                    size: totalBytes,
                    formattedSize: formatFileSize(totalBytes)
                  } 
                : f
            )
          );
        };

        // Call sendFile with proper typing
        sendFile(nextFile.file, progressCallback)
          .then(() => {
            // Update file status to sent
            setFilesToSend(prev =>
              prev.map(f =>
                f.id === nextFile.id 
                  ? { 
                      ...f, 
                      status: 'sent' as const, 
                      progress: 100,
                      bytesSent: f.file.size
                    } 
                  : f
              )
            );
            setInfo(`File "${nextFile.name}" sent successfully!`);
            resolve();
          })
          .catch((err) => {
            console.error('Error sending file:', err);
            setError(`Failed to send file "${nextFile.name}".`);
            setFilesToSend(prev =>
              prev.map(f =>
                f.id === nextFile.id ? { ...f, status: 'error' as const } : f
              )
            );
            reject(err);
          });
      });
    } catch (err) {
      console.error('Error in file send loop:', err);
    } finally {
      // Remove the processed file from the queue
      fileQueueRef.current.shift();
      isProcessingQueueRef.current = false;
      // Process next file in queue if any
      if (fileQueueRef.current.length > 0) {
        processFileQueue();
      } else {
        setIsSending(false); // All files in queue processed, stop sending indicator
      }
    }
  }, [isConnected, sendFile, formatFileSize]);

  // Set up file transfer handlers
  useEffect(() => {
    if (!isConnected || !peer) return;

    // Set up send progress handler
    const handleSendProgress = (fileName: string, progress: number, bytesSent: number, totalBytes: number) => {
      setFilesToSend(prev =>
        prev.map(file =>
          file.name === fileName 
            ? { 
                ...file, 
                progress, 
                status: progress < 100 ? 'sending' as const : 'sent' as const,
                bytesSent,
                size: totalBytes,
                formattedSize: formatFileSize(totalBytes)
              } 
            : file
        )
      );
    };

    // Set up receive progress handler
    const handleReceiveProgress = (fileName: string, progress: number) => {
      setReceivedFiles(prev => {
        const existingFile = prev.find(f => f.name === fileName);
        if (existingFile) {
          return prev.map(f => 
            f.name === fileName 
              ? { 
                  ...f, 
                  progress, 
                  status: progress < 100 ? 'receiving' as const : 'received' as const 
                } 
              : f
          );
        } else {
          return [
            ...prev,
            {
              id: `recv-${Date.now()}`,
              name: fileName,
              type: 'application/octet-stream',
              blob: new Blob(),
              progress,
              status: 'receiving' as const
            }
          ];
        }
      });
    };

    // Set up file complete handler
    const handleFileComplete = (blob: Blob, fileName: string, fileType: string) => {
      setReceivedFiles(prev => {
        const updatedFiles = prev.map(f => 
          f.name === fileName
            ? { 
                ...f, 
                blob, 
                type: fileType || f.type,
                progress: 100,
                status: 'received' as const 
              } 
            : f
        );
        
        // If this is a new file, add it
        if (!prev.some(f => f.name === fileName)) {
          updatedFiles.push({
            id: `recv-${Date.now()}`,
            name: fileName,
            type: fileType || 'application/octet-stream',
            blob,
            progress: 100,
            status: 'received' as const
          });
        }
        
        return updatedFiles;
      });
      
      // Show download notification
      setInfo(`File "${fileName}" received successfully!`);
      setTimeout(() => setInfo(null), 5000);
    };

    // Register handlers
    if (setFileSendProgressHandler) {
      setFileSendProgressHandler(handleSendProgress);
    }
    
    if (setFileReceiveProgressHandler) {
      setFileReceiveProgressHandler(handleReceiveProgress);
    }
    
    if (setFileCompleteHandler) {
      setFileCompleteHandler(handleFileComplete);
    }
    
    // Clean up handlers on unmount
    return () => {
      if (setFileSendProgressHandler) setFileSendProgressHandler(() => {});
      if (setFileReceiveProgressHandler) setFileReceiveProgressHandler(() => {});
      if (setFileCompleteHandler) setFileCompleteHandler(() => {});
    };
  }, [isConnected, peer, setFileSendProgressHandler, setFileReceiveProgressHandler, setFileCompleteHandler, formatFileSize]);

  const handleSendFiles = useCallback(async () => {
    if (filesToSend.length === 0 || !isConnected || !sendFile) return;

    setIsSending(true);
    const filesToProcess = [...filesToSend];

    for (const file of filesToProcess) {
      try {
        // Update file status to sending
        setFilesToSend(prev =>
          prev.map(f =>
            f.id === file.id ? { ...f, status: 'sending' as const, progress: 0 } : f
          )
        );

        // Create a promise that resolves when the file is sent
        await new Promise<void>((resolve, reject) => {
          const progressCallback: (fileName: string, progress: number, bytesSent: number, totalBytes: number) => void = (_fileName, progress, bytesSent, totalBytes) => {
            setFilesToSend(prev =>
              prev.map(f =>
                f.id === file.id 
                  ? { 
                      ...f, 
                      progress,
                      bytesSent,
                      size: totalBytes,
                      formattedSize: formatFileSize(totalBytes)
                    } 
                  : f
              )
            );
          };

          // Call sendFile with proper typing
          sendFile(file.file, progressCallback)
            .then(() => {
              // Update file status to sent
              setFilesToSend(prev =>
                prev.map(f =>
                  f.id === file.id 
                    ? { 
                        ...f, 
                        status: 'sent' as const, 
                        progress: 100,
                        bytesSent: f.file.size
                      } 
                    : f
                )
              );
              setInfo(`File "${file.name}" sent successfully!`);
              resolve();
            })
            .catch((err) => {
              console.error('Error sending file:', err);
              setError(`Failed to send file "${file.name}".`);
              setFilesToSend(prev =>
                prev.map(f =>
                  f.id === file.id ? { ...f, status: 'error' as const } : f
                )
              );
              reject(err);
            });
        });
      } catch (err) {
        console.error('Error in file send loop:', err);
      }
    }
    
    setIsSending(false);
  }, [filesToSend, isConnected, sendFile, formatFileSize]);

  const handleBack = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  const renderConnectionStatus = useCallback(() => (
    <Box sx={{ mb: 3 }}>
      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
        Connection Status
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <Box
          sx={{
            width: 12,
            height: 12,
            borderRadius: '50%',
            bgcolor: isConnected ? 'success.main' : 'error.main',
            mr: 1,
            boxShadow: '0 0 8px currentColor'
          }}
        />
        <Typography variant="body2">
          {isConnected ? 'Connected' : 'Disconnected'}
          {isConnected && peer && (
            <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
              ({isCaller ? 'Sender' : 'Receiver'})
            </Typography>
          )}
        </Typography>
      </Box>
    </Box>
  ), [isConnected, peer, isCaller]);

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0) return;
    
    const newFiles = Array.from(event.target.files).map(file => ({
      id: `${file.name}-${file.size}-${Date.now()}`,
      file,
      name: file.name,
      size: file.size,
      type: file.type,
      progress: 0,
      status: 'pending' as const,
      bytesSent: 0,
      formattedSize: formatFileSize(file.size)
    }));

    setFilesToSend(prev => [...prev, ...newFiles]);
    fileQueueRef.current = [...fileQueueRef.current, ...newFiles];
    
    // Start processing the queue if not already processing
    if (!isProcessingQueueRef.current) {
      processFileQueue();
    }
  }, [processFileQueue, formatFileSize]);

  const renderSenderUI = useCallback(() => (
    <Card variant="outlined" sx={{ mb: 3, display: isCaller ? 'block' : 'none' }}>
      <CardHeader 
        title={
          <Box display="flex" alignItems="center">
            <CloudUpload sx={{ mr: 1 }} />
            <span>Send Files</span>
          </Box>
        }
        subheader="Select files to send to the other device"
      />
      <CardContent>
        <input
          type="file"
          ref={fileInputRef}
          onChange={(event) => {
            handleFileSelect(event);
            // Clear the input to allow selecting the same file again
            if (event.target) {
              event.target.value = '';
            }
          }}
          multiple
          style={{ display: 'none' }}
        />
        <Button
          variant="outlined"
          onClick={() => fileInputRef.current?.click()}
          disabled={!isConnected || isSending}
          startIcon={<CloudUpload />}
          fullWidth
          sx={{ 
            mb: 2,
            bgcolor: '#fbbb52',
            color: 'black',
            borderColor: '#fbbb52',
            '&:hover': {
              bgcolor: '#fbbb52',
              borderColor: '#fbbb52',
              opacity: 0.8
            },
            '& .MuiButton-startIcon': {
              color: 'black'
            }
          }}
        >
          Select Files
        </Button>

        {filesToSend.length > 0 && (
          <List dense>
            {filesToSend.map((file) => (
              <ListItem
                key={file.id}
                secondaryAction={
                  <IconButton
                    edge="end"
                    aria-label="remove"
                    onClick={() =>
                      setFilesToSend((prev) =>
                        prev.filter((f) => f.id !== file.id)
                      )
                    }
                    disabled={isSending}
                  >
                    <Clear />
                  </IconButton>
                }
              >
                <ListItemIcon>
                  <InsertDriveFile />
                </ListItemIcon>
                <ListItemText
                  primary={file.name}
                  secondary={
                    <Box>
                      <Typography variant="caption" display="block">
                        {file.formattedSize}
                      </Typography>
                      {file.status === 'sending' && (
                        <LinearProgress
                          variant="determinate"
                          value={file.progress}
                          sx={{ mt: 1 }}
                        />
                      )}
                      {file.status === 'sent' && (
                        <Chip
                          icon={<CheckCircle fontSize="small" />}
                          label="Sent"
                          size="small"
                          color="success"
                          variant="outlined"
                          sx={{ mt: 0.5 }}
                        />
                      )}
                      {file.status === 'error' && (
                        <Chip
                          icon={<ErrorIcon fontSize="small" />}
                          label="Error"
                          size="small"
                          color="error"
                          variant="outlined"
                          sx={{ mt: 0.5 }}
                        />
                      )}
                    </Box>
                  }
                  // Fix: Add primaryTypographyProps and secondaryTypographyProps to use div instead of p
                  primaryTypographyProps={{ component: 'div' }}
                  secondaryTypographyProps={{ component: 'div' }}
                />
              </ListItem>
            ))}
          </List>
        )}
      </CardContent>
      <CardActions>
        <Button
          variant="contained"
          color="primary"
          onClick={handleSendFiles}
          disabled={filesToSend.length === 0 || !isConnected || isSending}
          startIcon={<Send />}
          fullWidth
          sx={{
            bgcolor: '#fbbb52',
            color: 'black',
            '&:hover': {
              bgcolor: '#fbbb52',
              opacity: 0.8
            },
            '& .MuiButton-startIcon': {
              color: 'black'
            }
          }}
        >
          {isSending ? 'Sending...' : 'Send Files'}
        </Button>
      </CardActions>
    </Card>
  ), [filesToSend, isSending, isConnected, handleSendFiles, handleFileSelect, isCaller, formatFileSize]);

  const renderReceiverUI = useCallback(() => {
    if (receivedFiles.length === 0) {
      return (
        <Card variant="outlined">
          <CardHeader title="No files received yet" />
          <CardContent>
            <Typography variant="body2" color="text.secondary">
              Waiting for files to be sent...
            </Typography>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card variant="outlined">
        <CardHeader title="Received Files" />
        <CardContent>
          <List>
            {receivedFiles.map((file) => (
              <ListItem
                key={file.id}
                secondaryAction={
                  <IconButton
                    edge="end"
                    aria-label="download"
                    onClick={() => handleDownloadFile(file.blob, file.name)}
                    disabled={file.status !== 'received'}
                  >
                    <DownloadIcon />
                  </IconButton>
                }
              >
                <ListItemIcon>
                  <InsertDriveFile />
                </ListItemIcon>
                <ListItemText
                  primary={file.name}
                  secondary={
                    <Box>
                      <Typography variant="caption" display="block">
                        {file.status === 'received' ? 'Ready to download' : `Receiving... ${file.progress}%`}
                      </Typography>
                      <LinearProgress
                        variant="determinate"
                        value={file.progress}
                        sx={{
                          mt: 1,
                          height: 6,
                          borderRadius: 5,
                          backgroundColor: 'rgba(251, 187, 82, 0.3)',
                          '& .MuiLinearProgress-bar': {
                            borderRadius: 5,
                            backgroundColor: '#fbbb52',
                          },
                        }}
                      />
                    </Box>
                  }
                  // Fix: Add primaryTypographyProps and secondaryTypographyProps to use div instead of p
                  primaryTypographyProps={{ component: 'div' }}
                  secondaryTypographyProps={{ component: 'div' }}
                />
              </ListItem>
            ))}
          </List>
        </CardContent>
      </Card>
    );
  }, [receivedFiles, handleDownloadFile]);

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton onClick={handleBack} sx={{ mr: 2 }}>
          <ArrowBack />
        </IconButton>
        <Typography variant="h5" component="h1">
          File Transfer
        </Typography>
      </Box>

      {renderConnectionStatus()}
      
      {isCaller ? renderSenderUI() : renderReceiverUI()}

      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <MuiAlert onClose={() => setError(null)} severity="error" sx={{ width: '100%' }}>
          {error}
        </MuiAlert>
      </Snackbar>

      <Snackbar
        open={!!info}
        autoHideDuration={3000}
        onClose={() => setInfo(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <MuiAlert onClose={() => setInfo(null)} severity="info" sx={{ width: '100%' }}>
          {info}
        </MuiAlert>
      </Snackbar>
    </Box>
  );
};

export default FileTransferPage;
