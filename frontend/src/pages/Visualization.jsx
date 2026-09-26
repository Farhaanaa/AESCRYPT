import { useState } from "react";
import "./Visualization.css";
import BlockVisualizer from "../components/BlockVisualizer";

const API_URL = "http://127.0.0.1:5000";

const EXAMPLES = [
  "ATTACK AT DAWN!!ATTACK AT DAWN!!",
  "HELLO AESCRYPT!!HELLO AESCRYPT!!",
  "REPEAT-ME-123456REPEAT-ME-123456",
];

function Visualization() {
  const [text, setText] = useState(EXAMPLES[0]);
  const [operation, setOperation] = useState("encrypt");
  const [mode, setMode] = useState("ECB");

  const [result, setResult] = useState(null);
  const [activeBlock, setActiveBlock] = useState(-1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [complete, setComplete] = useState(false);
  const [error, setError] = useState("");

  const resetVisualization = () => {
    setResult(null);
    setActiveBlock(-1);
    setComplete(false);
    setError("");
  };

  const changeOperation = (nextOperation) => {
    setOperation(nextOperation);
    resetVisualization();

    if (nextOperation === "encrypt") {
      setText(EXAMPLES[0]);
    } else {
      setText("");
    }
  };

  const changeMode = (nextMode) => {
    setMode(nextMode);
    resetVisualization();
  };

  const runEncryption = async () => {
    if (!text.trim() || isProcessing) {
      return;
    }

    setIsProcessing(true);
    resetVisualization();

    try {
      const response = await fetch(`${API_URL}/api/text/encrypt`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text,
          mode,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Encryption failed.");
      }

      setResult(data);

      const blocks = data.blocks || [];

      for (let index = 0; index < blocks.length; index += 1) {
        await new Promise((resolve) => {
          window.setTimeout(resolve, index === 0 ? 350 : 650);
        });

        setActiveBlock(index);
      }

      await new Promise((resolve) => {
        window.setTimeout(resolve, 450);
      });

      setComplete(true);
    } catch (requestError) {
      setError(
        requestError.message || "Unable to connect to the AESCRYPT backend.",
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const runDecryption = async () => {
    if (!text.trim() || isProcessing) {
      return;
    }

    setIsProcessing(true);
    resetVisualization();

    try {
      const response = await fetch(`${API_URL}/api/text/decrypt`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ciphertext: text.trim(),
          mode,
          iv: mode === "CBC" ? "30303030303030303030303030303030" : null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Decryption failed.");
      }

      setResult({
        ...data,
        blocks: [],
      });

      setComplete(true);
    } catch (requestError) {
      setError(requestError.message || "Unable to decrypt the ciphertext.");
    } finally {
      setIsProcessing(false);
    }
  };

  const runDemo = () => {
    if (operation === "encrypt") {
      runEncryption();
    } else {
      runDecryption();
    }
  };

  const tryExample = () => {
    const currentIndex = EXAMPLES.indexOf(text);

    const nextIndex = (currentIndex + 1) % EXAMPLES.length;

    setOperation("encrypt");
    setMode("ECB");
    setText(EXAMPLES[nextIndex]);
    resetVisualization();
  };

  const handleTextChange = (event) => {
    setText(event.target.value);
    resetVisualization();
  };

  return (
    <section className="visualization-section" id="visualize">
      <div className="visualization-heading">
        <span className="section-kicker">AES VISUALIZATION</span>

        <h2>Watch the blocks transform.</h2>

        <p>
          Enter a message and watch real AES encryption reveal how ECB and CBC
          process each block differently.
        </p>
      </div>

      <div className="visualization-workspace">
        {/* =================================================
            OPERATION
            THIS IS INTENTIONALLY ABOVE THE TEXT BOX
            ================================================= */}

        <div className="visualization-operation-top">
          <span className="visualization-label">OPERATION</span>

          <div className="visualization-segment">
            <button
              type="button"
              className={operation === "encrypt" ? "selected" : ""}
              onClick={() => changeOperation("encrypt")}
              disabled={isProcessing}
            >
              Encrypt
            </button>

            <button
              type="button"
              className={operation === "decrypt" ? "selected" : ""}
              onClick={() => changeOperation("decrypt")}
              disabled={isProcessing}
            >
              Decrypt
            </button>
          </div>
        </div>

        {/* =================================================
            TEXT INPUT
            ================================================= */}

        <div className="visualization-input">
          <div className="visualization-input-header">
            <label htmlFor="aes-visualizer-input">
              {operation === "encrypt" ? "PLAINTEXT" : "CIPHERTEXT · HEX"}
            </label>

            {operation === "encrypt" && (
              <button
                type="button"
                className="visualization-example"
                onClick={tryExample}
                disabled={isProcessing}
              >
                TRY AN EXAMPLE →
              </button>
            )}
          </div>

          <textarea
            id="aes-visualizer-input"
            value={text}
            onChange={handleTextChange}
            placeholder={
              operation === "encrypt"
                ? "Enter a message..."
                : "Paste ciphertext in hexadecimal..."
            }
            maxLength={operation === "encrypt" ? 256 : 2048}
            rows={4}
            disabled={isProcessing}
          />

          <div className="visualization-input-footer">
            <span>
              {text.length}/{operation === "encrypt" ? 256 : 2048} characters
            </span>

            <span>AES · 16 BYTE BLOCKS</span>
          </div>
        </div>

        {/* =================================================
            AES MODE
            BELOW THE TEXT BOX
            ================================================= */}

        <div className="visualization-modes-area">
          <span className="visualization-label">AES MODE</span>

          <div className="visualization-mode-options">
            <button
              type="button"
              className={`visualization-mode-card ${
                mode === "ECB" ? "selected" : ""
              }`}
              onClick={() => changeMode("ECB")}
              disabled={isProcessing}
            >
              <span className="mode-radio"></span>

              <div>
                <strong>ECB Mode</strong>

                <p>Each block is encrypted independently.</p>
              </div>

              <small>AES / 01</small>
            </button>

            <button
              type="button"
              className={`visualization-mode-card ${
                mode === "CBC" ? "selected" : ""
              }`}
              onClick={() => changeMode("CBC")}
              disabled={isProcessing}
            >
              <span className="mode-radio"></span>

              <div>
                <strong>CBC Mode</strong>

                <p>Each block is linked to the previous ciphertext block.</p>
              </div>

              <small>AES / 02</small>
            </button>
          </div>
        </div>

        {/* =================================================
            ACTION
            ================================================= */}

        <div className="visualization-action">
          <span>
            {operation.toUpperCase()} · AES-{mode}
          </span>

          <button
            type="button"
            className="visualization-run"
            onClick={runDemo}
            disabled={!text.trim() || isProcessing}
          >
            <span>
              {isProcessing
                ? "PROCESSING..."
                : operation === "encrypt"
                  ? "ENCRYPT MESSAGE"
                  : "DECRYPT MESSAGE"}
            </span>

            <span>{isProcessing ? "..." : "→"}</span>
          </button>
        </div>

        {/* =================================================
            ERROR
            ================================================= */}

        {error && (
          <div className="visualization-error">
            <span>!</span>

            {error}
          </div>
        )}

        {/* =================================================
            AES VISUALIZATION
            ================================================= */}

        <BlockVisualizer
          result={result}
          activeBlock={activeBlock}
          mode={mode}
          complete={complete}
        />

        {/* =================================================
            DECRYPTED RESULT
            ================================================= */}

        {complete && operation === "decrypt" && result?.plaintext && (
          <div className="decrypted-result">
            <span>DECRYPTED MESSAGE</span>

            <strong>{result.plaintext}</strong>
          </div>
        )}
      </div>
    </section>
  );
}

export default Visualization;
