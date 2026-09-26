from pathlib import Path

from flask import Flask, jsonify, request, send_file
from flask_cors import CORS
from Crypto.Cipher import AES
from Crypto.Util.Padding import pad, unpad

from services.encryption_service import encrypt_file, decrypt_file


app = Flask(__name__)
CORS(app)


BASE_DIR = Path(__file__).parent
UPLOAD_DIR = BASE_DIR / "uploads"
OUTPUT_DIR = BASE_DIR / "outputs"

UPLOAD_DIR.mkdir(exist_ok=True)
OUTPUT_DIR.mkdir(exist_ok=True)


# Development key for testing.
# This is NOT a production key.
KEY = b"12345678901234567890123456789012"

# Fixed IV is used ONLY for the educational visualization.
# A real CBC implementation should use a fresh random IV.
DEMO_IV = b"0000000000000000"


def bytes_to_hex(value):
    return value.hex().upper()


def block_to_display(block):
    """
    Convert a 16-byte block into something readable.
    Printable ASCII characters remain visible.
    Non-printable bytes become dots.
    """
    return "".join(
        chr(byte) if 32 <= byte <= 126 else "."
        for byte in block
    )


def xor_bytes(left, right):
    return bytes(
        first ^ second
        for first, second in zip(left, right)
    )


def build_demo_blocks(padded_text, mode):
    """
    Build the educational block information used by the frontend.

    AES always operates on 16-byte blocks.

    ECB:
        plaintext block -> AES -> ciphertext block

    CBC:
        plaintext block XOR previous ciphertext/IV -> AES -> ciphertext
    """

    cipher = AES.new(
        KEY,
        AES.MODE_ECB
    )

    blocks = []

    previous_ciphertext = DEMO_IV

    total_blocks = len(padded_text) // AES.block_size

    for index in range(total_blocks):
        start = index * AES.block_size
        end = start + AES.block_size

        plaintext_block = padded_text[start:end]

        if mode == "ECB":
            aes_input = plaintext_block
            ciphertext_block = cipher.encrypt(aes_input)

            previous_value = None

        else:
            previous_value = previous_ciphertext

            # CBC first combines the plaintext with IV.
            # Every following block combines with the
            # previous ciphertext block.
            aes_input = xor_bytes(
                plaintext_block,
                previous_value
            )

            ciphertext_block = cipher.encrypt(aes_input)

            previous_ciphertext = ciphertext_block

        blocks.append(
            {
                "index": index,
                "plaintext": block_to_display(plaintext_block),
                "plaintext_hex": bytes_to_hex(plaintext_block),
                "previous_value": (
                    bytes_to_hex(previous_value)
                    if previous_value is not None
                    else None
                ),
                "aes_input_hex": bytes_to_hex(aes_input),
                "ciphertext": bytes_to_hex(ciphertext_block),
                "repeated": any(
                    previous["plaintext_hex"]
                    == bytes_to_hex(plaintext_block)
                    for previous in blocks
                ),
            }
        )

    return blocks


def encrypt_demo_text(text, mode):
    """
    Encrypt text using real AES-128.

    The returned structure is designed specifically
    for the educational visualization.
    """

    plaintext = text.encode("utf-8")

    padded_text = pad(
        plaintext,
        AES.block_size
    )

    cipher = AES.new(
        KEY,
        AES.MODE_ECB
    )

    ciphertext = b""

    if mode == "ECB":
        ciphertext = cipher.encrypt(padded_text)

    else:
        cipher_cbc = AES.new(
            KEY,
            AES.MODE_CBC,
            DEMO_IV
        )

        ciphertext = cipher_cbc.encrypt(padded_text)

    blocks = build_demo_blocks(
        padded_text,
        mode
    )

    return {
        "operation": "encrypt",
        "mode": mode,
        "iv": bytes_to_hex(DEMO_IV) if mode == "CBC" else None,
        "block_size": AES.block_size,
        "plaintext": text,
        "plaintext_bytes": len(plaintext),
        "padded_bytes": len(padded_text),
        "ciphertext": bytes_to_hex(ciphertext),
        "blocks": blocks,
    }


