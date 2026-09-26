from pathlib import Path

from crypto.aes import (
    encrypt_ecb,
    decrypt_ecb,
    encrypt_cbc,
    decrypt_cbc,
)


def encrypt_file(input_path, output_path, key, mode):
    """
    Encrypt a file using AES in ECB or CBC mode.

    For ECB:
        output = ciphertext

    For CBC:
        output = IV + ciphertext
    """

    input_path = Path(input_path)
    output_path = Path(output_path)

    with open(input_path, "rb") as file:
        data = file.read()

    mode = mode.upper()

    if mode == "ECB":
        ciphertext = encrypt_ecb(data, key)

        with open(output_path, "wb") as file:
            file.write(ciphertext)

    elif mode == "CBC":
        iv, ciphertext = encrypt_cbc(data, key)

        with open(output_path, "wb") as file:
            file.write(iv)
            file.write(ciphertext)

    else:
        raise ValueError("Unsupported AES mode. Use ECB or CBC.")


def decrypt_file(input_path, output_path, key, mode):
    """
    Decrypt a file using AES in ECB or CBC mode.

    For ECB:
        input = ciphertext

    For CBC:
        input = IV + ciphertext
    """

    input_path = Path(input_path)
    output_path = Path(output_path)

    with open(input_path, "rb") as file:
        encrypted_data = file.read()

    mode = mode.upper()

    if mode == "ECB":
        plaintext = decrypt_ecb(encrypted_data, key)

    elif mode == "CBC":
        if len(encrypted_data) < 16:
            raise ValueError("Invalid CBC encrypted file.")

        iv = encrypted_data[:16]
        ciphertext = encrypted_data[16:]

        plaintext = decrypt_cbc(iv, ciphertext, key)

    else:
        raise ValueError("Unsupported AES mode. Use ECB or CBC.")

    with open(output_path, "wb") as file:
        file.write(plaintext)