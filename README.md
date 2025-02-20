# cryptsend.thingylabs.io

> ‼ NOT WORKING YET.

Zero-setup encrypted file sharing from your terminal. Upload files with
client-side encryption using standard Unix tools.

## Usage

```bash
curl -s https://upload.thingylabs.io/upload.sh | bash -s -- yourfile.pdf
```

This will:

1. Encrypt your file locally using OpenSSL
2. Upload it securely
3. Return a sharing URL with embedded decryption key

Recipients can just click the URL to decrypt and download the file.

## Features

- Client-side encryption using AES-256-CBC
- Zero setup - uses standard Unix tools (OpenSSL, curl)
- No registration required
- Single-click decryption for recipients
- Files are encrypted before leaving your machine
- 100MB file size limit
- URLs include everything needed for decryption
- File deletion can be triggered manually

## Security

- Uses OpenSSL for encryption with AES-256-CBC
- Random key/IV generation for each upload
- Files are encrypted before upload
- Client-side decryption using Web Crypto API
- No server-side key storage

## Development

This tool was developed by [Thingylabs](https://thingylabs.io) with assistance
from [Claude AI](https://anthropic.com/claude).

---

„[We ♥ Open Souce](https://open.thingylabs.io/)“
