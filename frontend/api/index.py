import os
import sys

# Add the current folder to sys.path so relative imports work inside Vercel
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from main import app
