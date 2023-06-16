import os
import time
import subprocess
import logging
from logging.config import fileConfig
from datetime import datetime, timedelta
from decouple import config

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
