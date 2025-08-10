import smtplib
from email.mime.text import MIMEText
import os

SMTP_HOST = os.getenv('SMTP_HOST', 'localhost')
SMTP_PORT = int(os.getenv('SMTP_PORT', 1025))
SMTP_USER = os.getenv('SMTP_USER', '')
SMTP_PASS = os.getenv('SMTP_PASS', '')
FROM_EMAIL = os.getenv('FROM_EMAIL', 'noreply@finsight.ai')

class EmailService:
    @staticmethod
    def send_otp_email(to_email: str, otp: str):
        print(f"Sending OTP email to {to_email} with OTP {otp}")
        # subject = 'Your FinSight OTP Code'
        # body = f'Your OTP code is: {otp}\n\nThis code will expire in 10 minutes.'
        # msg = MIMEText(body)
        # msg['Subject'] = subject
        # msg['From'] = FROM_EMAIL
        # msg['To'] = to_email

        # try:
        #     with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
        #         if SMTP_USER and SMTP_PASS:
        #             server.starttls()
        #             server.login(SMTP_USER, SMTP_PASS)
        #         server.sendmail(FROM_EMAIL, [to_email], msg.as_string())
        # except Exception as e:
        #     print(f"Failed to send OTP email: {e}")
        #     raise 