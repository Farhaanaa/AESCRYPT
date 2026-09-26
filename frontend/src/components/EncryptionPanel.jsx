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
    const file = event.target.files?.[0];
    handleFile(file);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setIsDragging(false);

    const file = event.dataTransfer.files?.[0];
    handleFile(file);
  };

  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

  const removeFile = () => {
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

  const handleProcess = async () => {
    if (!selectedFile || isProcessing) {
      return;
    }

    setIsProcessing(true);
    setStatus("processing");
    setStatusMessage(
      operation === "encrypt"
        ? "Encrypting your file..."
        : "Decrypting your file...",
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
          // Keep the default error message.
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
          ? "Encryption complete. Your file is ready."
          : "Decryption complete. Your file is ready.",
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
      <div className="section-heading">
        <span className="section-kicker">AES WORKSPACE</span>

        <h2>Encrypt / Decrypt</h2>

        <p>
          Select a file, choose how AES should process it, and prepare it for
          secure transformation.
        </p>
      </div>

      <div className="encryption-workspace">
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
            <>
              <div className="upload-orb">
                <svg
                  viewBox="0 0 24 24"
                  width="24"
                  height="24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 16V4" />
                  <path d="m7 9 5-5 5 5" />
                  <path d="M5 20h14" />
                </svg>
              </div>

              <h3>Drop your file here</h3>

              <p>
                or{" "}
                <button
                  type="button"
                  className="browse-button"
                  onClick={(event) => {
                    event.stopPropagation();
                    openFilePicker();
                  }}
                >
                  browse from your device
                </button>
              </p>

              <span className="upload-hint">Select a file to begin.</span>
            </>
          ) : (
            <div className="selected-file">
              <div className="file-icon">
                <svg
                  viewBox="0 0 24 24"
                  width="22"
                  height="22"
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
                onClick={(event) => {
                  event.stopPropagation();
                  removeFile();
                }}
                aria-label="Remove selected file"
              >
                ×
              </button>
            </div>
          )}
        </div>

        <div className="configuration-area">
          <div className="config-group">
            <span className="config-label">OPERATION</span>

            <div className="segmented-control">
              <button
                type="button"
                className={operation === "encrypt" ? "selected" : ""}
                onClick={() => {
                  setOperation("encrypt");
                  setStatus("ready");
                  setStatusMessage("");
                }}
                disabled={isProcessing}
              >
                Encrypt
              </button>

              <button
                type="button"
                className={operation === "decrypt" ? "selected" : ""}
                onClick={() => {
                  setOperation("decrypt");
                  setStatus("ready");
                  setStatusMessage("");
                }}
                disabled={isProcessing}
              >
                Decrypt
              </button>
            </div>
          </div>

          <div className="config-group">
            <span className="config-label">AES MODE</span>

            <div className="mode-options">
              <button
                type="button"
                className={`mode-card ${mode === "ECB" ? "selected" : ""}`}
                onClick={() => {
                  setMode("ECB");
                  setStatus("ready");
                  setStatusMessage("");
                }}
                disabled={isProcessing}
              >
                <span className="mode-name">ECB</span>

                <span className="mode-description">Independent blocks</span>
              </button>

              <button
                type="button"
                className={`mode-card ${mode === "CBC" ? "selected" : ""}`}
                onClick={() => {
                  setMode("CBC");
                  setStatus("ready");
                  setStatusMessage("");
                }}
                disabled={isProcessing}
              >
                <span className="mode-name">CBC</span>

                <span className="mode-description">Chained blocks</span>
              </button>
            </div>
          </div>
        </div>

        <div className="process-area">
          <div className="process-summary">
            <span>{selectedFile ? selectedFile.name : "No file selected"}</span>

            <span>
              {operation.toUpperCase()} · AES-{mode}
            </span>
          </div>

          <button
            type="button"
            className="process-button"
            disabled={!selectedFile || isProcessing}
            onClick={handleProcess}
          >
            <span>
              {isProcessing
                ? "PROCESSING..."
                : operation === "encrypt"
                  ? "ENCRYPT FILE"
                  : "DECRYPT FILE"}
            </span>

            <span className="process-arrow">{isProcessing ? "..." : "→"}</span>
          </button>
        </div>

        {status !== "ready" && (
          <div className={`operation-status ${status}`}>
            <span className="status-indicator"></span>

            <span>{statusMessage}</span>
          </div>
        )}
      </div>
    </section>
  );
}

export default EncryptionPanel;
