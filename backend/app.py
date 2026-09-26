from pathlib import Path

from flask import Flask, jsonify, request, send_file
from flask_cors import CORS

from services.encryption_service import encrypt_file, decrypt_file


app = Flask(__name__)
CORS(app)


BASE_DIR = Path(__file__).parent
UPLOAD_DIR = BASE_DIR / "uploads"
OUTPUT_DIR = BASE_DIR / "outputs"

UPLOAD_DIR.mkdir(exist_ok=True)
OUTPUT_DIR.mkdir(exist_ok=True)


# Development key for testing
KEY = b"12345678901234567890123456789012"


@app.route("/")
def home():
    return {"message": "AESCRYPT backend is running"}


@app.route("/api/encrypt", methods=["POST"])
def encrypt():
    if "file" not in request.files:
        return jsonify({"error": "No file provided"}), 400

    uploaded_file = request.files["file"]
    mode = request.form.get("mode", "CBC").upper()

    if uploaded_file.filename == "":
        return jsonify({"error": "No file selected"}), 400

    if mode not in {"ECB", "CBC"}:
        return jsonify({"error": "Mode must be ECB or CBC"}), 400

    input_path = UPLOAD_DIR / uploaded_file.filename
    output_path = OUTPUT_DIR / f"{uploaded_file.filename}.enc"

    uploaded_file.save(input_path)

    try:
        encrypt_file(
            input_path,
            output_path,
            KEY,
            mode
        )

        return send_file(
            output_path,
            as_attachment=True,
            download_name=f"{uploaded_file.filename}.enc"
        )

    except Exception as error:
        return jsonify({"error": str(error)}), 500


@app.route("/api/decrypt", methods=["POST"])
def decrypt():
    if "file" not in request.files:
        return jsonify({"error": "No file provided"}), 400

    uploaded_file = request.files["file"]
    mode = request.form.get("mode", "CBC").upper()

    if uploaded_file.filename == "":
        return jsonify({"error": "No file selected"}), 400

    if mode not in {"ECB", "CBC"}:
        return jsonify({"error": "Mode must be ECB or CBC"}), 400

    input_path = UPLOAD_DIR / uploaded_file.filename

    original_name = uploaded_file.filename

    if original_name.endswith(".enc"):
        original_name = original_name[:-4]

    output_path = OUTPUT_DIR / f"decrypted_{original_name}"

    uploaded_file.save(input_path)

    try:
        decrypt_file(
            input_path,
            output_path,
            KEY,
            mode
        )

        return send_file(
            output_path,
            as_attachment=True,
            download_name=f"decrypted_{original_name}"
        )

    except Exception as error:
        return jsonify({"error": str(error)}), 500


if __name__ == "__main__":
    app.run(debug=True)