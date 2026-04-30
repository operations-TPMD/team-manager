import os
import time
import threading
import tempfile
import tkinter as tk
from tkinter import simpledialog, messagebox
from datetime import datetime

import requests
import schedule
from PIL import ImageGrab, Image
from dotenv import load_dotenv
from google.oauth2.service_account import Credentials
from googleapiclient.discovery import build
from googleapiclient.http import MediaFileUpload
import pystray

load_dotenv()

API_URL = os.getenv('API_URL', 'http://localhost:3001/api')
SERVICE_ACCOUNT_FILE = os.getenv('GOOGLE_SERVICE_ACCOUNT_FILE', 'service_account.json')
DRIVE_FOLDER_ID = os.getenv('DRIVE_FOLDER_ID', '')
SCREENSHOT_INTERVAL = int(os.getenv('SCREENSHOT_INTERVAL_MINUTES', '10'))

user_id = None
user_name = None
is_clocked_in = False


def get_drive_service():
    creds = Credentials.from_service_account_file(
        SERVICE_ACCOUNT_FILE,
        scopes=['https://www.googleapis.com/auth/drive.file']
    )
    return build('drive', 'v3', credentials=creds)


def take_screenshot():
    global is_clocked_in, user_name
    if not is_clocked_in or not user_id:
        return

    screenshot = ImageGrab.grab()
    timestamp = datetime.now().strftime('%Y-%m-%d_%H-%M-%S')
    filename = f'{user_name}_{timestamp}.png'
    date_str = datetime.now().strftime('%Y-%m-%d')

    with tempfile.NamedTemporaryFile(suffix='.png', delete=False) as tmp:
        screenshot.save(tmp.name)
        tmp_path = tmp.name

    try:
        service = get_drive_service()

        # Find or create date subfolder inside main folder
        subfolder_name = f'{user_name}/{date_str}'
        query = f"name='{date_str}' and '{DRIVE_FOLDER_ID}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false"
        results = service.files().list(q=query, fields='files(id)').execute()
        folders = results.get('files', [])

        if folders:
            folder_id = folders[0]['id']
        else:
            folder_meta = {
                'name': date_str,
                'mimeType': 'application/vnd.google-apps.folder',
                'parents': [DRIVE_FOLDER_ID]
            }
            folder_id = service.files().create(body=folder_meta, fields='id').execute()['id']

        file_metadata = {'name': filename, 'parents': [folder_id]}
        media = MediaFileUpload(tmp_path, mimetype='image/png')
        service.files().create(body=file_metadata, media_body=media).execute()
        print(f'Screenshot uploaded: {filename}')
    except Exception as e:
        print(f'Screenshot upload error: {e}')
    finally:
        os.unlink(tmp_path)


def clock_in(icon=None, item=None):
    global is_clocked_in
    try:
        r = requests.post(f'{API_URL}/time/clock-in', json={'user_id': user_id}, timeout=5)
        if r.ok:
            is_clocked_in = True
            if icon:
                icon.title = f'Team Manager — {user_name} (עובד ✅)'
            take_screenshot()
    except Exception as e:
        print(f'Clock-in error: {e}')


def clock_out(icon=None, item=None):
    global is_clocked_in
    try:
        r = requests.post(f'{API_URL}/time/clock-out', json={'user_id': user_id}, timeout=5)
        if r.ok:
            is_clocked_in = False
            if icon:
                icon.title = f'Team Manager — {user_name} (לא עובד)'
    except Exception as e:
        print(f'Clock-out error: {e}')


def on_quit(icon, item):
    if is_clocked_in:
        clock_out()
    icon.stop()


def run_schedule():
    while True:
        schedule.run_pending()
        time.sleep(30)


def login():
    global user_id, user_name
    root = tk.Tk()
    root.withdraw()
    email = simpledialog.askstring('Team Manager — כניסה', 'הכנס את כתובת המייל שלך:', parent=root)
    root.destroy()

    if not email:
        return False

    try:
        r = requests.post(f'{API_URL}/auth/login', json={'email': email}, timeout=5)
        if r.ok:
            u = r.json()['user']
            user_id = u['id']
            user_name = u['name']
            return True
        else:
            root2 = tk.Tk()
            root2.withdraw()
            messagebox.showerror('שגיאה', 'המייל לא נמצא במערכת', parent=root2)
            root2.destroy()
            return False
    except Exception as e:
        root2 = tk.Tk()
        root2.withdraw()
        messagebox.showerror('שגיאה', f'לא ניתן להתחבר לשרת:\n{e}', parent=root2)
        root2.destroy()
        return False


def create_tray_icon():
    img = Image.new('RGB', (64, 64), color='#2563eb')
    return img


def main():
    if not login():
        return

    schedule.every(SCREENSHOT_INTERVAL).minutes.do(take_screenshot)
    threading.Thread(target=run_schedule, daemon=True).start()

    menu = pystray.Menu(
        pystray.MenuItem(f'שלום, {user_name}', None, enabled=False),
        pystray.Menu.SEPARATOR,
        pystray.MenuItem('Clock In ✅', clock_in),
        pystray.MenuItem('Clock Out 🔴', clock_out),
        pystray.Menu.SEPARATOR,
        pystray.MenuItem('יציאה', on_quit),
    )

    icon = pystray.Icon(
        'Team Manager',
        create_tray_icon(),
        f'Team Manager — {user_name}',
        menu
    )
    icon.run()


if __name__ == '__main__':
    main()
