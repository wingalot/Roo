import asyncio
from telethon import TelegramClient

api_id = 39214400
api_hash = 'ce1b295d4cc19db6c9f9804bc8b88c9c'

async def main():
    client = TelegramClient('session_direct', api_id, api_hash)
    await client.connect()
    me = await client.get_me()
    print(f"Ielogojos kā: {me.first_name}")
    
    # Test message history
    channel_id = -1001998353092
    print(f"\nLasu nesenās ziņas no: {channel_id}")
    
    try:
        messages = await client.get_messages(channel_id, limit=3)
        for msg in messages:
            print(f"[{msg.id}] {msg.date}: {msg.text}")
            if msg.reply_to:
                print(f"  --> Atbilde uz ID: {msg.reply_to.reply_to_msg_id}")
    except Exception as e:
        print(f"Kļūda lasot ziņas: {e}")

if __name__ == '__main__':
    asyncio.run(main())