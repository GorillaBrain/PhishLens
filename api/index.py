"""Vercel serverless function entry point.

This file wraps the FastAPI application for Vercel's Python runtime.
Vercel expects a WSGI/ASGI app object named 'app' in this file.
"""
import sys
import os

# Add the api directory to the Python path so imports work correctly
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from main import app

# Vercel expects the 'app' variable
