import asyncio
from telethon import TelegramClient

api_id = 39214400
api_hash = 'ce1b295d4cc19db6c9f9804bc8b88c9c'

async def main():
    client = TelegramClient('session_name', api_id, api_hash)
    await client.connect()
    
    auth_status = await client.is_user_authorized()
    print(f"Vai esam ielogoti: {auth_status}")

if __name__ == '__main__':
    asyncio.run(main())