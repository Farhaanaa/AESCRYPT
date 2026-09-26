import { useState } from "react";

function BlockVisualizer({ result, activeBlock, mode, complete }) {
  const [copied, setCopied] = useState(false);

  if (!result) {
    return (
      <div className="block-visualizer empty">
        <div className="visualizer-empty-icon">AES</div>

        <span>LIVE AES BLOCK VISUALIZATION</span>

        <p>
          Run the message to see each 16-byte block move through the selected
          AES mode.
        </p>
      </div>
    );
  }

  const blocks = result.blocks || [];

  const copyCiphertext = async () => {
    if (!result.ciphertext) {
      return;
    }

    try {
      await navigator.clipboard.writeText(result.ciphertext);

      setCopied(true);

      window.setTimeout(() => {
        setCopied(false);
      }, 1800);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="block-visualizer">
      {/* =================================================
          HEADER
          ================================================= */}

      <div className="visualizer-header">
        <div>
          <span className="visualizer-kicker">LIVE AES FLOW</span>

          <h3>
            {mode === "ECB"
              ? "Independent block processing"
              : "Chained block processing"}
          </h3>
        </div>

        <div className="visualizer-counter">
          {complete
            ? `${blocks.length} / ${blocks.length}`
            : `${Math.max(activeBlock + 1, 0)} / ${blocks.length}`}
        </div>
      </div>

      {/* =================================================
          MODE EXPLANATION
          ================================================= */}

      <div
        className={`visualizer-mode-explanation ${
          mode === "CBC" ? "cbc" : "ecb"
        }`}
      >
        <div className="explanation-badge">{mode}</div>

        <div>
          <strong>
            {mode === "ECB"
              ? "Every block is encrypted independently."
              : "Every block is connected to the previous ciphertext."}
          </strong>

          <p>
            {mode === "ECB"
              ? "The plaintext goes directly into AES. The same plaintext block always produces the same ciphertext block."
              : "Before AES encryption, each plaintext block is XORed with the previous ciphertext block. The first block uses the IV."}
          </p>
        </div>
      </div>

      {/* =================================================
          LEGEND
          ================================================= */}

      <div className="visualizer-legend">
        <span>
          <i className="legend-plaintext"></i>
          PLAINTEXT
        </span>

        {mode === "CBC" && (
          <span>
            <i className="legend-chain"></i>
            CHAIN INPUT
          </span>
        )}

        <span>
          <i className="legend-aes"></i>
          AES-128
        </span>

        <span>
          <i className="legend-cipher"></i>
          CIPHERTEXT
        </span>
      </div>

      {/* =================================================
          BLOCKS
          ================================================= */}

      <div className="visualizer-blocks">
        {blocks.map((block, index) => {
          const visible = complete || index <= activeBlock;

          const active = index === activeBlock && !complete;

          const isPadding =
            block.plaintext_hex === "10101010101010101010101010101010";

          return (
            <div
              key={block.index}
              className={`visualizer-block ${
                visible ? "visible" : ""
              } ${active ? "active" : ""} ${isPadding ? "padding-block" : ""}`}
            >
              {/* BLOCK HEADER */}

              <div className="block-header">
                <div className="block-number">
                  BLOCK {String(index + 1).padStart(2, "0")}
                </div>

                <div className="block-size">16 BYTES</div>
              </div>

              {/* =================================================
                  PADDING BLOCK
                  ================================================= */}

              {isPadding ? (
                <div className="padding-explanation">
                  <div className="padding-card">
                    <span className="flow-card-label">PKCS#7 PADDING</span>

                    <div className="padding-title">PADDING BLOCK</div>

                    <div className="padding-value">
                      10 10 10 10 10 10 10 10
                      <br />
                      10 10 10 10 10 10 10 10
                    </div>

                    <p>
                      The message already filled complete AES blocks, so an
                      entire 16-byte padding block was added before encryption.
                    </p>
                  </div>

                  <div className="padding-arrow">→</div>

                  <div className="flow-card aes-card">
                    <span className="flow-card-label">AES-128</span>

                    <div className="aes-core">
                      <strong>AES</strong>

                      <span>ENCRYPT</span>
                    </div>

                    <div className="aes-input">
                      Input:
                      <span>{block.aes_input_hex}</span>
                    </div>
                  </div>

                  <div className="padding-arrow">→</div>

                  <div className="flow-card ciphertext-card">
                    <span className="flow-card-label">CIPHERTEXT BLOCK</span>

                    <div className="cipher-value">{block.ciphertext}</div>
                  </div>
                </div>
              ) : (
                <>
                  {/* =================================================
                      ECB
                      ================================================= */}

                  {mode === "ECB" && (
                    <div className="block-flow ecb-flow">
                      <div className="flow-card plaintext-card">
                        <span className="flow-card-label">PLAINTEXT BLOCK</span>

                        <div className="ascii-value">{block.plaintext}</div>

                        <div className="hex-value">{block.plaintext_hex}</div>

                        {block.repeated && (
                          <div className="repeat-badge">REPEATED INPUT</div>
                        )}
                      </div>

                      <div className="flow-arrow">
                        <strong>→</strong>
                      </div>

                      <div className="flow-card aes-card">
                        <span className="flow-card-label">AES-128</span>

                        <div className="aes-core">
                          <strong>AES</strong>

                          <span>ENCRYPT</span>
                        </div>

                        <div className="aes-input">
                          Input:
                          <span>{block.aes_input_hex}</span>
                        </div>
                      </div>

                      <div className="flow-arrow">
                        <strong>→</strong>
                      </div>

                      <div className="flow-card ciphertext-card">
                        <span className="flow-card-label">
                          CIPHERTEXT BLOCK
                        </span>

                        <div className="cipher-value">{block.ciphertext}</div>

                        {block.repeated && (
                          <div className="output-badge same">SAME OUTPUT</div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* =================================================
                      CBC
                      ================================================= */}

                  {mode === "CBC" && (
                    <div className="block-flow cbc-flow">
                      <div className="flow-card plaintext-card">
                        <span className="flow-card-label">PLAINTEXT BLOCK</span>

                        <div className="ascii-value">{block.plaintext}</div>

                        <div className="hex-value">{block.plaintext_hex}</div>

                        {block.repeated && (
                          <div className="repeat-badge">REPEATED INPUT</div>
                        )}
                      </div>

                      <div className="flow-arrow">
                        <strong>→</strong>
                      </div>

                      <div className="flow-card xor-card">
                        <span className="flow-card-label">XOR WITH</span>

                        <div className="xor-target">
                          {index === 0 ? "IV" : `CT ${index}`}
                        </div>

                        <div className="chain-value">
                          {block.previous_value}
                        </div>

                        <div className="xor-symbol">⊕</div>

                        <small>
                          {index === 0
                            ? "Initialization Vector"
                            : "Previous ciphertext"}
                        </small>
                      </div>

                      <div className="flow-arrow">
                        <strong>→</strong>
                      </div>

                      <div className="flow-card aes-card">
                        <span className="flow-card-label">AES-128</span>

                        <div className="aes-core">
                          <strong>AES</strong>

                          <span>ENCRYPT</span>
                        </div>

                        <div className="aes-input">
                          XOR result:
                          <span>{block.aes_input_hex}</span>
                        </div>
                      </div>

                      <div className="flow-arrow">
                        <strong>→</strong>
                      </div>

                      <div className="flow-card ciphertext-card">
                        <span className="flow-card-label">
                          CIPHERTEXT BLOCK
                        </span>

                        <div className="cipher-value">{block.ciphertext}</div>

                        {block.repeated && (
                          <div className="output-badge different">
                            DIFFERENT OUTPUT
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {mode === "CBC" && index < blocks.length - 1 && (
                    <div className="chain-connection">
                      <div className="chain-line"></div>

                      <div className="chain-message">
                        <span>CT {index + 1}</span>

                        <strong>
                          feeds into BLOCK {String(index + 2).padStart(2, "0")}
                        </strong>

                        <small>
                          Previous ciphertext becomes the next block's XOR input
                        </small>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* =================================================
          FINAL VERDICT
          ================================================= */}

      {complete && (
        <div
          className={`visualizer-verdict ${
            mode === "ECB" ? "ecb-verdict" : "cbc-verdict"
          }`}
        >
          <div className="verdict-icon">{mode === "ECB" ? "!" : "✓"}</div>

          <div>
            <span>
              {mode === "ECB" ? "WHAT ECB REVEALS" : "WHAT CBC CHANGES"}
            </span>

            <h4>
              {mode === "ECB"
                ? "Identical plaintext blocks produced identical ciphertext blocks."
                : "Identical plaintext blocks produced different ciphertext blocks."}
            </h4>

            <p>
              {mode === "ECB"
                ? "ECB sends every block through AES independently. There is no connection between blocks, so repeated plaintext creates repeated ciphertext."
                : "CBC combines every plaintext block with the previous ciphertext before AES. That means even identical plaintext blocks receive different AES inputs."}
            </p>
          </div>
        </div>
      )}

      {/* =================================================
          ENCRYPTED MESSAGE
          ================================================= */}

      {complete && result.ciphertext && (
        <div className="encrypted-output">
          <div className="encrypted-output-header">
            <div>
              <span className="encrypted-output-kicker">ENCRYPTED MESSAGE</span>

              <h4>AES-{mode} ciphertext</h4>
            </div>

            <button
              type="button"
              className="copy-ciphertext-button"
              onClick={copyCiphertext}
            >
              {copied ? "COPIED ✓" : "COPY CIPHERTEXT"}
            </button>
          </div>

          <div className="encrypted-output-value">{result.ciphertext}</div>

          <div className="encrypted-output-footer">
            <span>{result.ciphertext.length / 2} BYTES</span>

            <span>HEX ENCODED</span>
          </div>
        </div>
      )}

      {/* =================================================
          TAKEAWAY
          ================================================= */}

      <div className="visualizer-takeaway">
        <span>THE KEY DIFFERENCE</span>

        <div className="takeaway-grid">
          <div>
            <strong>ECB</strong>

            <p>Plaintext → AES → Ciphertext</p>

            <small>No block-to-block connection.</small>
          </div>

          <div className="takeaway-divider"></div>

          <div>
            <strong>CBC</strong>

            <p>Plaintext ⊕ Previous CT → AES → Ciphertext</p>

            <small>Every block depends on the previous one.</small>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BlockVisualizer;
