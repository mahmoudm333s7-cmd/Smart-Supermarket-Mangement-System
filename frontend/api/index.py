import os
import sys

# Get the path of the directory containing the 'api' folder
api_parent_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(api_parent_dir)

# Import app as a package module so relative imports inside it work correctly
from api.main import app
