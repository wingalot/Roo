import asyncio
from telethon import TelegramClient

api_id = 39214400
api_hash = 'ce1b295d4cc19db6c9f9804bc8b88c9c'
phone = '+37126225767'

async def main():
    client = TelegramClient('session_name', api_id, api_hash)
    await client.connect()
    print("Autorizācija veiksmīga!")
    me = await client.get_me()
    print(f"Lietotājs: {me.username}")
    
if __name__ == '__main__':
    asyncio.run(main())
