import pandas as pd
from datetime import datetime, timedelta
from pandas.tseries.offsets import BDay

from src.data_handler import DataHandler

if __name__ == "__main__":

    data_handler = DataHandler()

    data = pd.read_excel(f"{ data_handler.path }/output/total_leads.xlsx", sheet_name="Sheet1")
    last_leads = pd.ExcelWriter(f"{ data_handler.path }/output/last_days_leads.xlsx")

    # Timedelta +1 to get end_date as the next day, but midnight
    end_date = datetime.strptime(datetime.today().strftime('%d/%m/%Y'), '%d/%m/%Y') + timedelta(days=1)
    # BDay(2) to get the previous business day
    start_date = end_date - BDay(3)

    (data
        .loc[lambda x: x["data_cadastro"] >= start_date]
        .loc[lambda x: x["data_cadastro"] <= end_date]
    ).to_excel(last_leads, index=None)
    last_leads.close()
