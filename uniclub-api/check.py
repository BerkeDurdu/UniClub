import sys
from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parent))
try:
    from main import app
    print("App imported successfully without syntax or import errors!")
except Exception as e:
    import traceback
    traceback.print_exc()
