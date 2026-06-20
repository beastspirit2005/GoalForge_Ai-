import traceback

try:
    from app.real_main import app
except Exception as e:
    err_msg = traceback.format_exc().encode('utf-8')
    async def app(scope, receive, send):
        assert scope['type'] == 'http'
        await send({
            'type': 'http.response.start',
            'status': 500,
            'headers': [(b'content-type', b'text/plain')],
        })
        await send({
            'type': 'http.response.body',
            'body': err_msg,
        })
