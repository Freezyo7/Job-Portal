import requests

cookies = {
    'csrftoken': 'ZGY12JoClPP7JZkzhBgijc2o91qq8xdq2EwCkzFlDyiFiTMSBuhpEgnXsq0TTCyc',
    'sessionid': 'r8zedb2gc8bsmy9mkjsy70858lyulqnl',
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
    'x-csrftoken': 'ZGY12JoClPP7JZkzhBgijc2o91qq8xdq2EwCkzFlDyiFiTMSBuhpEgnXsq0TTCyc',
    # 'cookie': 'csrftoken=ZGY12JoClPP7JZkzhBgijc2o91qq8xdq2EwCkzFlDyiFiTMSBuhpEgnXsq0TTCyc; sessionid=r8zedb2gc8bsmy9mkjsy70858lyulqnl',
}

params = {
    'jobId': '439852',
}

response = requests.get(
    'https://www.instahyre.com/api/v1/employer_misc/employer_profile/anon_employer/55285',
    params=params,
    cookies=cookies,
    headers=headers,
)

"""
{
    "resource_uri": "/api/v1/employer_misc/employer_profile/anon_employer/55285",
    "profile_image_src": "https://media.instahyre.com/images/profile/base/employer/55285/b8d9eca2fb/1726501099265.webp",
    "media_coverage": [],
    "office_photos": [],
    "industries": "Computer Software / IT / Internet",
    "social_accounts": {
        "resource_uri": "/api/v1/brand_page/employer_social/55045",
        "employer": "/api/v1/employer_misc/employer_profile/employer/55285",
        "id": 55045,
        "linkedin": "https://www.linkedin.com/company/purple-sphere-ai/about/",
        "facebook": "",
        "twitter": "",
        "instagram": "",
        "website": "https://www.purplesphere.ai/",
        "android_app": "",
        "ios_app": ""
    },
    "benefits": [],
    "location": [
        "California",
        "United States"
    ],
    "tech_stack": [
        "Python",
        "Snowflake",
        "Machine Learning",
        "Kafka",
        "Apache Server",
        "PostgreSQL",
        "Cloud Computing",
        "Snowflake",
        "BigQuery",
        "Amazon Redshift"
    ],
    "company_founded": 2026,
    "glassdoor_data": null,
    "industry_types": [
        {
            "resource_uri": "/api/v1/industry_type/13",
            "id": 13,
            "name": "Computer Software / IT / Internet"
        }
    ],
    "company_name": "Purple Sphere",
    "company_name_nopunc": "purplesphere",
    "why_us": "",
    "tech_stack_description": "",
    "summary": "<html><body><p>PurpleSphere is an AI-powered B2B SaaS platform designed to transform physical security and facility management. Leveraging PACS metadata and advanced machine learning algorithms, we provide real-time threat and risk analysis, ensuring safer and more efficient operations. Our platform also integrates generative AI to enhance user experiences and streamline security processes. With mobile credential solutions for seamless onboarding and advanced security protocols, PurpleSphere empowers businesses with sustainable, intelligent, and proactive security management.</p><p><br /></p></body></html>",
    "company_video_link": null,
    "slug": "purple-sphere",
    "company_tagline": "Intelligence and virtualization for safer and greener spaces",
    "employee_count": 1,
    "interview_process": "",
    "jobs": [
        {
            "resource_uri": "/api/v1/employer_public_jobs/439852",
            "opportunity_url": "/job-439852-backend-developer-at-purple-sphere-work-from-home/",
            "employer_profile_url": "https://media.instahyre.com/images/profile/base/employer/55285/b8d9eca2fb/1726501099265.webp",
            "hiring_company_name": "Purple Sphere",
            "candidate_title": "Backend Developer",
            "is_internship": false,
            "id": 439852,
            "title": "Backend Developer",
            "is_active": true,
            "locations": [
                "Work From Home"
            ],
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
            "gender": 0,
            "job_category": "Software Engineering",
            "description": "<html><body><p><strong>Responsibilities: </strong></p><ul><li>Design and implement distributed, fault-tolerant streaming pipelines using Kafka, Apache Flink, and MQTT.</li><li>Build event-driven microservices for real-time data processing and analytics.</li><li>Optimise streaming applications for performance, throughput, and latency.</li><li>Deploy and manage containerised applications on Kubernetes clusters.</li><li>Implement monitoring, alerting, and auto-scaling strategies for streaming workloads.</li><li>Troubleshoot production issues and ensure system reliability.</li><li>Collaborate with cross-functional teams and mentor junior developers.</li></ul><p><br /></p><p><strong>Requirements: </strong></p><ul><li>3+ years in backend development with 2+ years in real-time streaming systems.</li><li>Proven track record of building production systems handling and gt 100K messages/second.</li><li>Data Structures and Algorithms: Extremely strong foundation in data structures and algorithms with the ability to design optimal solutions for complex problems.</li><li>Programming: Strong proficiency in Python and Golang, with deep understanding of concurrent and async programming.</li><li>Streaming Systems: Expert-level proficiency with Apache Kafka (including Kafka Streams), hands-on experience with Apache Flink, and working knowledge of the MQTT protocol.</li><li>Containerization: Proficiency with Docker and Kubernetes, including deployment and orchestration of distributed applications.</li><li>Distributed Systems: Solid understanding of distributed systems concepts, event- driven architecture, and streaming design patterns.</li><li>Databases: Experience with time-series databases and NoSQL stores (Cassandra, MongoDB).</li></ul><p><br /></p><p><strong>Preferred Skillset: </strong></p><ul><li>Experience with ELK Stack (Elasticsearch, Logstash, Kibana) for log aggregation and analytics.</li><li>Cloud platform experience (AWS, GCP, or Azure).</li><li>Knowledge of Apache Beam or similar unified processing frameworks.</li><li>Experience with ML/AI integration in streaming pipelines.</li><li>Open-source contributions to streaming projects.</li></ul></body></html>",
            "workex_min": 3,
            "workex_max": 5,
            "job_functions": [],
            "internship": null,
            "recruiter_name": "T A",
            "recruiter_designation": "Talent Acquisition Specialist",
            "recruiter_company_name": "Flairchase",
            "recruiter_profile_url": "https://media.instahyre.com/images/profile/base/recruiter/82301/193eea91f2/tmp9wtBg3.webp",
            "agency_function_names": [
                "Backend Development"
            ],
            "job_function_dict": {
                "Software Engineering": [
                    "Backend Development"
                ]
            }
        }
    ],
    "jobs_count": 1
}
"""


