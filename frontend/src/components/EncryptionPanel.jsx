import { useRef, useState } from "react";
import "./EncryptionPanel.css";

const API_URL = "http://127.0.0.1:5000";

function EncryptionPanel() {
  const fileInputRef = useRef(null);

  const [selectedFile, setSelectedFile] = useState(null);
  const [operation, setOperation] = useState("encrypt");
  const [mode, setMode] = useState("CBC");
  const [isDragging, setIsDragging] = useState(false);

  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState("ready");
  const [statusMessage, setStatusMessage] = useState("");

  const handleFile = (file) => {
    if (!file) {
      return;
    }

    setSelectedFile(file);
    setStatus("ready");
    setStatusMessage("");
  };

  const handleFileChange = (event) => {
    handleFile(event.target.files?.[0]);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setIsDragging(false);

    handleFile(event.dataTransfer.files?.[0]);
  };

  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

  const removeFile = (event) => {
    event.stopPropagation();

    setSelectedFile(null);
    setStatus("ready");
    setStatusMessage("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) {
      return `${bytes} B`;
    }

    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }

    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleOperationChange = (nextOperation) => {
    if (isProcessing) {
      return;
    }

    setOperation(nextOperation);
    setStatus("ready");
    setStatusMessage("");
  };

  const handleModeChange = (nextMode) => {
    if (isProcessing) {
      return;
    }

    setMode(nextMode);
    setStatus("ready");
    setStatusMessage("");
  };

  const handleProcess = async () => {
    if (!selectedFile || isProcessing) {
      return;
    }

    setIsProcessing(true);
    setStatus("processing");

    setStatusMessage(
      operation === "encrypt" ? "Encrypting file..." : "Decrypting file...",
    );

    const formData = new FormData();

    formData.append("file", selectedFile);
    formData.append("mode", mode);

    const endpoint = operation === "encrypt" ? "/api/encrypt" : "/api/decrypt";

    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        let errorMessage = "The operation failed.";

        try {
          const errorData = await response.json();

          if (errorData.error) {
            errorMessage = errorData.error;
          }
        } catch {
          // Keep default error message.
        }

        throw new Error(errorMessage);
      }

      const blob = await response.blob();

      const contentDisposition = response.headers.get("Content-Disposition");

      let filename =
        operation === "encrypt"
          ? `${selectedFile.name}.enc`
          : `decrypted_${selectedFile.name.replace(/\.enc$/i, "")}`;

      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/i);

        if (filenameMatch?.[1]) {
          filename = filenameMatch[1];
        }
      }

      const downloadUrl = window.URL.createObjectURL(blob);
      const downloadLink = document.createElement("a");

      downloadLink.href = downloadUrl;
      downloadLink.download = filename;

      document.body.appendChild(downloadLink);
      downloadLink.click();
      downloadLink.remove();

      window.URL.revokeObjectURL(downloadUrl);

      setStatus("success");

      setStatusMessage(
        operation === "encrypt"
          ? "Encryption complete."
          : "Decryption complete.",
      );
    } catch (error) {
      setStatus("error");
      setStatusMessage(error.message || "Something went wrong.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <section className="encryption-section" id="encrypt">
      <div className="encryption-container">
        <div className="encryption-header">
          <span className="section-kicker">ENCRYPTION WORKSPACE</span>

          <h2>Protect your files.</h2>

          <p>Secure your files with AES encryption.</p>
        </div>

        <div className="operation-toggle">
          <button
            type="button"
            className={
              operation === "encrypt" ? "toggle-option active" : "toggle-option"
            }
            onClick={() => handleOperationChange("encrypt")}
            disabled={isProcessing}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="5" y="10" width="14" height="10" rx="2" />
              <path d="M8 10V7a4 4 0 0 1 8 0v3" />
            </svg>

            <span>Encrypt</span>
          </button>

          <button
            type="button"
            className={
              operation === "decrypt" ? "toggle-option active" : "toggle-option"
            }
            onClick={() => handleOperationChange("decrypt")}
            disabled={isProcessing}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="5" y="10" width="14" height="10" rx="2" />
              <path d="M8 10V7a4 4 0 0 1 8 0" />
            </svg>

            <span>Decrypt</span>
          </button>
        </div>

        <div
          className={`file-drop-zone ${
            isDragging ? "dragging" : ""
          } ${selectedFile ? "has-file" : ""}`}
          onDragOver={(event) => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={!selectedFile ? openFilePicker : undefined}
        >
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileChange}
            hidden
          />

          {!selectedFile ? (
            <div className="upload-content">
              <div className="upload-icon">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 16V4" />
                  <path d="m7 9 5-5 5 5" />
                  <path d="M5 20h14" />
                </svg>
              </div>

              <h3>Drop your file here, or browse</h3>

              <p>Supports documents, images, archives and other file types</p>

              <button
                type="button"
                className="browse-button"
                onClick={(event) => {
                  event.stopPropagation();
                  openFilePicker();
                }}
              >
                Browse from your device
              </button>
            </div>
          ) : (
            <div className="selected-file">
              <div className="file-icon">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <path d="M14 2v6h6" />
                </svg>
              </div>

              <div className="file-details">
                <strong>{selectedFile.name}</strong>

                <span>{formatFileSize(selectedFile.size)}</span>
              </div>

              <button
                type="button"
                className="remove-file"
                onClick={removeFile}
                aria-label="Remove selected file"
              >
                ×
              </button>
            </div>
          )}
        </div>

        <div className="mode-selection">
          <button
            type="button"
            className={`mode-card ${mode === "CBC" ? "active" : ""}`}
            onClick={() => handleModeChange("CBC")}
            disabled={isProcessing}
          >
            <div className="mode-card-header">
              <span className="mode-radio"></span>

              <span className="mode-name">CBC Mode</span>

              <span className="mode-code">AES / 02</span>
            </div>

            <p>Cipher Block Chaining</p>

            <span className="mode-description">
              Each block is linked to the previous block.
            </span>
          </button>

          <button
            type="button"
            className={`mode-card ${mode === "ECB" ? "active" : ""}`}
            onClick={() => handleModeChange("ECB")}
            disabled={isProcessing}
          >
            <div className="mode-card-header">
              <span className="mode-radio"></span>

              <span className="mode-name">ECB Mode</span>

              <span className="mode-code">AES / 01</span>
            </div>

            <p>Electronic Codebook</p>

            <span className="mode-description">
              Each block is encrypted independently.
            </span>
          </button>
        </div>

        <div className="process-area">
          <div className="process-info">
            <span>
              {operation === "encrypt" ? "ENCRYPT" : "DECRYPT"} · AES-{mode}
            </span>

            {selectedFile && <strong>{selectedFile.name}</strong>}
          </div>

          <button
            type="button"
            className="process-button"
            disabled={!selectedFile || isProcessing}
            onClick={handleProcess}
          >
            <span>
              {isProcessing
                ? "PROCESSING"
                : operation === "encrypt"
                  ? "ENCRYPT FILE"
                  : "DECRYPT FILE"}
            </span>

            <span>→</span>
          </button>
        </div>

        {status !== "ready" && (
          <div className={`operation-status ${status}`}>
            <span className="status-dot"></span>
            <span>{statusMessage}</span>
          </div>
        )}
      </div>
    </section>
  );
}

export default EncryptionPanel;
