from telethon import TelegramClient

api_id = 39214400
api_hash = 'ce1b295d4cc19db6c9f9804bc8b88c9c'

client = TelegramClient('session_name', api_id, api_hash)
client.start()
client.disconnect()
print("Saglabāts.")