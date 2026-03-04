import asyncio
import json
import os
from telethon import TelegramClient, events
from datetime import datetime, timezone, timedelta

api_id = 39214400
api_hash = 'ce1b295d4cc19db6c9f9804bc8b88c9c'
target_channel = -1001998353092
LOG_FILE = '/home/roo/.openclaw/workspace/latest_signals.json'

def save_signal_log(signal_data):
    logs = []
    if os.path.exists(LOG_FILE):
        try:
            with open(LOG_FILE, 'r') as f:
                logs = json.load(f)
                if not isinstance(logs, list):
                    logs = []
        except Exception as e:
            print(f"Error reading JSON: {e}")
            logs = []
            
    # Remove existing entry if it's an edit (same ID) to keep list clean, or just prepend
    logs.insert(0, signal_data)
    
    unique_logs = []
    seen = set()
    for l in logs:
        # Pārbauda, vai ierakstam ir 'id'. Ja nav (kā vecajiem datiem), ignorējam to labojumos un ieliekam kādu fake ID.
        l_id = l.get('id', str(l.get('time', 'unknown')))
        if l_id not in seen:
            unique_logs.append(l)
            seen.add(l_id)
            
    # Keep only last 10
    unique_logs = unique_logs[:10]
    
    try:
        with open(LOG_FILE, 'w') as f:
            json.dump(unique_logs, f, indent=4)
        print("Logs saved successfully.")
    except Exception as e:
        print(f"Error saving log: {e}")

async def main():
    client = TelegramClient('/home/roo/.openclaw/workspace/telegram_bot/session_direct', api_id, api_hash)
    await client.connect()
    print("Telegram signālu modulis aktīvs. Gaidu jaunas ziņas...")
    
    @client.on(events.NewMessage(chats=target_channel))
    @client.on(events.MessageEdited(chats=target_channel))
    async def handler(event):
        if not event.text: return
        print(f"\nJauna/Rediģēta ziņa! [ID: {event.id}]")
        print(f"Teksts: {event.text[:50]}...")
        
        reply_id = event.reply_to.reply_to_msg_id if getattr(event, 'reply_to', None) else None
        
        # Formatēt laiku atbilstoši GMT+2 (Rīga)
        if event.date:
            msg_time = event.date + timedelta(hours=2)
            timestamp_str = msg_time.isoformat()
        else:
            timestamp_str = (datetime.now(timezone.utc) + timedelta(hours=2)).isoformat()
            
        # Saglabāt log failā priekš Mission Control
        signal_data = {
            'id': event.id,
            'text': event.text,
            'timestamp': timestamp_str,
            'reply_to': reply_id
        }
        save_signal_log(signal_data)
            
    await client.run_until_disconnected()

if __name__ == '__main__':
    asyncio.run(main())
