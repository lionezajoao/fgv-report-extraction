import os
import time
import smtplib
import logging
import textwrap
import subprocess
from decouple import config
from logging.config import fileConfig
from datetime import datetime, timedelta

from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.application import MIMEApplication
from email.utils import COMMASPACE, formatdate

class Utils:
    def __init__(self) -> None:
        self.path = os.path.dirname(os.path.dirname(os.path.realpath(__file__)))
        fileConfig(f'{ self.path }/utils/logging_config.ini')
        self.logger = logging.getLogger()
        self.start_date = datetime.strftime(datetime.now(), "%d%m%Y")
        self.end_date = self.format_date(self.format_date(self.start_date) - timedelta(days=365))
        self.vendor_list = config("VENDOR_LIST").split(",")

    def format_date(self, date) -> str or datetime:
        if type(date) == str:
            return datetime.strptime(date, "%d%m%Y")
        else:
            return datetime.strftime(date, "%d%m%Y")
        
    def change_file_name(self, file_name) -> None:
        self.logger.info(f"Changing file { file_name } name")
        time.sleep(5)
        temp_file = subprocess.run(
            ['grep', '.xlsx'],
            stdin=subprocess.Popen(
                ['ls'], stdout=subprocess.PIPE
            ).stdout,
            capture_output=True).stdout.decode('utf-8').removesuffix('\n')
        
        self.logger.info(f"Moving {temp_file} from /temp dir to /forms dir")
        time.sleep(2)
        subprocess.run(['cp', f'{temp_file}', f'forms/{file_name} - {temp_file}'])
        subprocess.call(['rm -rf *.xlsx'], shell=True)

    def list_all_files(self, path, file_extension) -> str:
        return subprocess.run(
            ['grep', file_extension],
            stdin=subprocess.Popen(
                ['ls', path], stdout=subprocess.PIPE
            ).stdout,
            capture_output=True).stdout.decode('utf-8')
    
    def send_email(self):

        msg = MIMEMultipart()
        msg['Subject'] = f'SIGA data extraction { datetime.strftime(datetime.now(), "%d/%m/%Y %H:%M:%S") }' 
        msg['From'] = config("SENDER")
        msg['Date'] = formatdate(localtime=True)
        msg['To'] = config("RECIEVER")
        msg.attach(MIMEText(textwrap.dedent(f"""\
        Segue em anexo as planilhas extraídas via automação do SIGA.
        Email enviado automaticamente em { datetime.strftime(datetime.now(), "%d/%m/%Y %H:%M:%S") }
        """)))

        files = self.list_all_files(f"{ self.path }/output", ".xlsx")

        for file in files.split("\n"):
            if file and "last_days" not in file:
                with open(f"{ self.path }/output/{ file }", "rb") as fil:
                    part = MIMEApplication(
                        fil.read(),
                        Name=file
                    )
                # After the file is closed
                part['Content-Disposition'] = 'attachment; filename="%s"' % file
                msg.attach(part)
        
        smtp = smtplib.SMTP('smtp.gmail.com', 587)
        smtp.starttls()
        smtp.login(config("SENDER"), config("SENDER_PASS"))
        response = smtp.sendmail(config("SENDER"), config("RECIEVER"), msg.as_string())
        print(response)
        smtp.quit()


