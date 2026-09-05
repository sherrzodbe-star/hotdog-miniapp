import base64
import io
import asyncio
import hashlib
import hmac
import json
import logging
import os
import threading
from urllib.parse import parse_qsl

import requests
from flask import Flask, jsonify, request
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import (
    Application,
    CommandHandler,
    MessageHandler,
    ContextTypes,
    filters,
    CallbackQueryHandler,
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

BOT_TOKEN = os.getenv("BOT_TOKEN", "")
ADMIN_CHAT_ID = os.getenv("ADMIN_CHAT_ID", "8262167046")
GROUP_CHAT_ID = os.getenv("GROUP_CHAT_ID", "-1004463040469")
MINI_APP_URL = os.getenv(
    "MINI_APP_URL",
    "https://sherrzodbe-star.github.io/hotdog-miniapp/"
)

MENU = {
    "classic_burger": ("Classic Burger", 35000, "🍔"),
    "dabil_burger": ("Dabil Burger", 45000, "🍔"),
    "chicken_burger": ("Chicken Burger", 35000, "🍔"),
    "kofte_burger": ("Kofte Burger", 45000, "🍔"),
    "ultra_hotdog": ("Ultra Hot Dog", 38000, "🌭"),
    "bolshoy_hotdog": ("Bolshoy Hot Dog", 33000, "🌭"),
    "sredniy_hotdog": ("Sredniy Hot Dog", 25000, "🌭"),
    "malenkiy_hotdog": ("Malenkiy Hot Dog", 15000, "🌭"),
    "clab_sendvich": ("Clab Sendvich", 40000, "🥪"),
    "obichniy_hotdog": ("Obichniy Hot Dog", 15000, "🌭"),
    "koroleviski_hotdog": ("Koroleviski Hot Dog", 25000, "🌭"),
    "corn_hotdog_1": ("Corn Hot Dog (1 sosiska)", 18000, "🌽"),
    "corn_hotdog_2": ("Corn Hot Dog (2 sosiska)", 28000, "🌽"),
}

app_web = Flask(__name__)


# CORS
@app_web.after_request
def add_cors(response):
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
    return response


def price(n):
    return f"{int(n):,}".replace(",", " ") + " so'm"


def validate_init_data(init_data: str) -> bool:
    if not init_data or not BOT_TOKEN:
        return False

    try:
        pairs = dict(parse_qsl(init_data, keep_blank_values=True))
        received_hash = pairs.pop("hash", "")

        if not received_hash:
            return False

        data_check_string = "\n".join(
            f"{k}={pairs[k]}" for k in sorted(pairs)
        )

        secret_key = hmac.new(
            b"WebAppData",
            BOT_TOKEN.encode(),
            hashlib.sha256
        ).digest()

        calculated = hmac.new(
            secret_key,
            data_check_string.encode(),
            hashlib.sha256
        ).hexdigest()

        return hmac.compare_digest(calculated, received_hash)

    except Exception:
        return False


def send_to_telegram(chat_id, text):
    url = f"https://api.telegram.org/bot{BOT_TOKEN}/sendMessage"

    r = requests.post(
        url,
        json={
            "chat_id": chat_id,
            "text": text
        },
        timeout=20
    )
    def send_receipt_to_telegram(chat_id, receipt):
    if not receipt:
        return

    try:
        header, encoded = receipt.split(",", 1)
        image_bytes = base64.b64decode(encoded)

        url = f"https://api.telegram.org/bot{BOT_TOKEN}/sendPhoto"

        files = {
            "photo": ("receipt.jpg", io.BytesIO(image_bytes), "image/jpeg")
        }

        data = {
            "chat_id": chat_id,
            "caption": "🧾 To'lov cheki"
        }

        r = requests.post(
            url,
            data=data,
            files=files,
            timeout=30
        )

        r.raise_for_status()

    except Exception:
        logger.exception("Chekni Telegramga yuborishda xato")

    r.raise_for_status()


@app_web.get("/health")
def health():
    return jsonify(ok=True)


@app_web.route("/api/order", methods=["POST", "OPTIONS"])
def create_order():

    # CORS preflight
    if request.method == "OPTIONS":
        return "", 204

    data = request.get_json(silent=True) or {}

    if not validate_init_data(data.get("initData", "")):
        return jsonify(
            ok=False,
            error="Telegram sessiyasi tasdiqlanmadi"
        ), 401

    name = str(data.get("name", "")).strip()
    phone = str(data.get("phone", "")).strip()
    payment = str(data.get("payment", "")).strip()
    note = str(data.get("note", "")).strip()
    raw_items = data.get("items", [])
    receipt = data.get("receipt")
    if not name or not phone or not isinstance(raw_items, list) or not raw_items:
        return jsonify(
            ok=False,
            error="Buyurtma ma'lumotlari to'liq emas"
        ), 400

    lines = [
        "🆕 YANGI BUYURTMA (Mini App)",
        f"👤 Mijoz: {name}",
        f"📞 Tel: {phone}",
        f"💳 To'lov: {payment or '-'}",
        "",
        "🛒 Buyurtma:"
    ]

    total = 0

    for row in raw_items:

        item_id = str(row.get("id", ""))

        if item_id not in MENU:
            return jsonify(
                ok=False,
                error="Noma'lum mahsulot"
            ), 400

        try:
            qty = int(row.get("qty", 0))
        except Exception:
            return jsonify(
                ok=False,
                error="Miqdor xato"
            ), 400

        if qty < 1 or qty > 99:
            return jsonify(
                ok=False,
                error="Miqdor noto'g'ri"
            ), 400

        title, unit, emoji = MENU[item_id]

        subtotal = unit * qty
        total += subtotal

        lines.append(
            f"• {emoji} {title} x{qty} = {price(subtotal)}"
        )

    lines.append("")
    lines.append(f"💰 Jami: {price(total)}")

    if note:
        lines.append(f"📝 Izoh: {note}")

    user = data.get("user") or {}

    if user.get("username"):
        lines.append(f"\n👤 Telegram: @{user['username']}")

    text = "\n".join(lines)

    errors = []

    for chat_id in (ADMIN_CHAT_ID, GROUP_CHAT_ID):

        if not chat_id:
            continue

        try:
            send_to_telegram(chat_id, text)
if receipt:
    send_receipt_to_telegram(chat_id, receipt)
        except Exception as e:
            logger.exception("Telegramga yuborishda xato")
            errors.append(str(e))

    if errors:
        return jsonify(
            ok=False,
            error="Telegramga yuborishda xatolik"
        ), 502

    return jsonify(ok=True)


async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):

    kb = InlineKeyboardMarkup([
        [
            InlineKeyboardButton(
                "🌭 MENYUNI OCHISH",
                web_app={"url": MINI_APP_URL}
            )
        ],
        [
            InlineKeyboardButton(
                "📍 Manzil",
                callback_data="address"
            )
        ]
    ])

    await update.message.reply_text(
        "🌭 *American Hot Dog & Burger*\n\n"
        "Buyurtmangizni Mini App orqali qulay tarzda bering.\n\n"
        "📍 Termiz shahri, Cola restoran ro‘parasi\n"
        "📞 +998 95 156 82 88 / +998 95 147 83 88",
        parse_mode="Markdown",
        reply_markup=kb
    )


