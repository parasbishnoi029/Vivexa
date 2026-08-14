with open("src/components/ui/project-wizard.tsx", "r") as f:
    code = f.read()

code = code.replace("Next Step", "Continue")

with open("src/components/ui/project-wizard.tsx", "w") as f:
    f.write(code)
