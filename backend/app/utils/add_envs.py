import subprocess
import sys
import time

envs_to_add = {
    "SMTP_HOST": "smtp-relay.brevo.com",
    "SMTP_PORT": "587",
    "SMTP_USER": "acc1af001@smtp-brevo.com",
    "SMTP_PASSWORD": "gvz5RcL6TmMKZJpB",
    "SMTP_FROM_EMAIL": "harshit2500sharma@gmail.com",
    "SMTP_FROM_NAME": "GoalForge AI"
}

environments = ["production", "development"]

print("Starting to add environment variables to Vercel with real-time output parsing...")
sys.stdout.flush()

for name, value in envs_to_add.items():
    for env in environments:
        cmd = f'npx vercel env add {name} {env} --value "{value}" --yes --force'
        print(f"Adding {name} to {env}...")
        sys.stdout.flush()
        
        # Start the process with stdout piped so we can read it
        proc = subprocess.Popen(cmd, shell=True, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, bufsize=1)
        
        # Read stdout in a non-blocking way using time limit
        start_time = time.time()
        saved = False
        while time.time() - start_time < 15:
            # Check if there is output
            line = proc.stdout.readline()
            if line:
                print(line.strip())
                sys.stdout.flush()
                # If we see success keyword, we can flag it as saved
                if "Added Environment Variable" in line or "Overrode Environment Variable" in line or "Common next commands" in line:
                    saved = True
            
            # If process finished, break
            if proc.poll() is not None:
                break
                
            # If we already got the success message, we can terminate the hanging process early!
            if saved:
                print("Success message detected! Terminating process...")
                sys.stdout.flush()
                proc.terminate()
                proc.wait()
                break
                
            time.sleep(0.05)
            
        # Clean up process if still alive after 15 seconds
        if proc.poll() is None:
            print("Timeout reached. Terminating process...")
            sys.stdout.flush()
            proc.terminate()
            proc.wait()
            
        print(f"Finished {name} to {env}.")
        print("-" * 40)
        sys.stdout.flush()

print("All Vercel environment variables added successfully!")
sys.stdout.flush()
