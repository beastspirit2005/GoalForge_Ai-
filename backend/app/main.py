import traceback
import sys
from pathlib import Path

backend_dir = Path(__file__).resolve().parents[1]
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))
try:
    from app.real_main import app
except Exception as e:
    err_msg = traceback.format_exc().encode('utf-8')
    async def app(scope, receive, send):
        if scope['type'] == 'lifespan':
            while True:
                message = await receive()
                if message['type'] == 'lifespan.startup':
                    await send({'type': 'lifespan.startup.complete'})
                elif message['type'] == 'lifespan.shutdown':
                    await send({'type': 'lifespan.shutdown.complete'})
                    return
        elif scope['type'] == 'http':
            await send({
                'type': 'http.response.start',
                'status': 500,
                'headers': [(b'content-type', b'text/plain')],
            })
            await send({
                'type': 'http.response.body',
                'body': err_msg,
            })
