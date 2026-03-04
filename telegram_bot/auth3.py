import asyncio
from telethon import TelegramClient

api_id = 39214400
api_hash = 'ce1b295d4cc19db6c9f9804bc8b88c9c'
phone = '+31726225767'

async def main():
    client = TelegramClient('session_name', api_id, api_hash)
    await client.connect()
    if not await client.is_user_authorized():
        # Lūdzam nosūtīt kodu, izmantojot sms tipa specifikāciju 
        print("Sūtu kodu...")
        await client.send_code_request(phone, force_sms=True)
        code = input("Kods: ")
        await client.sign_in(phone, code)
    print("Autorizēts veiksmīgi!")

if __name__ == '__main__':
    asyncio.run(main())
