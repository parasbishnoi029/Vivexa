with open("src/lib/dataEngine.ts", "r") as f:
    code = f.read()

# Make sure all stats use validNumArr instead of numArr!
code = code.replace(
    "skewness(numArr, meanVal, stdVal)",
    "skewness(validNumArr.length > 0 ? validNumArr : numArr, meanVal, stdVal)"
)
code = code.replace(
    "kurtosis(numArr, meanVal, stdVal)",
    "kurtosis(validNumArr.length > 0 ? validNumArr : numArr, meanVal, stdVal)"
)

with open("src/lib/dataEngine.ts", "w") as f:
    f.write(code)
