"""The interface for querying and displaying citationnets."""
from pathlib import Path
from typing import Annotated

import uvicorn
from fastapi import FastAPI, Form, Request
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates

from citationnet.network import GetRecords

app = FastAPI()

BASE_PATH = Path(__file__).resolve().parent
DATA_PATH = BASE_PATH / "static" / "data"
app.mount("/static", StaticFiles(directory=str(BASE_PATH / "static")), name="static")
templates = Jinja2Templates(directory=str(BASE_PATH / "templates"))

nav_menu = [
    {"caption": "Create or select", "href": "/"},
    {"caption": "Read more", "href": "https://modelsen.gea.mpg.de"},
]


@app.get("/")
async def index(request: Request) -> str:
    """Display entry page."""
    currentfiles = [x.name for x in sorted(DATA_PATH.glob("*.json"))]

    return templates.TemplateResponse(
        "startpage.html",
        {
            "request": request,
            "navigation": nav_menu,
            "files": currentfiles,
        },
    )


@app.post("/createdata/")
async def get_data(
    request: Request,
    publication: Annotated[str, Form()],
    citationlimit: Annotated[int, Form()],
    email: Annotated[str, Form()] = "vogl@gea.mpg.de",
) -> None:
    """Retrieve the network for a seed publication."""
    generatedata = GetRecords(email=email, outpath=DATA_PATH)

    filepath = generatedata.getNetwork(doi=publication.strip(), citationlimit=citationlimit)
    currentfiles = [x.name for x in sorted(DATA_PATH.glob("*.json"))]

    if isinstance(filepath, tuple):
        messagetext = f"""
            Failed to get new data for {publication}.
            It is cited {filepath[1]} times.
            Consider increasing the limit!
        """
        return templates.TemplateResponse(
            "startpage.html",{
                "request": request,
                "navigation": nav_menu,
                "message": {"level":"warning", "text": messagetext},
                "files": currentfiles,
            },
        )

    return templates.TemplateResponse(
        "startpage.html",
        {
            "request": request,
            "navigation": nav_menu,
            "message": {
                "level": "success",
                "text": f"Finished loading data for {filepath.name}.\nYou can now select the file for displaying.",
            },
            "files": currentfiles,
        },
    )


@app.post("/drawnetwork/")
async def draw_citationnet(
    request: Request,
    filename: Annotated[str, Form()],
) -> None:
    """Draw the citationnet for the given filename."""
    return templates.TemplateResponse(
        "drawnetwork.html",
        {
            "request": request,
            "navigation": nav_menu,
            "filename": filename,
        },
    )


if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8000)
