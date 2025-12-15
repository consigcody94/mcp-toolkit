"""
Model Forge 3D - Blender Automation Module
Provides headless Blender operations for mesh processing, optimization, and export
"""

__version__ = "1.0.0"

from .automation import BlenderAutomation
from .mesh_optimizer import MeshOptimizer
from .lod_generator import LODGenerator
from .texture_baker import TextureBaker

__all__ = [
    "BlenderAutomation",
    "MeshOptimizer",
    "LODGenerator",
    "TextureBaker",
]
