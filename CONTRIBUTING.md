# Contributing to DevLens 🚀

First off, thank you for considering contributing to DevLens! Open-source contributions help make local, privacy-first developer diagnostics better for everyone.

Please take a moment to review this document before submitting your contribution.

---

## 📜 Code of Conduct
This project and everyone participating in it is governed by the [DevLens Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code.

---

## 🛠️ How Can I Contribute?

### 1. Reporting Bugs
- Use the GitHub issue tracker.
- Check if the issue has already been reported.
- Include a clear title and description.
- Provide a minimal reproduction script, stack trace, or page URL.
- Specify browser version (e.g. Chrome 128) and operating system.

### 2. Suggesting Enhancements
- Open a GitHub issue titled `[Feature Request]: ...`.
- Explain why this feature would be useful to developers.
- Detail how it adheres to our core principle: **Local-first, privacy-respecting, explainable diagnostics with zero cloud telemetry**.

### 3. Pull Requests

1. **Fork the repo** and create your branch from `main`:
   ```bash
   git checkout -b feat/my-new-feature
   ```
2. **Set up the local environment**:
   ```bash
   cd backend
   python -m venv venv
   .\venv\Scripts\activate   # Or source venv/bin/activate on Unix
   pip install -r requirements.txt
   ```
3. **Make your changes**:
   - Follow clean code practices (standard library first, minimal dependencies).
   - Do not add external cloud logging or paid AI wrappers.
4. **Run automated tests**:
   ```bash
   pytest backend/tests/
   ```
5. **Verify extension syntax**:
   ```bash
   node -c extension/background/service_worker.js
   node -c extension/popup/popup.js
   node -c extension/devtools/devtools.js
   ```
6. **Commit your changes**:
   ```bash
   git commit -m "feat(collector): add detection for Astro framework"
   ```
7. **Push to your fork and submit a Pull Request** against `main`.

---

## ⚖️ License
By contributing to DevLens, you agree that your contributions will be dual-licensed under both the **MIT License** and the **Apache License 2.0**.
