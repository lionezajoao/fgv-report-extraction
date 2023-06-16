import pandas as pd

from src.data_handler import DataHandler

if __name__ == "__main__":
    
    data_handler = DataHandler()
    sheet_dir = data_handler.get_file_names("/forms", ".xlsx")
    output_file = pd.ExcelWriter(f"{ data_handler.path }/temp/unified_siga.xlsx")
    data_handler.logger.info("Creating output file")

    concat = {}
    
    for sheet in sheet_dir:

        if "Agente" in sheet and "Inscritos" in sheet:
            raw_data = pd.read_excel(f"{ data_handler.path }/forms/{ sheet }", sheet_name=None, header=10)
        elif "Agente" in sheet and "Interessados" in sheet:
            raw_data = pd.read_excel(f"{ data_handler.path }/forms/{ sheet }", sheet_name=None, header=6)
        elif "FGV_MVCSIGA2" in sheet:
            raw_data = pd.read_excel(f"{ data_handler.path }/forms/{ sheet }", sheet_name=None, header=9)

        concat[sheet] = pd.concat(raw_data.values(), axis=0, ignore_index=True)

    for k, v in concat.items():
        if "inscritos" in k.lower():
            data_handler.handle_date_type(v, "Data Inscrição")
        elif "interessados" in k.lower():
            data_handler.handle_date_type(v, "Data Interesse")
        v.to_excel(output_file, sheet_name=k.replace(".xlsx", ""), index=False)

    output_file.close()

