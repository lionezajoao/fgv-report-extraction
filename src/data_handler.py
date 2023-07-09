import pandas as pd

from utils.util import Utils

class DataHandler(Utils):
    def __init__(self) -> None:
        super().__init__()

    def get_file_names(self, dir, extension):
        file_list = self.list_all_files(self.path + dir, extension).split('\n')
        file_list.pop(-1)
        return file_list
    
    def parse_date(self, date):
        return pd.to_datetime(date, format='mixed', dayfirst=True)
    
    def handle_date_type(self, data, key):
        print(data)
        data[key] = self.parse_date(data[key])

    def handle_course_method(self, data:str) -> str:
        if 'live' in data.lower():
            return 'Live'
        if 'online' in data.lower():
            return 'Online'
        if data.lower() == 'mba':
            return 'Online'
        else:
            return 'Presencial'
        
    def handle_city_name(self, name: str) -> str:
        if "niterói" in name.lower():
            return "Niterói - RJ"
        if "montes" in name.lower():
            return "Montes Claros - MG"
        if "aracaju" in name.lower():
            return "Aracaju - SE"
        if "macaé" in name.lower():
            return "Macaé - RJ"
    
