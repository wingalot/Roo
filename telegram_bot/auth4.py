import os
import asyncio
from telethon import TelegramClient

api_id = 39214400
api_hash = 'ce1b295d4cc19db6c9f9804bc8b88c9c'
phone = '+37126225767'

async def main():
    client = TelegramClient('session_name', api_id, api_hash)
    await client.connect()
    
    if not await client.is_user_authorized():
        print(f"Sūtu kodu uz {phone}...")
        try:
            await client.send_code_request(phone)
            print("Kods nosūtīts! Lūdzu ievadi kodu:")
        except Exception as e:
            print(f"Kļūda sūtot kodu: {e}")
            return
            
        code = input("Ievadi saņemto 5-ciparu kodu: ")
        try:
            await client.sign_in(phone, code)
            print("Autorizācija veiksmīga!")
        except Exception as e:
            if 'SessionPasswordNeededError' in str(e):
                password = input("Ievadi 2FA paroli: ")
                await client.sign_in(password=password)
                print("Autorizācija veiksmīga!")
            else:
                print(f"Kļūda autorizējoties: {e}")
    else:
        print("Jau autorizēts!")

if __name__ == '__main__':
    asyncio.run(main())