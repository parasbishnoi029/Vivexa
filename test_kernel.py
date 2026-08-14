import json
import subprocess

config = {
    "datasetPath": "test.csv",
    "datasetName": "test.csv",
    "cellType": "sql",
    "codePath": "test_code.py"
}

with open("test.csv", "w") as f:
    f.write("a,b\n1,2\n3,4")

with open("test_code.py", "w") as f:
    f.write("SELECT * FROM dataset")

with open("test_config.json", "w") as f:
    json.dump(config, f)

subprocess.run(["python3", "server/notebook_kernel_master.py", "test_config.json"])
