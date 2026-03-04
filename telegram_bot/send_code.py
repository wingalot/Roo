import asyncio
import sys
import json
from telethon import TelegramClient

api_id = 39214400
api_hash = 'ce1b295d4cc19db6c9f9804bc8b88c9c'
phone = '+37126225767'

async def main():
    client = TelegramClient('session_direct', api_id, api_hash)
    await client.connect()
    
    if await client.is_user_authorized():
        print("ALREADY_AUTHORIZED")
        return
        
    print("Sūtu kodu...")
    result = await client.send_code_request(phone)
    
    with open('phone_hash.txt', 'w') as f:
        f.write(result.phone_code_hash)
        
    print("KODS_NOSUTITS")

if __name__ == '__main__':
    asyncio.run(main())