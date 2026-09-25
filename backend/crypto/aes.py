from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.primitives import padding


BLOCK_SIZE = 128


def encrypt_ecb(data, key):
    # PKCS7 padding
    padder = padding.PKCS7(BLOCK_SIZE).padder()
    padded_data = padder.update(data) + padder.finalize()

    # AES-ECB
    cipher = Cipher(
        algorithms.AES(key),
        modes.ECB()
    )

    encryptor = cipher.encryptor()
    ciphertext = encryptor.update(padded_data) + encryptor.finalize()

    return ciphertext


def decrypt_ecb(ciphertext, key):
    # AES-ECB
    cipher = Cipher(
        algorithms.AES(key),
        modes.ECB()
    )

    decryptor = cipher.decryptor()
    padded_data = decryptor.update(ciphertext) + decryptor.finalize()

    # Remove PKCS7 padding
    unpadder = padding.PKCS7(BLOCK_SIZE).unpadder()
    data = unpadder.update(padded_data) + unpadder.finalize()

    return data