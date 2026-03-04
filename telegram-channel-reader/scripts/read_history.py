import asyncio
import os
import json
import argparse
from telethon import TelegramClient

API_ID = '39214400'
API_HASH = 'ce1b295d4cc19db6c9f9804bc8b88c9c'
SESSION_NAME = 'trading_bot_session'

async def read_history(channel_username, limit):
    async with TelegramClient(SESSION_NAME, API_ID, API_HASH) as client:
        messages = []
        async for message in client.iter_messages(channel_username, limit=limit):
            msg_data = {
                'id': message.id,
                'date': message.date.isoformat() if message.date else None,
                'message': message.message,
                'reply_to_msg_id': message.reply_to_msg_id
            }
            messages.append(msg_data)
        
        print(json.dumps(messages, indent=2))

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Read channel history')
    parser.add_argument('channel', help='Channel username or ID')
    parser.add_argument('--limit', type=int, default=10, help='Number of messages to read')
    args = parser.parse_args()
    
    asyncio.run(read_history(args.channel, args.limit))
