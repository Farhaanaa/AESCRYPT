from pathlib import Path

from services.encryption_service import encrypt_file, decrypt_file


KEY = b"12345678901234567890123456789012"

BASE_DIR = Path(__file__).parent

INPUT_FILE = BASE_DIR / "test.txt"

ECB_ENCRYPTED = BASE_DIR / "test_ecb.enc"
ECB_DECRYPTED = BASE_DIR / "test_ecb_decrypted.txt"

CBC_ENCRYPTED = BASE_DIR / "test_cbc.enc"
CBC_DECRYPTED = BASE_DIR / "test_cbc_decrypted.txt"


def main():
    print("Testing AES-ECB file encryption...")

    encrypt_file(
        INPUT_FILE,
        ECB_ENCRYPTED,
        KEY,
        "ECB"
    )

    decrypt_file(
        ECB_ENCRYPTED,
        ECB_DECRYPTED,
        KEY,
        "ECB"
    )

    ecb_original = INPUT_FILE.read_bytes()
    ecb_decrypted = ECB_DECRYPTED.read_bytes()

    print("ECB match:", ecb_original == ecb_decrypted)

    print("\nTesting AES-CBC file encryption...")

    encrypt_file(
        INPUT_FILE,
        CBC_ENCRYPTED,
        KEY,
        "CBC"
    )

    decrypt_file(
        CBC_ENCRYPTED,
        CBC_DECRYPTED,
        KEY,
        "CBC"
    )

    cbc_original = INPUT_FILE.read_bytes()
    cbc_decrypted = CBC_DECRYPTED.read_bytes()

    print("CBC match:", cbc_original == cbc_decrypted)


if __name__ == "__main__":
    main()