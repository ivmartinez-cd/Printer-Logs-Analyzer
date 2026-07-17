#!/usr/bin/env bash
# Upload a CPMD PDF to the production VM.
#
# Usage:
#   ./scripts/upload-cpmd.sh path/to/file.pdf
#
# The PDF will be placed in data/cpmd/ on the VM and immediately
# visible inside the backend container (volume-mounted).

set -euo pipefail

VM_USER="imartinez"
VM_HOST="34.63.48.46"
SSH_KEY="$HOME/.ssh/google_compute_engine"
REMOTE_DIR="/home/ivmartinez_cd/Printer-Logs-Analyzer/data/cpmd"

if [ $# -eq 0 ]; then
  echo "Usage: $0 <pdf-file> [<pdf-file> ...]"
  exit 1
fi

for PDF in "$@"; do
  if [ ! -f "$PDF" ]; then
    echo "Error: $PDF not found"
    exit 1
  fi

  FILENAME=$(basename "$PDF")
  echo "Uploading $FILENAME..."

  scp -i "$SSH_KEY" "$PDF" "$VM_USER@$VM_HOST:/tmp/$FILENAME"
  ssh -i "$SSH_KEY" "$VM_USER@$VM_HOST" \
    "sudo mv /tmp/$FILENAME $REMOTE_DIR/ && sudo chown ivmartinez_cd:ivmartinez_cd $REMOTE_DIR/$FILENAME"

  echo "OK: $FILENAME deployed to $REMOTE_DIR/"
done

echo ""
echo "Done. Files are live immediately (volume-mounted in Docker)."
echo "Remember to update data/cpmd/manifest.json with the new keywords."
