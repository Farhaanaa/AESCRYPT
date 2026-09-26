import { useState } from "react";
import ComparisonCard from "../components/ComparisonCard";
import "./Comparison.css";

const API_URL = "http://127.0.0.1:5000";

const DEFAULT_TEXT = "ATTACK AT DAWN!!ATTACK AT DAWN!!";

function Comparison() {
  const [text, setText] = useState(DEFAULT_TEXT);
  const [results, setResults] = useState(null);
  const [isComparing, setIsComparing] = useState(false);
  const [error, setError] = useState("");

  const handleCompare = async () => {
    const cleanText = text.trim();

    if (!cleanText) {
      setError("Enter some text to compare.");
      setResults(null);
      return;
    }

    if (cleanText.length > 256) {
      setError("Keep the message under 256 characters.");
      setResults(null);
      return;
    }

    setIsComparing(true);
    setError("");
    setResults(null);

    try {
      const [ecbResponse, cbcResponse] = await Promise.all([
        fetch(`${API_URL}/api/text/encrypt`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            text: cleanText,
            mode: "ECB",
          }),
        }),

        fetch(`${API_URL}/api/text/encrypt`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            text: cleanText,
            mode: "CBC",
          }),
        }),
      ]);

      if (!ecbResponse.ok || !cbcResponse.ok) {
        throw new Error("The comparison request failed.");
      }

      const [ecbData, cbcData] = await Promise.all([
        ecbResponse.json(),
        cbcResponse.json(),
      ]);

      setResults({
        ecb: ecbData,
        cbc: cbcData,
      });
    } catch (err) {
      setError(
        err.message ||
          "Could not connect to the AESCRYPT backend. Make sure Flask is running.",
      );
    } finally {
      setIsComparing(false);
    }
  };

  const getRepeatedBlockCount = (result) => {
    if (!result?.blocks) {
      return 0;
    }

    const ciphertexts = result.blocks.map((block) => block.ciphertext);
    return ciphertexts.length - new Set(ciphertexts).size;
  };

  const ecbRepeated = getRepeatedBlockCount(results?.ecb);
  const cbcRepeated = getRepeatedBlockCount(results?.cbc);

  return (
    <section className="comparison-section" id="compare">
      <div className="comparison-intro">
        <span className="comparison-kicker">MODE COMPARISON</span>

        <h2>
          Same message.
          <br />
          Different protection.
        </h2>

        <p>
          Run the same plaintext through AES-ECB and AES-CBC and compare what
          happens to each block.
        </p>
      </div>

      <div className="comparison-workspace">
        <div className="comparison-input-header">
          <div>
            <span className="comparison-label">PLAINTEXT</span>

            <p>
              Use repeated content to make the difference between the modes
              visible.
            </p>
          </div>

          <span className="comparison-limit">{text.length}/256</span>
        </div>

        <textarea
          className="comparison-textarea"
          value={text}
          onChange={(event) => {
            setText(event.target.value);
            setError("");
          }}
          placeholder="Enter text to compare..."
          maxLength={256}
        />

        <div className="comparison-action-row">
          <div className="comparison-input-meta">
            <span>AES-128</span>
            <span className="comparison-meta-dot"></span>
            <span>16-BYTE BLOCKS</span>
          </div>

          <button
            type="button"
            className="comparison-button"
            onClick={handleCompare}
            disabled={isComparing}
          >
            <span>{isComparing ? "COMPARING..." : "COMPARE MODES"}</span>

            <span className="comparison-button-arrow">
              {isComparing ? "..." : "→"}
            </span>
          </button>
        </div>

        {error && (
          <div className="comparison-error">
            <span></span>
            {error}
          </div>
        )}
      </div>

      {results && (
        <>
          <div className="comparison-results">
            <ComparisonCard
              mode="ECB"
              result={results.ecb}
              repeatedBlocks={ecbRepeated}
            />

            <ComparisonCard
              mode="CBC"
              result={results.cbc}
              repeatedBlocks={cbcRepeated}
            />
          </div>

          <div className="comparison-verdict">
            <div className="verdict-header">
              <span className="comparison-kicker">WHAT CHANGED?</span>

              <span className="verdict-status">LIVE RESULT</span>
            </div>

            <div className="verdict-grid">
              <div className="verdict-item">
                <span className="verdict-number">{ecbRepeated}</span>

                <div>
                  <strong>ECB repeated outputs</strong>
                  <p>
                    Identical plaintext blocks produce identical ciphertext
                    blocks.
                  </p>
                </div>
              </div>

              <div className="verdict-divider"></div>

              <div className="verdict-item">
                <span className="verdict-number">{cbcRepeated}</span>

                <div>
                  <strong>CBC repeated outputs</strong>
                  <p>
                    Each block is influenced by the previous ciphertext block.
                  </p>
                </div>
              </div>
            </div>

            <div className="comparison-takeaway">
              <span className="takeaway-line"></span>

              <p>
                <strong>ECB</strong> encrypts blocks independently.
                <br />
                <strong>CBC</strong> chains blocks together before encryption.
              </p>
            </div>
          </div>
        </>
      )}
    </section>
  );
}

export default Comparison;
