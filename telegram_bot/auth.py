import os
from telethon import TelegramClient

api_id = 39214400
api_hash = 'ce1b295d4cc19db6c9f9804bc8b88c9c'
phone_number = '+31726225767'

client = TelegramClient('session_name', api_id, api_hash)

async def main():
    await client.connect()
    
    if not await client.is_user_authorized():
        print(f"Sūtu autorizācijas kodu uz: {phone_number}")
        await client.send_code_request(phone_number)
        code = input('Pārbaudi Telegram un ievadi saņemto 5 ciparu kodu: ')
        try:
            await client.sign_in(phone_number, code)
            print("Autorizācija veiksmīga!")
        except Exception as e:
            if 'SessionPasswordNeededError' in str(e):
                password = input('Ievadi Two-Step Verification paroli: ')
                await client.sign_in(password=password)
                print("Autorizācija veiksmīga!")
            else:
                 print(f"Kļūda: {e}")
    else:
         print("Jau autorizēts šajā sesijā.")
         
    me = await client.get_me()
    print(f"Pieslēgts kā: {me.username}")

with client:
    client.loop.run_until_complete(main())
