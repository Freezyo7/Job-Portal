import requests

cookies = {
    'csrftoken': 'TPIg4aVASB806TKE0Zmnzk6WakzgPIBWdpcLxOHTYVRaaeTsg299oa1LNGPI4aA5',
}

headers = {
    'accept': 'application/json, text/plain, */*',
    'accept-language': 'en-IN,en-GB;q=0.9,en-US;q=0.8,en;q=0.7,hi;q=0.6,es;q=0.5',
    'cache-control': 'no-cache',
    'content-type': 'application/json',
    'origin': 'https://www.instahyre.com',
    # 'pragma': 'no-cache',
    # 'priority': 'u=1, i',
    'referer': 'https://www.instahyre.com/login/',
    'sec-ch-ua': '"Chromium";v="152", "Not?A_Brand";v="24", "Google Chrome";v="152"',
    # 'sec-ch-ua-mobile': '?0',
    'sec-ch-ua-platform': '"Windows"',
    # 'sec-fetch-dest': 'empty',
    'sec-fetch-mode': 'cors',
    'sec-fetch-site': 'same-origin',
    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36',
    # 'x-csrftoken': 'TPIg4aVASB806TKE0Zmnzk6WakzgPIBWdpcLxOHTYVRaaeTsg299oa1LNGPI4aA5',
    # 'cookie': 'csrftoken=TPIg4aVASB806TKE0Zmnzk6WakzgPIBWdpcLxOHTYVRaaeTsg299oa1LNGPI4aA5',
}

json_data = {
    'email': 'freezy2004.27@gmail.com',
    'password': 'Freezy??nnss#272004',
}

response = requests.post('https://www.instahyre.com/api/v1/users/user_login', cookies=cookies, headers=headers, json=json_data)
print(response)

# Note: json_data will not be serialized by requests
# exactly as it was in the original request.
#data = '{"email":"freezy2004.27@gmail.com","password":"Freezy??nnss#272004"}'
#response = requests.post('https://www.instahyre.com/api/v1/users/user_login', cookies=cookies, headers=headers, data=data)