def decrypt_demo_text(ciphertext_hex, mode, iv_hex=None):
    """
    Decrypt ciphertext produced by the visualization API.
    """

    try:
        ciphertext = bytes.fromhex(ciphertext_hex)
    except ValueError:
        raise ValueError("Ciphertext must contain valid hexadecimal bytes.")

    if not ciphertext:
        raise ValueError("Ciphertext cannot be empty.")

    if len(ciphertext) % AES.block_size != 0:
        raise ValueError(
            "Ciphertext length must be a multiple of 16 bytes."
        )

    if mode == "ECB":
        cipher = AES.new(
            KEY,
            AES.MODE_ECB
        )

    else:
        iv = DEMO_IV

        if iv_hex:
            try:
                iv = bytes.fromhex(iv_hex)
            except ValueError:
                raise ValueError("IV must contain valid hexadecimal bytes.")

        if len(iv) != AES.block_size:
            raise ValueError("CBC IV must be exactly 16 bytes.")

        cipher = AES.new(
            KEY,
            AES.MODE_CBC,
            iv
        )

    decrypted = cipher.decrypt(ciphertext)

    try:
        plaintext = unpad(
            decrypted,
            AES.block_size
        )
    except ValueError:
        raise ValueError(
            "Decryption failed. Check the ciphertext, mode, and padding."
        )

    try:
        text = plaintext.decode("utf-8")
    except UnicodeDecodeError:
        raise ValueError(
            "Decrypted data is not valid UTF-8 text."
        )

    return {
        "operation": "decrypt",
        "mode": mode,
        "iv": (
            iv_hex
            if mode == "CBC" and iv_hex
            else bytes_to_hex(DEMO_IV)
            if mode == "CBC"
            else None
        ),
        "plaintext": text,
        "ciphertext": bytes_to_hex(ciphertext),
    }


@app.route("/")
def home():
    return {
        "message": "AESCRYPT backend is running"
    }


# =========================================================
# File encryption
# =========================================================

@app.route("/api/encrypt", methods=["POST"])
def encrypt():
    if "file" not in request.files:
        return jsonify({
            "error": "No file provided"
        }), 400

    uploaded_file = request.files["file"]
    mode = request.form.get(
        "mode",
        "CBC"
    ).upper()

    if uploaded_file.filename == "":
        return jsonify({
            "error": "No file selected"
        }), 400

    if mode not in {"ECB", "CBC"}:
        return jsonify({
            "error": "Mode must be ECB or CBC"
        }), 400

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
        return jsonify({
            "error": str(error)
        }), 500


@app.route("/api/decrypt", methods=["POST"])
def decrypt():
    if "file" not in request.files:
        return jsonify({
            "error": "No file provided"
        }), 400

    uploaded_file = request.files["file"]
    mode = request.form.get(
        "mode",
        "CBC"
    ).upper()

    if uploaded_file.filename == "":
        return jsonify({
            "error": "No file selected"
        }), 400

    if mode not in {"ECB", "CBC"}:
        return jsonify({
            "error": "Mode must be ECB or CBC"
        }), 400

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
        return jsonify({
            "error": str(error)
        }), 500


# =========================================================
# Text AES visualization
# =========================================================

@app.route("/api/text/encrypt", methods=["POST"])
def encrypt_text():
    data = request.get_json(silent=True) or {}

    text = data.get("text", "")
    mode = data.get(
        "mode",
        "ECB"
    ).upper()

    if not isinstance(text, str):
        return jsonify({
            "error": "Text must be a string."
        }), 400

    if not text.strip():
        return jsonify({
            "error": "Enter a message first."
        }), 400

    if len(text) > 256:
        return jsonify({
            "error": "Message must be 256 characters or fewer."
        }), 400

    if mode not in {"ECB", "CBC"}:
        return jsonify({
            "error": "Mode must be ECB or CBC."
        }), 400

    try:
        result = encrypt_demo_text(
            text,
            mode
        )

        return jsonify(result)

    except Exception as error:
        return jsonify({
            "error": str(error)
        }), 500


@app.route("/api/text/decrypt", methods=["POST"])
def decrypt_text():
    data = request.get_json(silent=True) or {}

    ciphertext = data.get(
        "ciphertext",
        ""
    )

    mode = data.get(
        "mode",
        "ECB"
    ).upper()

    iv = data.get("iv")

    if not isinstance(ciphertext, str):
        return jsonify({
            "error": "Ciphertext must be a hexadecimal string."
        }), 400

    if mode not in {"ECB", "CBC"}:
        return jsonify({
            "error": "Mode must be ECB or CBC."
        }), 400

    if not ciphertext.strip():
        return jsonify({
            "error": "Enter ciphertext first."
        }), 400

    try:
        result = decrypt_demo_text(
            ciphertext,
            mode,
            iv
        )

        return jsonify(result)

    except Exception as error:
        return jsonify({
            "error": str(error)
        }), 400


if __name__ == "__main__":
    app.run(
        debug=True
    )