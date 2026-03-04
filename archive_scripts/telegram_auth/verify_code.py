import sys
import asyncio
from telethon import TelegramClient

api_id = 39214400
api_hash = 'ce1b295d4cc19db6c9f9804bc8b88c9c'
phone = '+37126225767'

if len(sys.argv) < 2:
    print("Trūkst koda!")
    sys.exit(1)
    
code = sys.argv[1]

async def main():
    client = TelegramClient('session_direct', api_id, api_hash)
    await client.connect()
    
    with open('phone_hash.txt', 'r') as f:
        phone_code_hash = f.read().strip()
        
    try:
        await client.sign_in(phone, code, phone_code_hash=phone_code_hash)
        print("AUTORIZACIJA_VEIKSMIGA")
    except Exception as e:
        if 'SessionPasswordNeededError' in str(e):
             print("NEPIECIESAMA_2FA_PAROLE")
        else:
             print(f"KLUDA_ATVEROT: {e}")

if __name__ == '__main__':
    asyncio.run(main())