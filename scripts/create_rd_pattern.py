import random
import pandas as pd
from decouple import config

from src.data_handler import DataHandler
from src.crm import CRM

if __name__ == "__main__":

    data_handler = DataHandler()
    crm = CRM()
    logger = data_handler.logger

    logger.info("Creating RD input sheet")
    data = pd.read_excel(f"{ data_handler.path }/output/last_days_leads.xlsx", sheet_name="Sheet1")
    output = pd.ExcelWriter(f"{ data_handler.path }/output/rd_input_{ data_handler.start_date }.xlsx")

    vendor_list = config("VENDOR_LIST").split(",")

    rows = []
    for k, v in data.iterrows():
        course = v.get("Nome Curso") if not pd.isnull(v.get("Nome Curso")) else v.get("Curso")
        vendor = "Dayvid" if v.get("Situação do Inscrito") == "Aguardando confirmação de pagamento" or crm.check_if_cmd(course) else None

        row = {
            "NOME DE CONTATO": v.get("Nome"),
            "NOME DA EMPRESA": v.get("Empresa") if not pd.isnull(v.get("Empresa")) else "Não informado",
            "NOME DA OPORTUNIDADE": v.get("Nome"),
            "EMAIL": v.get("E-mail") if not pd.isnull(v.get("E-mail")) else v.get("Email"),
            "TELEFONE": data_handler.format_phone(str(v.get("Celular"))) if v.get("Celular") is not None else "",
            "PRAÇA": data_handler.handle_city_name(v.get("OG")),
            "CPF": v.get("CPF / Passaporte") if not pd.isnull(v.get("CPF / Passaporte")) else v.get("CPF/Passaporte"),
            "MODALIDADE": v.get("Programa") if not pd.isnull(v.get("Programa")) else "Presencial",
            "FONTE": "Portal FGV EdEx",
            "CURSO": v.get("Nome Curso") if not pd.isnull(v.get("Nome Curso")) else v.get("Curso"),
            "ETAPA FUNIL": "Interessado Pesquisando",
            "RESPONSAVEL": vendor,
            "CAMPANHA": "Sem Campanha",
            "Anotação": v.get("Situação do Inscrito")
        }
        rows.append(row)

    output_list = crm.remove_open_deals(rows)
    logger.info(f"Before duplicate removal: { len(output_list) }")
    
    output_data = pd.DataFrame(output_list)\
        .drop_duplicates(subset=["TELEFONE"])\
        .drop_duplicates(subset=["EMAIL"])\
        .drop_duplicates(subset=["NOME DE CONTATO"])
    
    aux = []
    for index, row in output_data.iterrows():
        if row.get("RESPONSAVEL") == None:
            choice = random.choice(vendor_list)
            output_data.loc[index, "RESPONSAVEL"] = choice
            aux.append(choice)
            vendor_list.remove(choice)

            if vendor_list == []:
                vendor_list = aux
                aux = []

    logger.info(f"Creating sheet with { len(output_data.index) } new leads")
    output_data.to_excel(output, index=None)
    output.close()
