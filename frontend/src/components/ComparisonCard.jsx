function ComparisonCard({ mode, result, repeatedBlocks }) {
  const isECB = mode === "ECB";

  const copyCiphertext = async () => {
    try {
      await navigator.clipboard.writeText(result.ciphertext);
    } catch {
      // Clipboard may be unavailable in some browser contexts.
    }
  };

  return (
    <article className={`comparison-card ${mode.toLowerCase()}`}>
      <div className="comparison-card-header">
        <div>
          <span className="comparison-card-kicker">AES MODE</span>

          <h3>{mode}</h3>
        </div>

        <span className="comparison-card-badge">
          {isECB ? "INDEPENDENT" : "CHAINED"}
        </span>
      </div>

      <div className="comparison-flow">
        <div className="flow-node">
          <span className="flow-node-label">PLAINTEXT</span>

          <strong>
            {result.plaintext.length > 22
              ? `${result.plaintext.slice(0, 22)}...`
              : result.plaintext}
          </strong>
        </div>

        <span className="flow-arrow">→</span>

        <div className="flow-node process-node">
          <span className="flow-node-label">AES-128</span>

          <strong>{mode}</strong>
        </div>

        <span className="flow-arrow">→</span>

        <div className="flow-node">
          <span className="flow-node-label">CIPHERTEXT</span>

          <strong>{result.blocks?.length || 0} BLOCKS</strong>
        </div>
      </div>

      <div className="comparison-block-section">
        <div className="comparison-block-heading">
          <span>BLOCK OUTPUT</span>

          {repeatedBlocks > 0 && (
            <span className="repeat-warning">{repeatedBlocks} REPEATED</span>
          )}
        </div>

        <div className="comparison-blocks">
          {result.blocks?.map((block, index) => {
            const isRepeated = result.blocks.some(
              (otherBlock, otherIndex) =>
                otherIndex !== index &&
                otherBlock.ciphertext === block.ciphertext,
            );

            const isPadding =
              block.plaintext_hex === "10101010101010101010101010101010";

            return (
              <div
                className={`comparison-block ${
                  isRepeated ? "repeated" : ""
                } ${isPadding ? "padding" : ""}`}
                key={block.index ?? index}
              >
                <div className="block-topline">
                  <span>BLOCK {String(index + 1).padStart(2, "0")}</span>

                  {isPadding ? (
                    <span className="block-tag">PKCS#7</span>
                  ) : isRepeated ? (
                    <span className="block-tag">SAME OUTPUT</span>
                  ) : (
                    <span className="block-tag">UNIQUE</span>
                  )}
                </div>

                <div className="block-plaintext">
                  {isPadding ? "PADDING BLOCK" : block.plaintext || "—"}
                </div>

                <div className="block-arrow">↓</div>

                <div className="block-ciphertext">{block.ciphertext}</div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="comparison-output">
        <div className="comparison-output-header">
          <span>FINAL CIPHERTEXT</span>

          <button type="button" onClick={copyCiphertext}>
            COPY
          </button>
        </div>

        <code>{result.ciphertext}</code>
      </div>

      <div className="comparison-card-footer">
        <span>
          {isECB
            ? "Each block is processed independently."
            : "Each block depends on the previous ciphertext."}
        </span>
      </div>
    </article>
  );
}

export default ComparisonCard;
