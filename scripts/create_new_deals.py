import json
import pandas as pd
from pprint import pprint

from src.crm import CRM
from src.data_handler import DataHandler

if __name__ == "__main__":

    crm = CRM()
    handler = DataHandler()

    files = handler.list_all_files(f"{ handler.path }/output", "xlsx")
    file_name = list(filter(lambda x:"input" in x, files.split("\n")))[0]
    
    product_data = crm.get_products()
    
    raw_data = pd.read_excel(f"{ handler.path }/output/{ file_name }")
    for row in raw_data.iterrows():

        note_text = row[1].get("Anotação") if not pd.isnull(row[1].get("Anotação")) else ""

        vendor_id = crm.get_user_id(row[1].get("RESPONSAVEL"))

        with open(f"{ handler.path }/utils/payload.json") as payload_file:
            payload_data = json.load(payload_file)

        course = row[1].get("CURSO")

        payload_data['name'] = row[1].get("NOME DE CONTATO")
        payload_data['deal_source']['name'] = row[1].get("FONTE")
        payload_data['deal']['name'] = row[1].get("NOME DE CONTATO")
        payload_data['organization']['name'] = row[1].get("NOME DA EMPRESA")
        
        for custom_field in payload_data['deal']['deal_custom_fields']:
            if custom_field['custom_field_id'] == '6315fe5f764d29000ce223b7':
                custom_field['value'] = handler.handle_city_name(row[1].get("PRAÇA"))
            
            elif custom_field['custom_field_id'] == '632723bc66edbc000c7ed982':
                mode = row[1].get("MODALIDADE") if not pd.isnull(row[1].get("MODALIDADE")) else ""
                custom_field['value'] = [handler.handle_course_method(mode)]

        payload_data['contacts'][0]['name'] = row[1].get("NOME DE CONTATO")
        payload_data['contacts'][0]['phones'][0]['phone'] = str(row[1].get("TELEFONE")) if not pd.isnull(row[1].get("TELEFONE")) else ""
        payload_data['contacts'][0]['emails'][0]['email'] = row[1].get("EMAIL") if not pd.isnull(row[1].get("EMAIL")) else ""
        
        payload_data["distribution_settings"]['owner']['id'] = vendor_id

        course_data = list(filter( lambda x:x["name"] == course, product_data["products"] ))

        if len(course_data) == 1:
            payload_data['deal_products'][0]['base_price'] = course_data[0]['base_price']
            payload_data['deal_products'][0]['name'] = course_data[0]['name']
            payload_data['deal_products'][0]['price'] = course_data[0]['base_price']
            payload_data['deal_products'][0]['total'] = course_data[0]['base_price']
        else:
            note_text = f"Nome do curso: { course } \n"

        deal_check = crm.get_deals_by_name(payload_data['name'], exact=True, closed_at=False)
        if deal_check['total'] == 0:
            response = crm.create_new_deal(json.dumps(payload_data))

            if response.status_code == 200:
                note_text += 'Oportunidade criada via automação de extração do SIGA'
                crm.create_note(note_text, response.json()['_id'])
                handler.logger.info(f"Deal created { payload_data['name'] }")
            else:
                handler.logger.error(f"Deal not created { payload_data['name'] }\nReason: { response.json().get('errors') }")
                print('\n')
                pprint(payload_data)
                print('\n')
        else:
            handler.logger.warning(f"Deal { payload_data['name'] } already exists")

    handler.send_email()
