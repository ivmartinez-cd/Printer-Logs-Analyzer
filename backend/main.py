"""FastAPI entrypoint used by uvicorn."""

import uvicorn

from interface.api import app


def run() -> None:
    """Launch uvicorn server with sensible defaults."""
    uvicorn.run("interface.api:app", host="0.0.0.0", port=8000, reload=True)


if __name__ == "__main__":
    run()
