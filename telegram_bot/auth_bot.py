import asyncio
from telethon import TelegramClient

api_id = 39214400
api_hash = 'ce1b295d4cc19db6c9f9804bc8b88c9c'

async def main():
    client = TelegramClient('session_final', api_id, api_hash)
    await client.connect()
    print("Mēģinu sūtīt kodu...")
    await client.send_code_request('+37126225767')
    code = input("Kods: ")
    await client.sign_in('+37126225767', code)
    print("Gatavs!")

import multiprocessing
if __name__ == '__main__':
    asyncio.run(main())