import sys
import asyncio
from telethon import TelegramClient

API_ID = '39214400'
API_HASH = 'ce1b295d4cc19db6c9f9804bc8b88c9c'
SESSION_NAME = 'trading_bot_session'

async def main():
    if len(sys.argv) < 4:
        print("Usage: python auth_step2.py <phone_number> <code> <hash>")
        sys.exit(1)
        
    phone = sys.argv[1]
    code = sys.argv[2]
    phone_hash = sys.argv[3]
    
    client = TelegramClient(SESSION_NAME, API_ID, API_HASH)
    await client.connect()
    
    try:
        await client.sign_in(phone, code, phone_code_hash=phone_hash)
        print("SUCCESS. Fully authorized.")
    except Exception as e:
        print(f"FAILED. {e}")

if __name__ == '__main__':
    asyncio.run(main())