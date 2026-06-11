import language_tool_python
tool = language_tool_python.LanguageTool('en-US')
matches = tool.check("I has a error.")
if matches:
    m = matches[0]
    print("Attributes:", dir(m))
    print("MATCH OBJECT:", m)
else:
    print("No matches found to inspect.")
