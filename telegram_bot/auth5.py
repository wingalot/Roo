import os
import asyncio
from telethon import TelegramClient

api_id = 39214400
api_hash = 'ce1b295d4cc19db6c9f9804bc8b88c9c'
phone = '+37126225767'

async def main():
    client = TelegramClient('session_name2', api_id, api_hash)
    await client.connect()
    
    if not await client.is_user_authorized():
        print("Sūtu kodu...")
        await client.send_code_request(phone)
        code = input("Kods: ")
        
        try:
            await client.sign_in(phone, code)
            print("Pabeigts, autorizācija veiksmīga!")
        except Exception as e:
            if 'SessionPasswordNeededError' in str(e):
                password = input("Ievadi paroli 2FA: ")
                await client.sign_in(password=password)
                print("2FA veiksmīga!")
            else:
                print(f"Kļūda: {e}")

if __name__ == '__main__':
    asyncio.run(main())