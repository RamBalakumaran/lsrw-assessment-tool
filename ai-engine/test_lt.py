import language_tool_python
import time

start = time.time()
tool = language_tool_python.LanguageToolPublicAPI('en-US')
matches = tool.check('This are a test.')
print("Public API took:", time.time() - start)
