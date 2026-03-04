import asyncio
from telethon import TelegramClient, events

api_id = 39214400
api_hash = 'ce1b295d4cc19db6c9f9804bc8b88c9c'
target_channel = -1001998353092

async def main():
    client = TelegramClient('session_direct', api_id, api_hash)
    await client.connect()
    print("Telegram signālu modulis aktīvs. Gaidu jaunas ziņas...")
    
    @client.on(events.NewMessage(chats=target_channel))
    async def handler(event):
        print(f"\nJauns signāls! [ID: {event.id}]")
        print(f"Teksts: {event.text}")
        if event.reply_to:
            print(f"Atbilde uz: {event.reply_to.reply_to_msg_id}")
            # Šeit pievienosim tālāko loģiku, piemēram, "TP1 hit" gadījumā
            
    await client.run_until_disconnected()

if __name__ == '__main__':
    asyncio.run(main())