import requests

cookies = {
    # 'csrftoken': 'ZGY12JoClPP7JZkzhBgijc2o91qq8xdq2EwCkzFlDyiFiTMSBuhpEgnXsq0TTCyc',
    # 'sessionid': 'r8zedb2gc8bsmy9mkjsy70858lyulqnl',
}

headers = {
    'accept': 'application/json, text/plain, */*',
    'accept-language': 'en-IN,en-GB;q=0.9,en-US;q=0.8,en;q=0.7,hi;q=0.6,es;q=0.5',
    'cache-control': 'no-cache',
    'pragma': 'no-cache',
    'priority': 'u=1, i',
    'referer': 'https://www.instahyre.com/candidate/opportunities/?company_size=0&job_type=0&location=Work+From+Home,Noida,Greater+Noida&search=true&skills=backend+developer&years=4',
    'sec-ch-ua': '"Chromium";v="152", "Not?A_Brand";v="24", "Google Chrome";v="152"',
    'sec-ch-ua-mobile': '?0',
    'sec-ch-ua-platform': '"Windows"',
    'sec-fetch-dest': 'empty',
    'sec-fetch-mode': 'cors',
    'sec-fetch-site': 'same-origin',
    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36',
    # 'x-csrftoken': 'ZGY12JoClPP7JZkzhBgijc2o91qq8xdq2EwCkzFlDyiFiTMSBuhpEgnXsq0TTCyc',
    # 'cookie': 'csrftoken=ZGY12JoClPP7JZkzhBgijc2o91qq8xdq2EwCkzFlDyiFiTMSBuhpEgnXsq0TTCyc; sessionid=r8zedb2gc8bsmy9mkjsy70858lyulqnl',
}

params = {
    'company_size': '0',
    'jobLocations': [
        'Work From Home',
        'Noida',
        'Greater Noida',
    ],
    'job_type': '0',
    'skills': 'backend developer',
    'status': '0',
    'years': '4',
}

response = requests.get('https://www.instahyre.com/api/v1/job_search', params=params, cookies=cookies, headers=headers)

print(response)


"""
{
    "objects": [
        {
            "resource_uri": "/api/v1/job_search/439852",
            "employer": {
                "resource_uri": "/api/v1/candidate_opportunity_employer/55285",
                "profile_image_src": "https://media.instahyre.com/images/profile/base/employer/55285/b8d9eca2fb/1726501099265.webp",
                "id": 55285,
                "company_name": "Purple Sphere",
                "company_tagline": "Intelligence and virtualization for safer and greener spaces",
                "company_founded": 2026,
                "employee_count": 1,
                "instahyre_note": "PurpleSphere is an AI-powered B2B SaaS platform that enhances physical security and facility management through real-time threat analysis, machine learning, generative AI, and mobile credential solutions. "
            },
            "interview_status": 0,
            "reviewed_at": null,
            "public_url": "https://www.instahyre.com/job-439852-backend-developer-at-purple-sphere-work-from-home/",
            "is_strong_match": false,
            "score": 0.0,
            "candidate_title": "Backend Developer",
            "id": 439852,
            "title": "Backend Developer",
            "locations": "Work From Home",
            "keywords": [
                "python",
                "apache kafka",
                "go",
                "golang",
                "k8s",
                "kafka",
                "kubernetes"
            ],
            "accept_outstation": true,
            "gender": 0
        },
    ],
    "meta": {
        "offset": 0,
        "limit": 35,
        "total_count": 596,
        "total_count_relation": "eq",
        "previous": null,
        "next": "/api/v1/job_search?company_size=0&jobLocations=Work+From+Home&jobLocations=Noida&jobLocations=Greater+Noida&job_type=0&skills=backend+developer&status=0&years=4&limit=35&offset=35",
        "top_job_functions_count": [
            {
                "id": 10,
                "name": "Backend Development",
                "count": 164,
                "type": "job_function"
            },
            {
                "id": 1,
                "name": "Full-Stack Development",
                "count": 108,
                "type": "job_function"
            },
            {
                "id": 25,
                "name": "Sales / Business Development",
                "count": 89,
                "type": "job_function"
            },
            {
                "id": 9,
                "name": "Data Science / Machine Learning",
                "count": 59,
                "type": "job_function"
            }
        ],
        "top_industry_types_count": [
            {
                "name": 13,
                "count": 396
            },
            {
                "name": 9,
                "count": 57
            },
            {
                "name": 20,
                "count": 36
            },
            {
                "name": 40,
                "count": 34
            }
        ],
        "company_size_count": {
            "small": 267,
            "medium": 122,
            "large": 207
        },
        "top_companies_count": [
            {
                "name": "Accenture",
                "count": 17
            },
            {
                "name": "Adobe",
                "count": 14
            },
            {
                "name": "ConveGenius",
                "count": 14
            },
            {
                "name": "HighLevel",
                "count": 12
            }
        ],
        "top_locations_count": [
            {
                "location": "Work From Home",
                "count": 370
            },
            {
                "location": "Noida",
                "count": 228
            },
            {
                "location": "Greater Noida",
                "count": 7
            },
            {
                "location": "Bangalore",
                "count": 2177
            },
            {
                "location": "Gurgaon",
                "count": 593
            },
            {
                "location": "Mumbai",
                "count": 373
            },
            {
                "location": "Hyderabad",
                "count": 300
            }
        ],
        "job_type_counts": {
            "full_time": 596,
            "internship": 0
        },
        "max_experience": 25,
        "facet_all_counts": {
            "job_functions": 596,
            "company_size": 596,
            "industries": 596,
            "location": 4260,
            "companies": 596,
            "job_type": 596
        },
        "job_experience_levels": {
            "associate": 4926,
            "entry_level": 507,
            "internship": 52,
            "mid_senior": 7752,
            "senior": 10535
        }
    }
}
"""