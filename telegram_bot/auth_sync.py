import asyncio
from telethon.sync import TelegramClient

api_id = 39214400
api_hash = 'ce1b295d4cc19db6c9f9804bc8b88c9c'

with TelegramClient('session_name_sync', api_id, api_hash) as client:
    print(client.get_me().stringify())