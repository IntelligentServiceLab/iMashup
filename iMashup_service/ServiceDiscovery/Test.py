import requests

# 星火大模型 API 配置
API_PASSWORD = "vBBoGsfvOiOOjqnRRcPx:PpfvJBAvCrFsfvEQvsMn"  # 替换为自己的 APIPassword
API_URL = "https://spark-api-open.xf-yun.com/v1/chat/completions"
HEADERS = {
    "Authorization": f"Bearer {API_PASSWORD}",
    "Content-Type": "application/json"
}

# 请求-生成函数
def spark_generate_user_request(prompt: str,model: str = "lite",temperature: float = 0.5,max_tokens: int = 4096):
    data = {
        "model": model,
        "messages": [
            {
                "role": "user",
                "content": prompt
            }
        ],
        "temperature": temperature,
        "stream": False,
        "max_tokens": max_tokens,
        "presence_penalty": 0,
        "frequency_penalty": 0,
        "response_format": {"type": "text"},
        "suppress_plugin": ["knowledge"]
    }
    response = requests.post(API_URL, headers=HEADERS, json=data).json()
    if response.get("code") == 0:
        return response["choices"][0]["message"]["content"]
    else:
        raise RuntimeError(f"Spark API Error: {response}")

def main():
    prompt = (
        "1 This endpoint returns the basic information of the company with the given identifier. The information includes all the core data (name, address), web data if known (phone, fax, email, url, social media profiles), legal information (registry, founding date, capital), up to thre..."
        "2 This endpoint returns the basic information of the company, much as GET /companies/{id}/data does. The difference is that you don't need the company identifier in advance. This endpoint assists in finding companies and their identifiers via some fixed attributes, such as compa..."
        "3 This endpoint returns the information about people associated with the company with the given identifier. The information includes names, roles, email addresses, and phone numbers, if available."
        "4 This endpoint returns the information about people associated with the company, much as GET /companies/{id}/people does. The difference is that you don't need the company identifier in advance. This endpoint assists in finding companies and their identifiers via some fixed att..."
        "5 This endpoint returns the latest events about the company with the given identifier since the given timestamp. This timestamp is optional and is specified via a query parameter. Events come with a type (companies' register event, blog article, press release, etc.), a category ..."
        "6 This endpoint returns the latest events about the company with the given identifier since the given timestamp, much as GET /companies/{id}/events does. The difference is that you don't need the company identifier in advance. This endpoint assists in finding companies and their..."
        "7 This endpoint returns the latest job postings about the company with the given identifier since the given timestamp. This timestamp is optional and is specified via a query parameter. Job postings come with a title, a text (the content of the posting), a source, and a timestam..."
        "8 This endpoint returns the latest job postings about the company with the given identifier since the given timestamp, much as GET /companies/{id}/jobs does. The difference is that you don't need the company identifier in advance. This endpoint assists in finding companies and t..."
        "9 This endpoint returns the financial key figures (balance sheet total, revenue, profit, number of employees) for the company with the given identifier. For each key figure the endpoint returns a list of values associated with the corresponding year."
        "10This endpoint returns the financial key figures (balance sheet total, revenue, profit, number of employees) for the company with the given identifier, much as GET /companies/{id}/financials does. The difference is that you don't need the company identifier in advance. This end..."
        "11This endpoint returns the list of years for which financial key figures (balance sheet total, revenue, profit, number of employees) for the company with the given identifier are available. The purpose of this endpoint is to give the user the opportunity to avoid potentially ex..."
        "12This endpoint returns the list of years for which financial key figures (balance sheet total, revenue, profit, number of employees) for the company with the given identifier are available, much as GET /companies/{id}/financials/exists does. The difference is that you don't nee..."
        "13IMPORTANT: This endpoint is replicated here for convenience only. You can obtain the exact same endpoint free of charge from the Implisense German Company Lookup and Activity..."
        "14This endpoint lets you create a new search request, which may include one or more search strings and various filters, and returns the search result. In addition to the actual search result, the search facets (roughly speaking, statistics about the search result that give you i..."
        "15Search for property records in a geographical area, or around a specific address. Returns the property features, owner details, tax assessment, and other property information. More i..."
        "16Returns a single property record matching the specified id, if it exists. Property ids can be obtained via the /properties, /saleListings or /rentalListings endpoints."
        "17Returns a list of property records selected at random up to the specified limit, to facilitate applications requiring samples of randomly selected property data. More info."
        "18Returns a property value estimate and comparable sale listings for an address or lat/long coordinate. Providing property feature parameters will improve the estimate accuracy. More i..."
        "19Returns a rent estimate and comparable rental listings for an address or lat/long coordinate. Providing property feature parameters will improve the estimate accuracy. More info...."
        "20Search for sale listings in a geographical area or around a specific location. Returns the listed price, date, property features, and other listing information. More info."
        "以上是20段 API 的功能描述，请根据以上功能描述提取出其中关键词并适当润色，模拟对应的20条用户的真实功能需求，并直接输出需求的内容。"
    )
    result = spark_generate_user_request(prompt)
    print(result)


if __name__ == "__main__":
    main()