async def address(update: Update, context: ContextTypes.DEFAULT_TYPE):

    q = update.callback_query

    await q.answer()

    await q.message.reply_text(
        "📍 Termiz shahri, Cola restoran ro‘parasi\n"
        "📞 +998 95 156 82 88 / +998 95 147 83 88"
    )


async def web_app_data(update: Update, context: ContextTypes.DEFAULT_TYPE):

    try:

        order = json.loads(
            update.effective_message.web_app_data.data
        )

        await update.effective_message.reply_text(
            "✅ Buyurtmangiz qabul qilindi!"
        )

    except Exception:

        await update.effective_message.reply_text(
            "❌ Buyurtma ma'lumotini o‘qib bo‘lmadi."
        )


def run_web():

    port = int(os.getenv("PORT", "10000"))

    app_web.run(
        host="0.0.0.0",
        port=port,
        debug=False,
        use_reloader=False
    )


def main():

    if not BOT_TOKEN:
        raise RuntimeError(
            "BOT_TOKEN environment variableini kiriting."
        )

    threading.Thread(
        target=run_web,
        daemon=True
    ).start()

    application = Application.builder().token(BOT_TOKEN).build()

    application.add_handler(
        CommandHandler("start", start)
    )

    application.add_handler(
        MessageHandler(
            filters.StatusUpdate.WEB_APP_DATA,
            web_app_data
        )
    )

    application.add_handler(
        CallbackQueryHandler(
            address,
            pattern="^address$"
        )
    )

    application.run_polling()


if __name__ == "__main__":
    main()
