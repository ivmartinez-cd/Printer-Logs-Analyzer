"""FastAPI entrypoint used by uvicorn."""

import uvicorn


def run() -> None:
    uvicorn.run("backend.interface.api:app", host="0.0.0.0", port=10000)


if __name__ == "__main__":
    run()
