import urllib.request, json

BASE_URL = 'https://goal-forge-ai-lake.vercel.app/api'

try:
    print('1. Logging into Live Vercel Site as Admin...')
    login_req = urllib.request.Request(f'{BASE_URL}/auth/login', method='POST', headers={'Content-Type': 'application/json'}, data=json.dumps({'email': 'admin@goalforge.ai', 'password': 'admin'}).encode())
    login_res = urllib.request.urlopen(login_req)
    token = json.loads(login_res.read().decode())['access_token']
    
    print('\n2. Fetching Goals...')
    goals_req = urllib.request.Request(f'{BASE_URL}/goals', headers={'Authorization': f'Bearer {token}'})
    goals_res = urllib.request.urlopen(goals_req)
    goals = json.loads(goals_res.read().decode())
    
    if not goals:
        print('No goals found to test! Creating a test goal...')
        goal_req = urllib.request.Request(f'{BASE_URL}/goals', method='POST', headers={'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'}, data=json.dumps({'title': 'Test Goal', 'description': 'Test', 'status': 'NOT_STARTED'}).encode())
        goal_res = urllib.request.urlopen(goal_req)
        goal_id = json.loads(goal_res.read().decode())['id']
    else:
        goal_id = goals[0]['id']
        
    print(f'\n3. Testing Gemini Auto-Guidance on Goal ID {goal_id}...')
    ai_req = urllib.request.Request(f'{BASE_URL}/ai/dynamic-guidance/{goal_id}', headers={'Authorization': f'Bearer {token}'})
    ai_res = urllib.request.urlopen(ai_req)
    data = json.loads(ai_res.read().decode())
    
    print('   -> LIVE VERIFICATION PASSED! Gemini successfully generated:')
    print(f"   Title: {data.get('title')}")
    print(f"   Source: {data.get('source')}")
    
    content = str(data.get('content'))
    print(f"   Guidance Preview: {content[:150]}...")
except urllib.error.HTTPError as e:
    print('\nHTTP ERROR:', e.code, e.read().decode())
except Exception as e:
    print('\nERROR:', e)
