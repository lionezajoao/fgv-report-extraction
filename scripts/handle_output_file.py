import pandas as pd

from src.data_handler import DataHandler

if __name__ == "__main__":

    
    data_handler = DataHandler()
    raw_data = pd.read_excel(f"{ data_handler.path }/temp/unified_siga.xlsx", sheet_name=None)
    output_file = pd.ExcelWriter(f"{ data_handler.path }/output/total_leads.xlsx")
    data_handler.logger.info("Handling output file")

    output_data = []

    for k, v in raw_data.items():
        if "inscritos" in k.lower():
            v["data_cadastro"] = data_handler.parse_date(v["Data Inscrição"])
        else:
            v["data_cadastro"] = data_handler.parse_date(v["Data Interesse"])
            
        sorted_data = v.sort_values(by="data_cadastro", ascending=False)
        data_handler.handle_date_type(sorted_data, "data_cadastro")
        sorted_data['OG'] = k
        output_data.append(sorted_data)

    output = pd.concat(output_data).sort_values(by="data_cadastro", ascending=False)
    data_handler.handle_date_type(output, "data_cadastro")

    output.to_excel(output_file, index=None)
    output_file.close()