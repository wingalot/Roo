---
name: telegram-channel-reader
description: Access private Telegram channels via user MTProto API, read messages, traverse history, and parse reply_to mappings for trading signals or alerts.
---

# Telegram Channel Reader

## Setup

Uses Telethon to connect as a user. Requires `api_id` and `api_hash` from https://my.telegram.org.
Store credentials in `~/.telegram_auth` or pass them via environment variables. The first run requires interactive code entry.

## Execution

Execute the python scripts provided in `scripts/` to interact with Telegram.

- `scripts/read_history.py <channel_id> <limit>`: Fetch the last `limit` messages from the specified channel.
- `scripts/get_replies.py <channel_id> <message_id>`: Fetch messages replying to the target message.

## Output

Outputs are typically JSON objects to allow easy parsing by other tools or the agent.
