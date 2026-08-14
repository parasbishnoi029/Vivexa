with open("src/pages/workspace/AIAnalyst.tsx", "r") as f:
    code = f.read()

code = code.replace('import { useState, useEffect } from "react";\nimport { useSearchParams }, useEffect } from "react";', 'import { useState, useEffect } from "react";\nimport { useSearchParams } from "react-router-dom";')

with open("src/pages/workspace/AIAnalyst.tsx", "w") as f:
    f.write(code)
