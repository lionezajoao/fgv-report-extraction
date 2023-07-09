import json
import requests
from decouple import config

class CRM:
    def __init__(self) -> None:
        self.token = config("RD_TOKEN")
        self.base_url = "https://crm.rdstation.com/api/v1"

    def get_pipeline_id(self, pipe_name=str) -> str:
        response = requests.get(f"{ self.base_url }/deal_pipelines/?token={ self.token }")
        for pipe in response.json():
            if pipe.get("name") == pipe_name:
                return pipe.get("id")
            
    def get_pipeline_data(self, id=str) -> dict:
        return requests.get(f"{ self.base_url }/{id}/?token={ self.token }").json()

    def get_pipeline_stages(self, pipe_id=str) -> dict:
        return requests.get(f"{ self.base_url }/deal_stages?deal_pipeline_id={ pipe_id }&token={ self.token }").json()

    def get_deals(self, page_num) -> dict:
        return requests.get(f"{ self.base_url }/deals?&token={ self.token }&limit=1000&page={ page_num }").json()
    
    def get_deal_by_id(self, id: str) -> dict:
        return requests.get(f"{ self.base_url }/deals/{ id }/?&token={ self.token }").json()

    def get_deals_by_name(self, deal_name: str, exact: bool = None, closed_at: bool = None) -> dict:
        return requests.get(f"{ self.base_url }/deals?&token={ self.token }&limit=200&name={ deal_name }&exact_name={ exact }&closed_at={ closed_at }").json()

    def get_products(self):
        return requests.get(f"{ self.base_url }/products?&token={ self.token }&limit=200").json()

    def create_new_deal(self, deal_payload:object):
        return requests.post(f"{ self.base_url }/deals/?token={ self.token }", data=deal_payload, headers={ "accept": "application/json", "content-type": "application/json" })
    
    def get_all_deals(self):
        total_deals = []
        page_num = 0
        while True:
            print("Page: ", page_num)
            page_num += 1
            deal_batch = self.get_deals(page_num)['deals']
            total_deals += deal_batch

            if len(deal_batch) == 0:
                break

        return total_deals

    def check_if_cmd(self, name: str) -> bool:
        if "mba" in name.lower() or "pos" in name.lower() or "pós" in name.lower() or "ll.m" in name.lower():
            return False
        else:
            return True
    
    def search_contacts_by_email(self, email:str) -> requests.Response:
        return requests.get(f"{ self.base_url }/contacts?token={ self.token }&email={ email }").json()
    
    def remove_open_deals(self, data):
        output_list = []
        for i in range(len(data)):
            contact_data = self.search_contacts_by_email(data[i]['EMAIL'])

            if contact_data.get("total") and contact_data["total"] > 0:
                contact_data = contact_data.get('contacts')[0]
                contact_name = contact_data['name']
                deals_list = contact_data["deals"]
                if len(deals_list) == 0:
                    output_list.append(data[i])
            else:
                contact_name = data[i]["NOME DE CONTATO"]
            
            deal_data = self.get_deals_by_name(contact_name, False, False)
            if deal_data.get("total") == 0:
                output_list.append(data[i])

        return output_list
    
    # Fix this method with user role and define
    # vendor id within rd_input sheet
    def list_active_users(self):
        data = requests.get(f"{ self.base_url }/users?token={ self.token }").json()
        # list(filter(lambda x:x["name"] if x["active"] and x[""]))
        return
    
    def get_user_id(self, username: str) -> str or None:
        data = requests.get(f"{ self.base_url }/users?token={ self.token }").json()
        for user in data["users"]:
            if username in user["name"]:
                return user["id"]
            
    def get_user_email(self, username:str) -> str or None:
        data = requests.get(f"{ self.base_url }/users?token={ self.token }").json()
        for user in data["users"]:
            if username in user["name"]:
                return user["email"]
            
    def create_note(self, note_data:str, deal_id:str) -> requests.Response:
        headers = {
            "accept": "application/json",
            "content-type": "application/json"
        }

        payload = {
            "activity": {
                "deal_id": deal_id,
                "text": note_data,
                "user_id": config("RD_USER_ID")
        }}
        return requests.post(f"{ self.base_url }/activities?token={ self.token }", data=json.dumps(payload), headers=headers)

        