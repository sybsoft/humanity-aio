import email
import imaplib
import re

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel


class EmailRequest(BaseModel):
    host: str
    port: int
    email_address: str
    email_password: str


class HumanityCodeParser:
    def parse_humanity_code(self, html_code):
        match = re.search(r'5px">(\d+)', html_code)

        if match:
            number = match.group(1)
            return True, number

        return False, '0x'

    async def clear_email(self, username, password, host, port):
        try:
            mail = imaplib.IMAP4_SSL(host)
            mail.login(username, password)

            mail.select("inbox")

            status, messages = mail.search(None, "ALL")

            for num in messages[0].split():
                mail.store(num, '+FLAGS', '\\Deleted')

            mail.expunge()
            mail.logout()
        except Exception as e:
            print(e)
            return '0x'

    def get_code(self, username, password, host, port):
        mail = imaplib.IMAP4_SSL(host, port)
        mail.login(username, password)

        mail.select("inbox")

        status, email_ids = mail.search(None, "(UNSEEN)")
        email_ids = email_ids[0].split()
        print(email_ids)
        
        for email_id in email_ids:
            status, message_data = mail.fetch(email_id, "(RFC822)")

            for response in message_data:
                if isinstance(response, tuple):
                    msg = email.message_from_bytes(response[1])

                    body = ""
                    if msg.is_multipart():
                        for part in msg.walk():
                            if (part.get_content_type() == "text/html" and
                                    "attachment" not in part.get("Content-Disposition", "")):
                                charset = part.get_content_charset() or "utf-8"
                                body = part.get_payload(decode=True).decode(charset)
                                break
                    else:
                        if msg.get_content_type() == "text/html":
                            charset = msg.get_content_charset() or "utf-8"
                            body = msg.get_payload(decode=True).decode(charset)
                    
                    status, number = self.parse_humanity_code(body)
                    if status:
                        return number
                    else:
                        print("Code not found")
        
        mail.logout()
        return '0x'


app = FastAPI()

@app.post("/check_email")
async def check_email(request: EmailRequest):
    email_address = request.email_address
    password = request.email_password

    parser = HumanityCodeParser()
    number = parser.get_code(email_address, password, request.host, request.port)
    if number != '0x':
        return {"status": "success", "message": number}
    
    return {"status": "error", "message": "invalid"}


@app.post("/clear_email")
async def clear_email(request: EmailRequest):
    email_address = request.email_address
    password = request.email_password
    host = request.host
    port = request.port

    parser = HumanityCodeParser()
    number = await parser.clear_email(email_address, password, host, port)
    if number != '0x':
        return {"status": "success", "message": number}
    
    return {"status": "error", "message": "invalid"}


@app.get("/ping")
async def ping():
    return {"status": "success"}