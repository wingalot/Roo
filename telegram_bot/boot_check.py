import asyncio
import os
import sys
import requests
import json
from datetime import datetime, timedelta, timezone

# Add venv path if needed, though running with venv python is better
from telethon import TelegramClient

api_id = 39214400
api_hash = 'ce1b295d4cc19db6c9f9804bc8b88c9c'
target_channel = -1001998353092
user_chat_id = 395239117 # Evi's ID

async def get_ig_positions():
    from dotenv import load_dotenv
    load_dotenv(dotenv_path='../.env')
    
    IG_API_URL = os.getenv('IG_API_URL')
    IG_API_KEY = os.getenv('IG_API_KEY')
    IG_USERNAME = os.getenv('IG_USERNAME')
    IG_PASSWORD = os.getenv('IG_PASSWORD')
    
    # Auth
    auth_data = {
        "identifier": IG_USERNAME,
        "password": IG_PASSWORD
    }
    headers = {
        'VERSION': '2',
        'X-IG-API-KEY': IG_API_KEY,
        'Content-Type': 'application/json',
        'Accept': 'application/json; charset=UTF-8'
    }
    
    try:
        r = requests.post(f"{IG_API_URL}/session", json=auth_data, headers=headers)
        if r.status_code != 200:
            print("Failed to authenticate to IG")
            return []
            
        cst = r.headers.get('CST')
        x_sec_token = r.headers.get('X-SECURITY-TOKEN')
        
        pos_headers = {
            'VERSION': '1',
            'X-IG-API-KEY': IG_API_KEY,
            'CST': cst,
            'X-SECURITY-TOKEN': x_sec_token
        }
        
        r_pos = requests.get(f"{IG_API_URL}/positions", headers=pos_headers)
        if r_pos.status_code == 200:
            return r_pos.json().get('positions', [])
        else:
            print("Failed to get positions")
            return []
    except Exception as e:
        print(f"IG Connection error: {e}")
        return []

async def main():
    print("Sāku automātisko sistēmas ielādi un datu pārbaudi...")
    
    # 1. Iegūstam IG pozīcijas
    ig_positions = await get_ig_positions()
    open_epics = [p['market']['epic'] for p in ig_positions]
    print(f"Atvērtās pozīcijas IG: {open_epics}")

    client = TelegramClient('session_direct', api_id, api_hash)
    await client.connect()
    
    # 2. Iegūstam Felix VIP ziņas par pēdējām 24 stundām
    four_h_ago = datetime.now(timezone.utc) - timedelta(hours=24)
    recent_signals = []
    
    try:
        async for message in client.iter_messages(target_channel, limit=20, offset_date=datetime.now(timezone.utc)):
            if message.date < four_h_ago:
                break
            if message.text:
                recent_signals.append(message.text.lower())
    except Exception as e:
        print(f"Nevarēju nolasīt Felix ziņas: {e}")
        
    print(f"Pēdējo 24h laikā atlasīti {len(recent_signals)} ziņojumi Felix VIP kanālā.")

    # Vienkārša pārbaude: Vai mēs varam atrast Epic atslēgvārdus pēdējos ziņojumos?
    mismatch_found = False
    mismatched_epics = []
    
    for epic in open_epics:
        asset = epic.split('.')[2] # CS.D.CFDGOLD.CFDGC.IP -> CFDGOLD (not perfect, but basic check)
        
        # Mēģinam atpazīt populārākos aktīvus
        found = False
        if "GOLD" in asset or "XAU" in asset:
            key = "gold"
        elif "EURUSD" in asset:
            key = "eurusd"
        elif "GBPUSD" in asset:
            key = "gbpusd"
        elif "DOW" in asset:
            key = "us30"
        else:
            key = asset.lower()
            
        for text in recent_signals:
            if key in text or ("xau" in key and "xau" in text) or ("gold" in key and "gold" in text):
                found = True
                break
                
        if not found:
            mismatched_epics.append(epic)
            mismatch_found = True

    # 3. Ja kļūda starp IG un Telegram - paziņojam lietotājam
    if mismatch_found:
        msg = f"⚠️ **Sistēmas Start-up Brīdinājums!**\n\nIG platformā ir atvērtas pozīcijas, kurām nevaru atrast apstiprinošus signālus no Felix VIP (pēdējās 24h):\n"
        for me in mismatched_epics:
            msg += f"- `{me}`\n"
        msg += "\nKo man iesākt ar šīm pozīcijām? Aizvērt, vai atstāt tās?"
        
        print("Sūtu brīdinājuma ziņu Tev...")
        await client.send_message(user_chat_id, msg)
    else:
        print("Viss tīrs. Nav atrasti 'mismatch' starp IG un Telegram.")
        
    # Start main listener
    print("Palaižu galveno Telegram klausītāju fona režīmā (PM2)...")
    os.system("pm2 restart telegram_listener || pm2 start main_listener.py --interpreter venv/bin/python --name telegram_listener")
    
    await client.disconnect()

if __name__ == '__main__':
    asyncio.run(main())
