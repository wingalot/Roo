import sys
import asyncio
from telethon import TelegramClient

API_ID = '39214400'
API_HASH = 'ce1b295d4cc19db6c9f9804bc8b88c9c'
SESSION_NAME = 'trading_bot_session'

async def main():
    if len(sys.argv) < 2:
        print("Usage: python auth_step1.py <phone_number>")
        sys.exit(1)
        
    phone = sys.argv[1]
    client = TelegramClient(SESSION_NAME, API_ID, API_HASH)
    await client.connect()
    
    if not await client.is_user_authorized():
        # Sends the code request to the provided phone number
        request = await client.send_code_request(phone)
        print(f"SUCCESS. CODE_HASH:{request.phone_code_hash}")
    else:
        print("ALREADY_AUTHORIZED")

if __name__ == '__main__':
    asyncio.run(main())