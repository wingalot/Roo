import os
import requests
import json
from dotenv import load_dotenv

load_dotenv()

class IGBroker:
    def __init__(self):
        self.api_key = os.getenv('IG_API_KEY')
        self.username = os.getenv('IG_USERNAME')
        self.password = os.getenv('IG_PASSWORD')
        self.base_url = os.getenv('IG_API_URL')
        
        self.cst = None
        self.cst_token = None
        self.security_token = None
        self.account_id = None

    def login(self):
        url = f"{self.base_url}/session"
        headers = {
            'X-IG-API-KEY': self.api_key,
            'Content-Type': 'application/json',
            'Accept': 'application/json; charset=UTF-8',
            'VERSION': '2'
        }
        payload = {
            "identifier": self.username,
            "password": self.password
        }
        
        response = requests.post(url, headers=headers, json=payload)
        if response.status_code == 200:
            self.cst = response.headers.get('CST')
            self.security_token = response.headers.get('X-SECURITY-TOKEN')
            data = response.json()
            self.account_id = data.get('currentAccountId')
            print(f"[OK] Sesija atvērta. Konts: {self.account_id}")
            return True
        else:
            print(f"[KĻŪDA] Neizdevās pieslēgties: {response.text}")
            return False

    def get_auth_headers(self, version='1'):
        return {
            'X-IG-API-KEY': self.api_key,
            'CST': self.cst,
            'X-SECURITY-TOKEN': self.security_token,
            'Content-Type': 'application/json',
            'Accept': 'application/json; charset=UTF-8',
            'VERSION': version
        }

    def get_balance(self):
        url = f"{self.base_url}/accounts"
        response = requests.get(url, headers=self.get_auth_headers())
        
        if response.status_code == 200:
            data = response.json()
            for acc in data.get('accounts', []):
                if acc['accountId'] == self.account_id:
                    balance = acc['balance']['balance']
                    print(f"Bilance: {balance}")
                    return balance
        print(f"[KĻŪDA] Nevar iegūt bilanci: {response.text}")
        return None

    def open_position(self, epic, direction, size, stop_distance=None, limit_distance=None):
        url = f"{self.base_url}/positions/otc"
        payload = {
            "epic": epic,
            "expiry": "-",
            "direction": direction, # "BUY" vai "SELL"
            "size": str(size),
            "orderType": "MARKET",
            "timeInForce": "EXECUTE_AND_ELIMINATE",
            "level": None,
            "guaranteedStop": False,
            "stopLevel": None,
            "stopDistance": str(stop_distance) if stop_distance else None,
            "forceOpen": True,
            "limitLevel": None,
            "limitDistance": str(limit_distance) if limit_distance else None,
            "quoteId": None,
            "currencyCode": "USD"
        }
        
        response = requests.post(url, headers=self.get_auth_headers(version='2'), json=payload)
        if response.status_code == 200:
            deal_ref = response.json().get('dealReference')
            print(f"[OK] Orderis atvērts. Atsauce: {deal_ref}")
            return deal_ref
        print(f"[KĻŪDA] Ordera atvēršana neizdevās: {response.text}")
        return None

    def close_position(self, deal_id, direction, size):
        url = f"{self.base_url}/positions/otc"
        headers = self.get_auth_headers(version='1')
        headers['_method'] = 'DELETE'
        
        payload = {
            "dealId": deal_id,
            "direction": "SELL" if direction == "BUY" else "BUY",
            "size": str(size),
            "orderType": "MARKET"
        }
        
        response = requests.post(url, headers=headers, json=payload)
        
        if response.status_code == 200:
            deal_ref = response.json().get('dealReference')
            print(f"[OK] Pozīcija aizvērta. Atsauce: {deal_ref}")
            return deal_ref
        print(f"[KĻŪDA] Pozīcijas aizvēršana neizdevās: {response.text}")
        return None

    def get_open_positions(self):
        url = f"{self.base_url}/positions"
        response = requests.get(url, headers=self.get_auth_headers(version='2'))
        if response.status_code == 200:
            positions = response.json().get('positions', [])
            print(f"\nAtrastas {len(positions)} atvērtas pozīcijas:")
            for p in positions:
                pos = p.get('position', {})
                market = p.get('market', {})
                print(f"- Epic: {market.get('epic')} | Virziens: {pos.get('direction')} | Izmērs: {pos.get('size')} | Deal ID: {pos.get('dealId')}")
            return positions
        print(f"[KĻŪDA] Nevar iegūt pozīcijas: {response.text}")
        return []

if __name__ == "__main__":
    print("IG Broker modulis ielādēts. Gatavs darbam.")
    # broker = IGBroker()
    # if broker.login():
    #     broker.get_balance()