"""
for remote job
{
    "resource_uri": "/api/v1/employer_misc/employer_profile/anon_employer/53691",
    "profile_image_src": "https://media.instahyre.com/images/profile/base/employer/53691/adb713e2cc/aiprise_inc_logo.webp",
    "media_coverage": [],
    "office_photos": [
        {
            "resource_uri": "/api/v1/brand_page/office_photo/74429",
            "image_url": "https://media.instahyre.com/CACHE/images/images/office-photos/base/53691/9e014d047d/1766504743658/c2b9708cee933b026ac01760a5438782.webp",
            "thumbnail_url": "https://media.instahyre.com/CACHE/images/images/office-photos/base/53691/9e014d047d/1766504743658/ea230d1688b679ad817b5f063f51a5c6.webp",
            "id": 74429,
            "title": "1766504743658.webp"
        },
        {
            "resource_uri": "/api/v1/brand_page/office_photo/74430",
            "image_url": "https://media.instahyre.com/CACHE/images/images/office-photos/base/53691/b63d22263d/1766504736424/cb3c2a3c14cb7e10f39fee45c472fa8b.jpg",
            "thumbnail_url": "https://media.instahyre.com/CACHE/images/images/office-photos/base/53691/b63d22263d/1766504736424/3b66635c03ea3afa6cc39421c56d01ec.jpg",
            "id": 74430,
            "title": "1766504736424.jpg"
        },
        {
            "resource_uri": "/api/v1/brand_page/office_photo/74431",
            "image_url": "https://media.instahyre.com/CACHE/images/images/office-photos/base/53691/3533cab904/1766504737391/45df8aa528a44dc4f4dbb84dcdaa31d5.jpg",
            "thumbnail_url": "https://media.instahyre.com/CACHE/images/images/office-photos/base/53691/3533cab904/1766504737391/effdf0bcd0ab34b9db4d974114c02fee.jpg",
            "id": 74431,
            "title": "1766504737391.jpg"
        },
        {
            "resource_uri": "/api/v1/brand_page/office_photo/74432",
            "image_url": "https://media.instahyre.com/CACHE/images/images/office-photos/base/53691/ee36f66157/1766504739262/dbf7233b3886d3655481a3fd640b976c.webp",
            "thumbnail_url": "https://media.instahyre.com/CACHE/images/images/office-photos/base/53691/ee36f66157/1766504739262/518129d4c0d364b72173280a1087ea2e.webp",
            "id": 74432,
            "title": "1766504739262.webp"
        }
    ],
    "industries": "Banking / Financial Services",
    "social_accounts": {
        "resource_uri": "/api/v1/brand_page/employer_social/53468",
        "employer": "/api/v1/employer_misc/employer_profile/employer/53691",
        "id": 53468,
        "linkedin": "https://www.linkedin.com/company/aiprise/about/",
        "facebook": "",
        "twitter": "https://x.com/aiprise",
        "instagram": "",
        "website": "https://www.aiprise.com/",
        "android_app": "",
        "ios_app": ""
    },
    "benefits": [
        "Hyper-growth environment",
        "Competitive compensation",
        "Equity",
        "Remote-friendly culture"
    ],
    "location": [
        "California",
        "United States"
    ],
    "tech_stack": [
        "Kubernetes",
        "Kafka",
        "RabbitMQ",
        "NoSQL",
        "MongoDB",
        "Amazon DynamoDB",
        "AWS",
        "Docker",
        "Google Cloud",
        "Azure",
        "MySQL",
        "React.js",
        "TypeScript",
        "Python",
        "Flask",
        "Node.js",
        "SQL",
        "PostgreSQL",
        "Golang",
        "Java"
    ],
    "company_founded": 2022,
    "glassdoor_data": null,
    "industry_types": [
        {
            "resource_uri": "/api/v1/industry_type/9",
            "id": 9,
            "name": "Banking / Financial Services"
        }
    ],
    "company_name": "AiPrise",
    "company_name_nopunc": "aiprise",
    "why_us": "<html><body><ul><li>Work directly with founders and own mission-critical parts of the company.</li><li>Opportunity to shape the finance organization from the ground up.</li><li>Hyper-growth environment; you'll see the impact of your work immediately.</li><li>A truly global team across the US, the UK, India, and Mexico.</li><li>Competitive compensation, equity, and a remote-friendly culture.</li></ul><p><br /></p><p><br /></p></body></html>",
    "tech_stack_description": "",
    "summary": "<html><body><p><span>AiPrise (YC S22) is a global compliance infrastructure company helping financial institutions and fintechs - including banks, cross-border payment providers, stablecoin companies, and marketplaces gain a 360 view of the businesses they onboard. Through a single integration, AiPrise provides access to 8,000+ local and international data sources and an orchestration layer that connects to 80+ verification partners worldwide. The platform goes beyond basic registry checks with website analysis, document intelligence, UBO and parent-company insights, sanctions screening, and ongoing monitoring, helping teams make confident decisions and stay aligned with regulatory expectations across jurisdictions.</span></p></body></html>",
    "company_video_link": null,
    "slug": "aiprise",
    "company_tagline": "AI powered global compliance platform",
    "employee_count": 10,
    "interview_process": "",
    "jobs": [
        {
            "resource_uri": "/api/v1/employer_public_jobs/411980",
            "opportunity_url": "/job-411980-backend-developer-at-aiprise-work-from-home/",
            "employer_profile_url": "https://media.instahyre.com/images/profile/base/employer/53691/adb713e2cc/aiprise_inc_logo.webp",
            "hiring_company_name": "AiPrise",
            "candidate_title": "Backend Developer",
            "is_internship": false,
            "id": 411980,
            "title": "Backend Developer",
            "is_active": true,
            "locations": [
                "Work From Home"
            ],
            "keywords": [
                "AWS",
                "Algorithms",
                "CI / CD",
                "Data Structures",
                "Django",
                "FastAPI",
                "Flask",
                "Google Cloud (GCP)",
                "Microservices",
                "NoSQL",
                "Python",
                "SQL"
            ],
            "accept_outstation": true,
            "gender": 0,
            "job_category": "Software Engineering",
            "description": "<html><body><p>We're hiring a Software Engineer II to help build and scale the core platform behind AiPrise's compliance orchestration and AI agent systems. This is a build it, ship it, own it role. You'll take features end to end, from design to code to deploy to iterate, across our case management product, vendor integrations, orchestration APIs, and customer-facing tools. You'll be in the trenches with founders and a fast-moving team, turning messy real-world compliance problems into clean, reliable systems. If you're a hungry engineer who wants real ownership, high impact, and a product that gets used in production every day, you'll love this. This is an in-person role based in our San Jose, CA office (5 days/week). You'll work directly with our product and engineering teams to deliver high-quality features that help global fintechs fight financial crime. As an SDE2 you'll mentor junior engineers and help establish engineering best practices.</p><p><br /></p><p>The core responsibilities for the job include the following:</p><p><br /></p><p><strong>Build and Own Features End-to-End: </strong></p><ul><li>Design, develop, and ship production features across our platform stack (backend APIs, data pipelines, integrations, and case management UI).</li><li>Own complete features from requirements gathering to implementation, deployment, and monitoring.</li><li>Build scalable REST APIs and microservices that orchestrate checks across 80+ compliance vendors (identity verification, sanctions screening, and document analysis).</li><li>Develop case management workflows and business logic for KYB/AML compliance processes.</li><li>Create data pipelines for ingesting, transforming, and routing compliance data at scale.</li><li>Integrate with third-party identity/compliance APIs and handle complex vendor response mapping.</li></ul><p><br /></p><p><strong>Drive Technical Excellence: </strong></p><ul><li>Write clean, maintainable, well-tested code with comprehensive documentation.</li><li>Participate in code reviews and contribute to engineering best practices.</li><li>Debug production issues with urgency; own incident resolution end-to-end.</li><li>Optimize system performance, reliability, and cost-efficiency.</li><li>Build monitoring, alerting, and observability into your features.</li></ul><p><br /></p><p><strong>Collaborate: </strong></p><ul><li>Work cross-functionally with product managers, compliance experts, and customer success teams.</li><li>Contribute to technical decision-making and architecture discussions.</li><li>Help shape engineering culture and development workflows as the team scales.</li></ul><p><br /></p><p><strong>Requirements: </strong></p><ul><li>2-4 years of professional software engineering experience building and shipping production systems.</li><li>Strong programming fundamentals in at least one modern backend language (Python, Go, Java, Node.js, or similar).</li><li>Experience building RESTful APIs, microservices, or distributed systems.</li><li>Solid understanding of relational databases (PostgreSQL, MySQL) and data modeling.</li><li>Hands-on experience with cloud platforms (AWS preferred, GCP/Azure acceptable).</li><li>Familiarity with Git, CI/CD pipelines, Docker, and modern deployment practices.</li><li>Proven ability to own features end-to-end; you've taken projects from ambiguous requirements through production launch.</li><li>Strong debugging and problem-solving skills; comfortable working in unfamiliar codebases.</li><li>Excellent communication skills and ability to translate business needs into technical solutions.</li><li>Experience mentoring or supporting junior engineers (formal or informal).</li></ul><p><br /></p><p><strong>Nice-to-Have: </strong></p><ul><li>Experience in FinTech, RegTech, payments, or fraud/risk detection domains.</li><li>Knowledge of compliance workflows (KYC/KYB, AML, sanctions screening, adverse media).</li><li>Experience with event-driven architectures and message queues (Kafka, RabbitMQ, AWS SQS).</li><li>Familiarity with NoSQL databases (MongoDB, DynamoDB) or search engines (Elasticsearch).</li><li>Experience integrating with third-party APIs and managing vendor relationships at scale.</li><li>Frontend development experience (React, TypeScript) for building internal tools.</li><li>Background working with ML/AI systems or data-intensive applications.</li><li>Kubernetes, Terraform, or infrastructure-as-code experience.</li></ul></body></html>",
            "workex_min": 2,
            "workex_max": 6,
            "job_functions": [],
            "internship": null,
            "recruiter_name": "Kaberi Baruah",
            "recruiter_designation": "Lead Tech Recruiter",
            "recruiter_company_name": "GetHyr",
            "recruiter_profile_url": "https://media.instahyre.com/images/profile/base/recruiter/99350/53157f4336/tmpS2cC4N.webp",
            "agency_function_names": [
                "Backend Development"
            ],
            "job_function_dict": {
                "Software Engineering": [
                    "Backend Development"
                ]
            }
        }
    ],
    "jobs_count": 1
}
"""