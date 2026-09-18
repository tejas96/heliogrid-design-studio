"""Ingress bridge to the existing Next.js API routes; no duplicate business logic."""
import os
from contextlib import asynccontextmanager
from pathlib import Path

import httpx
from dotenv import load_dotenv
from fastapi import FastAPI, Request
from fastapi.responses import Response, JSONResponse

load_dotenv(Path(__file__).with_name('.env'))
STUDIO_INTERNAL_URL = os.environ['STUDIO_INTERNAL_URL'].rstrip('/')


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with httpx.AsyncClient(timeout=90.0, follow_redirects=False) as client:
        app.state.client = client
        yield


app = FastAPI(lifespan=lifespan, docs_url=None, redoc_url=None)
HOP_HEADERS = {'host', 'content-length', 'transfer-encoding', 'connection', 'content-encoding', 'keep-alive', 'upgrade', 'proxy-authenticate', 'proxy-authorization', 'te', 'trailer'}


@app.api_route('/api/{path:path}', methods=['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'])
async def studio_api(path: str, request: Request):
    # Only same-app /api routes, never a user-specified upstream URL.
    url = httpx.URL(f'{STUDIO_INTERNAL_URL}/api/{path}', query=request.url.query.encode())
    headers = {k: v for k, v in request.headers.items() if k.lower() not in HOP_HEADERS}
    try:
        result = await request.app.state.client.request(request.method, url, headers=headers, content=await request.body())
    except httpx.HTTPError:
        return JSONResponse({'status': 'error', 'message': 'Studio data service unavailable'}, status_code=503)
    return Response(content=result.content, status_code=result.status_code, headers={k: v for k, v in result.headers.items() if k.lower() not in HOP_HEADERS})